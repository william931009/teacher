import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ExplanationStep } from "../types";

// Always use process.env.API_KEY as per guidelines
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
    
    **格式嚴格規定 (違反會導致顯示錯誤)：**

    1.  **數學算式「絕對」不可重複**：
        *   ❌ 嚴禁：$x+y=10$ x+y=10 (禁止在 LaTeX 後面重複純文字)
        *   ❌ 嚴禁：$x+y=10$ $x+y=10$ (禁止重複寫兩次一樣的算式)
        *   ❌ 嚴禁：答案選 (D)(D) (選項只寫一次)
        *   ✅ 正確：$x+y=10$ (乾淨、簡潔，只寫一次)

    2.  **LaTeX 語法規範**：
        *   所有數學符號、數字、變數都**必須**包在單個錢字號 $ 中。
        *   嚴禁使用方括號 [] 或 \\[\\] 來包覆算式，一律用 $。
        *   乘號使用 $\\times$，除號使用 $\\div$。
        *   範例：$3 \\times 4 = 12$

    3.  **黑板內容 (blackboardText)**：
        *   這是在黑板上給學生看的，要精簡、條理分明。
        *   不要寫太多廢話，專注於算式推導。
        *   排版要用換行符號分開不同算式，讓閱讀舒適。

    每個步驟包含：
    - title: 步驟標題
    - blackboardText: 黑板內容 (Markdown 格式，數學用 $...$ )
    - spokenText: 老師口語講解 (口語化，親切自然，不要唸出 LaTeX 語法)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.1, // Lower temperature to strict adherence
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
    return [{
        title: "錯誤",
        blackboardText: "系統發生錯誤，請重試。",
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