import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ExplanationStep } from '../types';

interface BlackboardProps {
  steps: ExplanationStep[];
  currentStepIndex: number;
  isPlaying: boolean;
}

export const Blackboard: React.FC<BlackboardProps> = ({ steps, currentStepIndex, isPlaying }) => {
  const [displayedCurrentText, setDisplayedCurrentText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<number | null>(null);

  const currentStep = steps[currentStepIndex];

  // Handle Typewriter effect for the *current* step only
  useEffect(() => {
    if (!currentStep) {
        setDisplayedCurrentText('');
        return;
    }

    const fullText = currentStep.blackboardText;
    
    let currentIndex = 0;
    setDisplayedCurrentText('');
    
    if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);

    typingIntervalRef.current = window.setInterval(() => {
      setDisplayedCurrentText((prev) => {
        if (currentIndex >= fullText.length) {
            if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
            return prev;
        }
        const char = fullText[currentIndex];
        currentIndex++;
        return prev + char;
      });
    }, 20); // Slightly faster typing for standard font

    return () => {
      if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
    };
  }, [currentStep, currentStepIndex]); 

  // Ensure current step is in view when changed
  useEffect(() => {
    if (scrollRef.current) {
        const el = document.getElementById(`step-${currentStepIndex}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
  }, [currentStepIndex]);


  return (
    <div className="relative w-full h-full p-2 md:p-6 bg-slate-800 border-4 md:border-8 border-slate-700/50 rounded-lg shadow-2xl overflow-hidden flex flex-col">
      {/* Removed the texture pattern for a cleaner look */}
      <div className="absolute inset-0 bg-slate-900 opacity-90 pointer-events-none"></div>
      
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-700 mb-4 z-10 shrink-0">
        <h2 className="text-lg md:text-2xl font-bold text-green-400 tracking-wide truncate mr-2">
          {currentStep ? `Step ${currentStepIndex + 1}: ${currentStep.title}` : '今日課程'}
        </h2>
        <div className="text-gray-400 text-xs md:text-sm font-sans flex items-center gap-2 whitespace-nowrap">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></span>
            {isPlaying ? '講解中' : '暫停'}
        </div>
      </div>

      {/* Content Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto chalk-scroll z-10 pr-2 scroll-smooth"
      >
        <div className="prose prose-invert prose-lg max-w-none text-slate-100 leading-relaxed pb-20">
            
          {/* Render All Steps */}
          {steps.map((step, index) => {
             const isCurrent = index === currentStepIndex;
             const isFuture = index > currentStepIndex;

             if (isFuture) return null; // Don't show future steps yet

             return (
               <div 
                 key={index} 
                 id={`step-${index}`}
                 className={`
                    mb-6 p-5 rounded-xl transition-all duration-500 border
                    ${isCurrent ? 'bg-slate-800/80 border-green-500/30 shadow-lg shadow-green-900/10' : 'bg-slate-800/40 border-slate-700/50 opacity-60'}
                 `}
               >
                 <h3 className={`${isCurrent ? 'text-green-300' : 'text-slate-500'} text-lg mb-3 font-bold flex items-center gap-2`}>
                    {isCurrent && <span className="text-green-500 text-sm">▶</span>}
                    {step.title}
                 </h3>
                 
                 <div className={isCurrent ? 'text-slate-100' : 'text-slate-400'}>
                    <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={markdownComponents}
                    >
                        {isCurrent ? displayedCurrentText : step.blackboardText}
                    </ReactMarkdown>
                 </div>
               </div>
             );
          })}
          
          {steps.length === 0 && (
              <div className="text-slate-500 italic text-center mt-20 flex flex-col items-center gap-2">
                  <span>等待題目中...</span>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable components config
const markdownComponents = {
    p: ({node, ...props}: any) => <p className="mb-4" {...props} />,
    h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold text-white mb-4 mt-2" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-xl font-bold text-white mb-3 mt-2" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-300" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-slate-300" {...props} />,
    li: ({node, ...props}: any) => <li className="pl-1" {...props} />,
    strong: ({node, ...props}: any) => <strong className="text-green-300 font-bold" {...props} />,
    code: ({node, className, children, ...props}: any) => {
        return (
            <code className={`${className} bg-slate-950 px-1.5 py-0.5 rounded text-sm font-mono mx-1 text-yellow-300`} {...props}>
                {children}
            </code>
        )
    }
};