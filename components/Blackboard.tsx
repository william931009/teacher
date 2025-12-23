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
  
  // Ref to store the interval ID
  const typingIntervalRef = useRef<number | null>(null);
  
  // Ref to track the text we are currently animating to avoid unwanted resets/flashing
  const currentAnimatingTextRef = useRef<string | null>(null);

  const currentStep = steps[currentStepIndex];
  // Extract text safely. If undefined, default to empty.
  const currentText = currentStep?.blackboardText || '';

  // Handle Typewriter effect
  useEffect(() => {
    // If we have no text, just clear and return
    if (!currentText) {
        setDisplayedCurrentText('');
        currentAnimatingTextRef.current = null;
        if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
        return;
    }

    // Only restart animation if the actual TEXT content has changed.
    if (currentAnimatingTextRef.current === currentText) {
        return; 
    }

    // Start new animation
    currentAnimatingTextRef.current = currentText;
    setDisplayedCurrentText('');
    
    if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);

    let charIndex = 0;
    
    typingIntervalRef.current = window.setInterval(() => {
      charIndex++;
      
      // Strict slicing to ensure no duplication
      setDisplayedCurrentText(currentText.slice(0, charIndex));

      if (charIndex >= currentText.length) {
        if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
      }
    }, 50); // 50ms typing speed

    return () => {
      if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
    };
  }, [currentText]);

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
    <div className="relative w-full h-full p-2 md:p-6 bg-slate-800 border-4 md:border-8 border-yellow-900/40 rounded-lg shadow-2xl overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-chalk.png')] opacity-30 pointer-events-none"></div>
      
      {/* Explicitly hide MathML to prevent double rendering shadow clones */}
      <style>{`
        .katex-mathml { display: none !important; }
        .katex-html { display: block; }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-white/10 mb-2 z-10 shrink-0">
        <h2 className="text-lg md:text-2xl font-chalk text-green-200 tracking-wider truncate mr-2">
          {currentStep ? `Step ${currentStepIndex + 1}: ${currentStep.title}` : '今日課程'}
        </h2>
        <div className="text-gray-400 text-xs md:text-sm font-sans flex items-center gap-2 whitespace-nowrap">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
            {isPlaying ? '講解中' : '暫停'}
        </div>
      </div>

      {/* Content Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto chalk-scroll z-10 pr-2 scroll-smooth"
      >
        <div className="prose prose-invert prose-lg max-w-none font-chalk text-white leading-loose pb-20">
            
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
                    mb-6 p-4 rounded-lg transition-all duration-500
                    ${isCurrent ? 'bg-white/5 border border-yellow-200/30 shadow-[0_0_15px_rgba(253,224,71,0.1)]' : 'opacity-50'}
                 `}
               >
                 <h3 className={`${isCurrent ? 'text-yellow-200' : 'text-gray-500'} text-xl mb-2 font-bold flex items-center gap-2`}>
                    {isCurrent && <span className="text-red-400 text-sm">▶</span>}
                    Step {index + 1}: {step.title}
                 </h3>
                 
                 <div className={`${isCurrent ? 'text-white' : 'text-gray-400'} text-xl md:text-2xl min-h-[3rem]`}>
                    <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        // Config output to 'html' only to prevent MathML double rendering issues
                        rehypePlugins={[[rehypeKatex, { output: 'html', strict: false, throwOnError: false }]]}
                        components={markdownComponents}
                    >
                        {isCurrent ? displayedCurrentText : step.blackboardText}
                    </ReactMarkdown>
                    
                    {/* Laser Pointer Cursor - Only for current step */}
                    {isCurrent && (
                        <span className="inline-block w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] ml-1 animate-pulse align-middle translate-y-0.5"></span>
                    )}
                 </div>
               </div>
             );
          })}
          
          {steps.length === 0 && (
              <div className="text-gray-500 italic text-center mt-20">
                  等待題目中...
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
    h1: ({node, ...props}: any) => <h1 className="text-3xl text-yellow-200 mb-4 mt-2" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-2xl text-yellow-100 mb-3 mt-2" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
    li: ({node, ...props}: any) => <li className="pl-1" {...props} />,
    strong: ({node, ...props}: any) => <strong className="text-pink-300 font-bold border-b-2 border-pink-300/50" {...props} />, 
    code: ({node, className, children, ...props}: any) => {
        return (
            <code className={`${className} bg-slate-700/50 px-1 py-0.5 rounded text-sm font-sans mx-1 text-green-300`} {...props}>
                {children}
            </code>
        )
    }
};