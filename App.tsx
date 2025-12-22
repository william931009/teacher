import React, { useState, useRef, useEffect } from 'react';
import { Blackboard } from './components/Blackboard';
import { InputSection } from './components/InputSection';
import { PlayerControls } from './components/PlayerControls';
import { generateExplanationSteps, generateTeacherVoice } from './services/geminiService';
import { decodeAudioData, playAudio } from './services/audioUtils';
import { ExplanationStep } from './types';
import { Bot, Volume2 } from 'lucide-react';

const App: React.FC = () => {
  // Data State
  const [steps, setSteps] = useState<ExplanationStep[]>([]);
  
  // UI State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isComponentMounted = useRef(true);

  useEffect(() => {
    return () => { isComponentMounted.current = false; };
  }, []);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000 
      });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const stopCurrentAudio = () => {
    if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch (e) {}
        audioSourceRef.current = null;
    }
  };

  // Playback Loop
  useEffect(() => {
    if (!isPlaying || steps.length === 0) {
        stopCurrentAudio();
        return;
    }

    const playStep = async () => {
        const step = steps[currentStepIndex];
        if (!step) return;

        initAudioContext();
        stopCurrentAudio();
        
        if (step.audioBuffer && audioContextRef.current) {
            audioSourceRef.current = playAudio(step.audioBuffer, audioContextRef.current, () => {
                 if (isComponentMounted.current && isPlaying) {
                     // Auto advance
                     setTimeout(() => {
                         if (currentStepIndex < steps.length - 1 && isPlaying) {
                             setCurrentStepIndex(prev => prev + 1);
                         } else {
                             setIsPlaying(false);
                         }
                     }, 1500);
                 }
            });
        } else {
             // Fallback if no audio (wait then next)
             setTimeout(() => {
                 if (currentStepIndex < steps.length - 1 && isPlaying) {
                     setCurrentStepIndex(prev => prev + 1);
                 } else {
                     setIsPlaying(false);
                 }
             }, 3000); 
        }
    };

    playStep();
    
    return () => {
        stopCurrentAudio();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex, isPlaying]); 


  const handleSubmit = async (text: string, imageBase64?: string, voiceName: string = 'Kore') => {
    initAudioContext();
    setIsLoading(true);
    setIsPlaying(false);
    setSteps([]);
    setCurrentStepIndex(0);
    
    try {
        const generatedSteps = await generateExplanationSteps(text, imageBase64);
        setSteps(generatedSteps);

        // Preload Audio with Selected Voice
        generatedSteps.forEach(async (step, index) => {
            const audioData = await generateTeacherVoice(step.spokenText, voiceName);
            if (audioData && audioContextRef.current) {
                const buffer = await decodeAudioData(audioData, audioContextRef.current);
                setSteps(prev => {
                    const newSteps = [...prev];
                    if (newSteps[index]) newSteps[index].audioBuffer = buffer;
                    return newSteps;
                });
            }
        });

        setIsLoading(false);
        setIsPlaying(true);

    } catch (error) {
        console.error("Workflow failed", error);
        setIsLoading(false);
        setSteps([{ 
            title: "Error", 
            blackboardText: "系統發生錯誤，請重試。", 
            spokenText: "系統發生錯誤，請重試。" 
        }]);
    }
  };

  const handleSeek = (stepIndex: number) => {
      stopCurrentAudio();
      setCurrentStepIndex(stepIndex);
      // If user seeks, we typically pause or keep playing. 
      // Let's keep playing if it was playing, but restart audio for that step logic handles that.
  };

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col font-sans overflow-hidden">
      
      {/* Top Bar (Mobile) / Left Panel (Desktop) */}
      <div className="flex flex-col md:flex-row h-full">
        
        {/* Sidebar (Desktop Only) / Header (Mobile) */}
        <div className="md:w-72 bg-gray-900 border-b md:border-b-0 md:border-r border-gray-800 shrink-0 flex md:flex-col justify-between p-3 md:p-4 gap-3 z-20">
             
             {/* Robot Avatar & Status */}
             <div className="flex items-center gap-3 md:flex-col md:text-center">
                 <div className={`
                    w-10 h-10 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-300
                    ${isPlaying ? 'bg-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-slate-800 border border-slate-700'}
                 `}>
                    <Bot size={isPlaying ? 24 : 20} className={`md:w-12 md:h-12 ${isPlaying ? 'text-green-400 animate-bounce' : 'text-slate-400'}`} />
                 </div>
                 
                 <div className="flex-1 md:flex-none">
                     <h1 className="font-bold text-white text-sm md:text-xl">AI 機器人老師</h1>
                     <div className="flex items-center gap-1.5 mt-1 md:justify-center">
                         {isPlaying && <Volume2 size={12} className="text-green-400 animate-pulse"/>}
                         <p className="text-slate-400 text-xs">{isPlaying ? '正在講解重點...' : '準備中'}</p>
                     </div>
                 </div>
             </div>

             {/* Desktop Input Place */}
             <div className="hidden md:block">
                 <InputSection onSubmit={handleSubmit} isLoading={isLoading} />
             </div>
        </div>

        {/* Main Stage */}
        <div className="flex-1 flex flex-col relative h-full overflow-hidden">
             
             {/* Blackboard */}
             <div className="flex-1 relative min-h-0 bg-black p-2 md:p-4">
                 <Blackboard 
                    steps={steps} 
                    currentStepIndex={currentStepIndex} 
                    isPlaying={isPlaying}
                 />
                 
                 {isLoading && (
                     <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                         <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                         <p className="text-green-400 font-mono animate-pulse">思考與解題中...</p>
                     </div>
                 )}
             </div>

             {/* Player Controls */}
             <PlayerControls 
                isPlaying={isPlaying}
                currentStep={currentStepIndex}
                totalSteps={steps.length}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onNext={() => {
                    if (currentStepIndex < steps.length - 1) {
                        setCurrentStepIndex(curr => curr + 1);
                        setIsPlaying(true);
                    }
                }}
                onPrev={() => {
                    if (currentStepIndex > 0) {
                        setCurrentStepIndex(curr => curr - 1);
                        setIsPlaying(true);
                    }
                }}
                onSeek={handleSeek}
             />

             {/* Mobile Input (Overlay or Bottom Sheet style if needed, but sticky bottom is easiest) */}
             <div className="md:hidden bg-gray-900 border-t border-gray-800 p-2 shrink-0">
                  <InputSection onSubmit={handleSubmit} isLoading={isLoading} />
             </div>
        </div>
      </div>
    </div>
  );
};

export default App;
