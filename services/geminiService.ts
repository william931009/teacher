import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ExplanationStep } from "../types";

// Always use process.env.API_KEY as per guidelines
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to strictly extract LaTeX content
const cleanBlackboardContent = (raw: string): string => {
  if (!raw) return "";
  
  // 1. Extract all LaTeX patterns: 
  // $$...$$ (block), $...$ (inline), \[...\] (display), \(...\) (inline)
  // Use non-greedy match *? 
  const latexRegex = /(\$\$[\s\S]*?\$\$|\$[^\n$]*?\$|\\\[[\s\S]*?\\\]|\\\([^\n]*?\\\))/g;
  const latexMatches = raw.match(latexRegex);
  
  // 2. If no LaTeX found, assume the model failed to wrap it.
  // We try to clean common prefixes like "Step 1:" or "Answer:" if they exist, then wrap in $.
  if (!latexMatches || latexMatches.length === 0) {
     let trimmed = raw.trim();
     
     // Remove common non-math prefixes often output by AI despite instructions
     trimmed = trimmed.replace(/^(Step \d+:?|Answer:|Explanation:|步驟 \d+[：:]?)/i, '').trim();

     if (!trimmed) return "";
     
     // If it already contains $, return as is (regex failed? unlikely but safe fallback)
     if (trimmed.includes('$')) return trimmed;
     
     return `$${trimmed}$`;
  }

  // 3. Remove exact consecutive duplicates (AI sometimes repeats the same formula)
  const uniqueMatches = latexMatches.filter((item, index, arr) => {
    return index === 0 || item !== arr[index - 1];
  });
  
  // 4. Join with newlines to render as separate blocks
  return uniqueMatches.join('\n\n');
};

// 1. Generate Step-by-Step Explanation (JSON)
export const generateExplanationSteps = async (
  prompt: string,
  imageBase64?: string
): Promise<ExplanationStep[]> => {
  const ai = getAIClient();
  
  const parts: any[] = [];
  if (imageBase64) {
    parts.push({
      inlineData: { mimeType: 'image/jpeg', data: imageBase64 }
    });
  }
  parts.push({ text: prompt });

  const systemInstruction = `
    You are a strict backend API that generates structured JSON data for a math tutoring app.
    
    **CRITICAL RULE FOR blackboardText:**
    The 'blackboardText' field MUST contain **ONLY** standard LaTeX math expressions wrapped in '$'.
    
    **STRICT PROHIBITIONS for blackboardText:**
    1. ❌ NO plain text math (e.g., do not write "2 + 2 = 4", only write "$2+2=4$").
    2. ❌ NO titles, labels, or descriptions (e.g., do not write "Step 1:", "Answer:", "Simplify:").
    3. ❌ NO Chinese characters or words (e.g., do not write "括號內除法").
    4. ❌ NO ASCII representations (e.g., do not write "[ -2 * 2 ]").
    
    **INPUT:**
    User prompt (text and/or image).

    **OUTPUT:**
    JSON Array of steps.
    
    **EXAMPLE JSON STRUCTURE:**
    [
      {
        "title": "移項",
        "blackboardText": "$3x = 21 - 9$", 
        "spokenText": "我們先把常數項移到等號右邊。"
      },
      {
        "title": "計算結果",
        "blackboardText": "$x = 4$",
        "spokenText": "最後算出來 X 等於 4。"
      }
    ]
    
    **Generate 3 to 6 steps.**
    Ensure 'blackboardText' is clean, large, and purely mathematical using LaTeX.
    Ensure 'spokenText' is natural, encouraging, and detailed (in Traditional Chinese).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.0, // Force strict adherence to formatting rules
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              blackboardText: { 
                type: Type.STRING, 
                description: "STRICTLY LaTeX math formulas ONLY. Wrapped in $. NO plain text, NO words." 
              },
              spokenText: { type: Type.STRING },
            },
            required: ["title", "blackboardText", "spokenText"],
          },
        },
      }
    });

    const jsonText = response.text || "[]";
    const steps = JSON.parse(jsonText) as ExplanationStep[];

    // Post-process to guarantee cleanliness
    return steps.map(step => ({
        ...step,
        blackboardText: cleanBlackboardContent(step.blackboardText)
    }));

  } catch (error) {
    console.error("Step generation failed", error);
    return [{
        title: "錯誤",
        blackboardText: "$\\text{Error generating steps.}$",
        spokenText: "抱歉，系統發生錯誤，請稍後再試。"
    }];
  }
};

// 2. Generate Audio for a specific text with Voice Selection
export const generateTeacherVoice = async (text: string, voiceName: string = 'Kore'): Promise<string | undefined> => {
  const ai = getAIClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("Voice generation failed", error);
    return undefined;
  }
};