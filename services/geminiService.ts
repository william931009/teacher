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
    
    **重要規則：**
    1. **數學公式格式**：
       - 所有數學算式、變數、數字**一律**使用 LaTeX 語法，並用**單個錢字號**包起來。
       - ✅ 正確：$x + y = 10$, $E = mc^2$, $\frac{1}{2}$
       - ❌ 嚴禁使用方括號： [ x + y ] 或 \[ x + y \] (這會導致顯示錯誤)
       - ❌ 嚴禁重複：不要寫了 LaTeX 又寫純文字。例如 "$x=1$ x等於1" (錯！只要寫 $x=1$)
    
    2. **排版**：
       - 使用列點或分行讓內容清晰。
       - 乘號請用 $\times$ 或 $\cdot$，不要用英文字母 x。

    每個步驟包含：
    - title: 步驟標題 (例如：分析題目)
    - blackboardText: 黑板上的內容 (Markdown 格式，數學用 $...$ )
    - spokenText: 老師講解的口語稿 (自然生動，不要唸出 LaTeX 語法)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.2, // Lower temperature to strict adherence
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