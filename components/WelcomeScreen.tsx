import React, { useState } from 'react';
import { Key, ChevronRight, Bot } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: (apiKey: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setError('請輸入 API Key');
      return;
    }
    if (!keyInput.startsWith('AIza')) {
       setError('這看起來不像有效的 Gemini API Key (通常以 AIza 開頭)');
       // We let them proceed anyway in case format changes, but show warning
    }
    onStart(keyInput.trim());
  };

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center p-4 z-50">
      <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center">
        
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <Bot size={40} className="text-green-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">歡迎來到 AI 老師</h1>
        <p className="text-slate-400 mb-8">
            請輸入您的 Google Gemini API Key 以開始使用。<br/>
            <span className="text-xs text-slate-500">金鑰僅會暫存在您的瀏覽器中，不會傳送至其他伺服器。</span>
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={18} className="text-slate-500" />
                </div>
                <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => {
                        setKeyInput(e.target.value);
                        setError('');
                    }}
                    placeholder="貼上您的 API Key"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                />
            </div>
            
            {error && <p className="text-red-400 text-sm text-left">{error}</p>}

            <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-lg shadow-green-900/20"
            >
                開始上課
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </form>

        <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-6 text-slate-500 text-sm hover:text-green-400 transition-colors border-b border-transparent hover:border-green-400"
        >
            還沒有 API Key？點此免費獲取
        </a>
      </div>
    </div>
  );
};
