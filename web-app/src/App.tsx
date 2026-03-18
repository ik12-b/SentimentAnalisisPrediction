import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  BrainCircuit,
  Cpu,
  Activity,
  BarChart3,
  Terminal,
  Database,
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

type Prediction = {
  text: string;
  label: string;
  confidence: number;
};

const SentimentApp: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [singleResult, setSingleResult] = useState<Prediction | null>(null);
  const [batchResults, setBatchResults] = useState<Prediction[] | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('http://localhost:8000/');
        if (res.ok) setStatus('ready');
        else setStatus('error');
      } catch {
        setStatus('error');
      }
    };
    checkBackend();
  }, []);

  const handleInference = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setSingleResult(null);
    setBatchResults(null);

    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      await new Promise(r => setTimeout(r, 400));
      setSingleResult(data);
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setSingleResult(null);
    setBatchResults(null);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/predict/file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('File processing failed');
      const data = await response.json();
      setBatchResults(data.results);
      setActiveTab('batch');
    } catch (err) {
      console.error(err);
      alert('Failed to process file. Make sure it is CSV or TXT.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white font-sans flex flex-col items-center">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-blue-600/[0.03] rounded-full blur-[120px] -z-10 pointer-events-none" />

      <main className="main-container flex flex-col items-center w-full max-w-5xl px-6 py-12">
        <header className="flex flex-col items-center text-center mb-12">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/30 mb-6">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            SentiPulse<span className="text-blue-500">.ai</span>
          </h1>
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-[9px] font-bold uppercase tracking-widest text-zinc-500">
            <span className={`w-2 h-2 rounded-full ${status === 'ready' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : status === 'error' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'}`} />
            {status === 'ready' ? 'FastAPI Neural Engine Active' : status === 'error' ? 'Backend Offline' : 'Initializing...'}
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl mb-8">
          <button 
            onClick={() => setActiveTab('single')}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'single' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
          >
            Predict Text
          </button>
          <button 
            onClick={() => setActiveTab('batch')}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'batch' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
          >
            Batch Analysis
          </button>
        </div>

        {activeTab === 'single' ? (
          <section className="glass-card w-full max-w-3xl mb-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 text-zinc-600">
                <Terminal className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Manual_Entry_Mode</span>
              </div>
              {inputText && (
                <button onClick={() => setInputText('')} className="text-zinc-600 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter some text to analyze sentiment..."
              className="w-full h-32 bg-transparent text-center text-xl md:text-2xl font-medium placeholder:text-zinc-800 focus:outline-none resize-none"
            />

            <div className="flex flex-col items-center mt-8">
              <button
                onClick={handleInference}
                disabled={isProcessing || !inputText.trim() || status !== 'ready'}
                className="w-full md:w-auto px-12 py-4 bg-white text-black text-sm font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {isProcessing ? <div className="w-5 h-5 border-2 border-zinc-300 border-t-black rounded-full animate-spin" /> : <span>Analyze Now</span>}
              </button>
            </div>
          </section>
        ) : (
          <section className="w-full max-w-3xl mb-12">
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`w-full h-64 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-8 text-center
                ${dragActive ? 'bg-blue-600/10 border-blue-500 scale-[1.02]' : 'bg-white/[0.02] border-white/10 hover:border-white/20'}`}
            >
              <div className="w-16 h-16 bg-white/[0.05] rounded-2xl flex items-center justify-center mb-4">
                <Upload className={`w-8 h-8 ${dragActive ? 'text-blue-500 animate-bounce' : 'text-zinc-500'}`} />
              </div>
              <h3 className="text-lg font-bold mb-1">Upload Dataset</h3>
              <p className="text-sm text-zinc-500 mb-6 max-w-xs">
                Drag and drop your <code className="text-blue-400">.csv</code> or <code className="text-blue-400">.txt</code> file here for bulk sentiment processing.
              </p>
              <label className="cursor-pointer px-8 py-3 bg-white text-black text-xs font-black rounded-xl hover:bg-zinc-200 transition-colors">
                Browse Files
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".csv,.txt"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </label>
            </div>
          </section>
        )}

        {/* Results Display */}
        <AnimatePresence mode="wait">
          {singleResult && activeTab === 'single' && (
            <motion.section
              key="single"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full flex flex-col items-center mb-16"
            >
              <div className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-4 ${
                singleResult.label === 'Positive' ? 'text-emerald-500' : 
                singleResult.label === 'Negative' ? 'text-rose-500' : 'text-amber-500'
              }`}>
                Assessment Result
              </div>
              <h2 className="text-8xl md:text-9xl font-black italic tracking-tighter mb-8 uppercase text-center">
                {singleResult.label}
              </h2>
              <div className="w-full max-w-sm bg-white/[0.03] p-4 rounded-2xl border border-white/[0.05]">
                <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase mb-2">
                  <span>Confidence Score</span>
                  <span>{(singleResult.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${singleResult.confidence * 100}%` }}
                    className={`h-full ${
                      singleResult.label === 'Positive' ? 'bg-emerald-500' : 
                      singleResult.label === 'Negative' ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                  />
                </div>
              </div>
            </motion.section>
          )}

          {batchResults && activeTab === 'batch' && (
            <motion.section
              key="batch"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-bold uppercase tracking-wider">Processed {batchResults.length} Entries</span>
                </div>
                <div className="flex gap-4 text-[10px] font-bold">
                  <span className="text-emerald-500">POS: {batchResults.filter(r => r.label === 'Positive').length}</span>
                  <span className="text-rose-500">NEG: {batchResults.filter(r => r.label === 'Negative').length}</span>
                </div>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 border-b border-white/[0.05]">
                      <th className="p-4 pl-8">Text Content</th>
                      <th className="p-4">Sentiment</th>
                      <th className="p-4 pr-8 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchResults.map((res, i) => (
                      <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 pl-8 text-sm text-zinc-400 max-w-md truncate">{res.text}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            res.label === 'Positive' ? 'bg-emerald-500/10 text-emerald-500' :
                            res.label === 'Negative' ? 'bg-rose-500/10 text-rose-500' :
                            'bg-amber-500/10 text-amber-500'
                          }`}>
                            {res.label}
                          </span>
                        </td>
                        <td className="p-4 pr-8 text-right text-xs font-medium text-zinc-500">
                          {(res.confidence * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Feature Highlights */}
        <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-20">
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900/50 flex items-center justify-center mb-6 border border-white/5">
              <Activity className="w-6 h-6 text-emerald-500" />
            </div>
            <h4 className="text-lg font-bold mb-2">Real-time Batching</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Upload thousands of rows and get instant sentiment distributions using our high-throughput FastAPI architecture.
            </p>
          </div>
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900/50 flex items-center justify-center mb-6 border border-white/5">
              <BarChart3 className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="text-lg font-bold mb-2">Data Integrity</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Advanced tokenizer normalization ensures high accuracy across various social media and formal text formats.
            </p>
          </div>
        </section>

        <footer className="mt-40 mb-20 text-center opacity-30">
          <div className="flex items-center justify-center gap-3">
            <Database className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">SentiPulse Core Eng // 2026 Build</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default SentimentApp;
