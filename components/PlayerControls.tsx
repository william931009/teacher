import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (step: number) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  currentStep,
  totalSteps,
  onPlayPause,
  onNext,
  onPrev,
  onSeek
}) => {
  
  return (
    <div className="bg-slate-900 border-t border-slate-700 p-2 md:p-4 flex flex-col gap-2 shrink-0">
      
      {/* Interactive Slider */}
      <div className="relative w-full h-6 flex items-center">
        <input 
            type="range"
            min={0}
            max={Math.max(0, totalSteps - 1)}
            value={currentStep}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500 hover:accent-green-400"
            disabled={totalSteps === 0}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-slate-400 text-xs font-mono w-20">
            {totalSteps > 0 ? `STEP ${currentStep + 1}/${totalSteps}` : '--/--'}
        </div>

        <div className="flex items-center gap-4">
            <button 
                onClick={onPrev}
                disabled={currentStep === 0}
                className="text-white hover:text-green-400 disabled:opacity-30 transition-colors p-2"
            >
                <SkipBack size={20} fill="currentColor" />
            </button>
            
            <button 
                onClick={onPlayPause}
                disabled={totalSteps === 0}
                className="bg-white text-slate-900 rounded-full p-3 hover:bg-green-400 hover:scale-105 transition-all shadow-lg shadow-white/10 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-white"
            >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>

            <button 
                onClick={onNext}
                disabled={currentStep >= totalSteps - 1}
                className="text-white hover:text-green-400 disabled:opacity-30 transition-colors p-2"
            >
                <SkipForward size={20} fill="currentColor" />
            </button>
        </div>

        <div className="w-20 text-right">
             {/* Spacer for centering */}
        </div>
      </div>
    </div>
  );
};
