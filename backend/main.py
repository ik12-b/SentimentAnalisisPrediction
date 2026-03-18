from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import torch
import torch.nn as nn
import torch.nn.functional as F
import os
import re

app = FastAPI(title="SentiPulse API", description="Sentiment Analysis Prediction API")

# Allow CORS for the frontend
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class SentimentModel(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim):
        super(SentimentModel, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.fc1 = nn.Linear(embed_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, 3)

    def forward(self, x):
        x = self.embedding(x)
        x = x.mean(dim=1)  # GlobalAveragePooling
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# Path to the model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model", "sentiment_inference.pth")

# Global variables to store model and tokenizer
model = None
tokenizer = None
max_len = 10
vocab_size = 1000

def load_model():
    global model, tokenizer, max_len
    if not os.path.exists(MODEL_PATH):
        print(f"Model not found at {MODEL_PATH}")
        return

    try:
        # Load the checkpoint
        ckpt = torch.load(MODEL_PATH, weights_only=False, map_location=torch.device('cpu'))
        
        global vocab_size
        vocab_size = ckpt['vocab_size']
        embed_dim = ckpt['embed_dim']
        hidden_dim = ckpt['hidden_dim']
        max_len = ckpt['max_len']
        tokenizer = ckpt['tokenizer']
        
        model = SentimentModel(vocab_size, embed_dim, hidden_dim)
        model.load_state_dict(ckpt['model_state_dict'])
        model.eval()
        print("Model loaded successfully")
    except Exception as e:
        print(f"Error loading model: {e}")

@app.on_event("startup")
async def startup_event():
    load_model()

class PredictRequest(BaseModel):
    text: str

class PredictResponse(BaseModel):
    label: str
    confidence: float

@app.get("/")
async def root():
    return {"status": "online", "model": "SentiPulse-MLP-v1"}

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    return run_inference(request.text)

class BatchPredictRequest(BaseModel):
    texts: list[str]

@app.post("/predict/batch")
async def predict_batch(request: BatchPredictRequest):
    results = [run_inference(text) for text in request.texts]
    return results

@app.post("/predict/file")
async def predict_file(file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Only CSV or TXT files are supported")
    
    content = await file.read()
    text_data = content.decode('utf-8')
    
    texts_to_process = []
    if file.filename.endswith('.csv'):
        # Simple CSV parsing (assuming first column or column named 'text'/'tweet')
        import io
        import csv
        f = io.StringIO(text_data)
        reader = csv.DictReader(f)
        if reader.fieldnames and 'text' in [fn.lower() for fn in reader.fieldnames]:
            col_name = next(fn for fn in reader.fieldnames if fn.lower() == 'text')
            texts_to_process = [row[col_name] for row in reader if row[col_name]]
        else:
            # Fallback to first column
            f.seek(0)
            reader = csv.reader(f)
            next(reader, None) # skip header
            texts_to_process = [row[0] for row in reader if row]
    else:
        # TXT: line by line
        texts_to_process = [line.strip() for line in text_data.split('\n') if line.strip()]

    if not texts_to_process:
        raise HTTPException(status_code=400, detail="No valid text found in file")

    results = [run_inference(text) for text in texts_to_process[:500]] # Limit to 500 for safety
    return {
        "filename": file.filename,
        "total": len(texts_to_process),
        "processed": len(results),
        "results": results
    }

def run_inference(text: str):
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    cleaned_text = text.lower()
    cleaned_text = re.sub(r'[!"#$%&()*+,-./:;<=>?@[\\]^_{|}~\t\n]', '', cleaned_text)
    tokens = cleaned_text.split()
    
    oov_idx = tokenizer.get('<OOV>', 1)
    seq = [tokenizer.get(t, oov_idx) for t in tokens]
    
    # Guard against indices out of range for the embedding layer
    seq = [s if s < vocab_size else oov_idx for s in seq]
    seq = [s if s < vocab_size else 0 for s in seq] # Final fallback
    
    if len(seq) > max_len:
        seq = seq[:max_len]
    else:
        seq = seq + [0] * (max_len - len(seq))
    
    input_tensor = torch.tensor([seq], dtype=torch.long)
    
    with torch.no_grad():
        logits = model(input_tensor)
        probs = F.softmax(logits, dim=1).squeeze()
    
    labels = ['Negative', 'Neutral', 'Positive']
    max_idx = torch.argmax(probs).item()
    
    return {
        "text": text,
        "label": labels[max_idx],
        "confidence": float(probs[max_idx])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
