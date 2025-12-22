import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ExplanationStep } from "../types";

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    你是一位專業的國高中補習班老師。
    請將解題過程分解成 3-5 個清晰的步驟，以便製作成教學影片。
    
    每個步驟包含：
    1. title: 步驟標題 (例如：分析題目、列出公式、計算過程、最終答案)
    2. blackboardText: 要寫在黑板上的內容。使用繁體中文和 LaTeX ($E=mc^2$)。重點清晰，分條列點。
    3. spokenText: 老師講解的口語稿。要口語化、親切、像在對學生說話。不要唸出 LaTeX 原始碼，而是唸出數學意義 (例如 $\frac{1}{2}$ 唸作 "二分之一")。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              blackboardText: { type: Type.STRING },
              spokenText: { type: Type.STRING },
            },
            required: ["title", "blackboardText", "spokenText"],
          },
        },
      }
    });

    const jsonText = response.text || "[]";
    return JSON.parse(jsonText) as ExplanationStep[];

  } catch (error) {
    console.error("Step generation failed", error);
    // Fallback if JSON parsing fails or model errors
    return [{
        title: "錯誤",
        blackboardText: "抱歉，老師現在無法分解步驟，請稍後再試。",
        spokenText: "抱歉，老師現在無法分解步驟，請稍後再試。"
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
