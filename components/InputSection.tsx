import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Send, X, Mic } from 'lucide-react';

interface InputSectionProps {
  onSubmit: (text: string, imageBase64?: string, voice?: string) => void;
  isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onSubmit, isLoading }) => {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const voiceOptions = [
    { name: 'Kore', label: '溫柔女老師' },
    { name: 'Charon', label: '沉穩男老師' },
    { name: 'Puck', label: '活潑男助教' },
    { name: 'Fenrir', label: '嚴肅男主任' },
    { name: 'Zephyr', label: '知性女老師' },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !selectedImage) || isLoading) return;
    
    // Extract base64 raw data without the prefix for the API
    const base64Data = selectedImage ? selectedImage.split(',')[1] : undefined;
    
    onSubmit(text, base64Data, selectedVoice);
    setText('');
    handleRemoveImage();
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {selectedImage && (
          <div className="relative w-fit">
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="h-32 rounded-lg border border-slate-600 object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="輸入你的問題，或者上傳題目照片..."
              className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none h-24 placeholder-slate-500 text-base"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2 flex-wrap">
                 <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors text-sm bg-slate-700/50"
                    disabled={isLoading}
                >
                    <ImageIcon size={18} />
                    <span className="hidden sm:inline">上傳圖片</span>
                </button>

                {/* Voice Selector */}
                <div className="relative flex items-center bg-slate-700/50 rounded-lg px-2 border border-slate-600">
                    <Mic size={16} className="text-green-400 mr-1" />
                    <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="bg-transparent text-white text-sm py-2 pl-1 pr-6 focus:outline-none cursor-pointer appearance-none"
                        disabled={isLoading}
                    >
                        {voiceOptions.map(option => (
                            <option key={option.name} value={option.name} className="bg-slate-800">
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            
            <button
                type="submit"
                disabled={isLoading || (!text.trim() && !selectedImage)}
                className={`
                    flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-white transition-all
                    ${isLoading || (!text.trim() && !selectedImage)
                        ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
                        : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20 active:scale-95'}
                `}
            >
                {isLoading ? (
                    <span className="animate-pulse">思考中...</span>
                ) : (
                    <>
                        <span className="hidden sm:inline">請老師講解</span>
                        <span className="sm:hidden">發送</span>
                        <Send size={18} />
                    </>
                )}
            </button>
        </div>
      </form>
    </div>
  );
};
