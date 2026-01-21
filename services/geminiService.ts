
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getSmartSuggestions = async (listTitle: string, currentItems: string[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `List: ${listTitle}. Existing items: ${currentItems.join(', ')}. 
      Provide 5 relevant suggestions for this list. 
      Respond ONLY with a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
};
