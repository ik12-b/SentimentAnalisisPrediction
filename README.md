# Sentiment Analysis Prediction

This project implements a sentiment analysis model using PyTorch and serves it via a FastAPI backend. The frontend is a modern web application built with React and Tailwind CSS.

## Features

- **Sentiment Analysis**: Classifies text as positive, negative, or neutral.
- **FastAPI Backend**: Serves the PyTorch model for predictions.
- **React Frontend**: A modern, responsive user interface.
- **Batch Processing**: Upload a CSV or TXT file to analyze multiple texts at once.

## Prerequisites

- Python 3.8+
- Node.js 16+
- pip (Python package manager)
- npm (Node package manager)

## Installation

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd web-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## Usage

1. Open the frontend in your browser: `http://localhost:5173`
2. Enter text in the input field and click "Predict" to get sentiment analysis.
3. Alternatively, upload a CSV or TXT file for batch analysis.
