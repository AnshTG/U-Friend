import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { Message, Attachment, ChatMode } from "../types";

const TEXT_MODEL = 'gemini-3-flash-preview';

const getSystemInstruction = (mode: ChatMode): string => {
  const base = "You are 'U Friend', a highly sophisticated AI assistant. Your primary directive is providing accurate, empathetic, and clear analysis of text and uploaded files. You have full support for images, videos, PDFs, and multi-file analysis.";
  
  switch(mode) {
    case 'study':
      return `${base} In Study mode, act as a pedagogical expert. Explain concepts from first principles. Use formatting to make things clear. Analyze any provided documents or educational videos thoroughly.`;
    case 'search':
      return `${base} In Search mode, prioritize real-time web grounding. Cite your sources clearly using the provided metadata.`;
    case 'image':
      return `${base} In Creative mode, focus on high-fidelity descriptions and artistic context of images and visual media.`;
    default:
      return base;
  }
};

export const sendMessageToGemini = async (
  prompt: string,
  history: Message[],
  attachments: Attachment[] = [],
  mode: ChatMode = 'general',
  signal?: AbortSignal
): Promise<{ text: string; generatedImage?: string; sources?: { title: string; uri: string }[]; error?: boolean }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const targetModel = TEXT_MODEL;

  const attachmentParts: Part[] = attachments.map(att => {
    // Basic mapping for common types to ensure Gemini understands them
    let mimeType = att.type;
    if (att.name.endsWith('.pdf')) mimeType = 'application/pdf';
    
    return {
      inlineData: {
        data: att.data.split(',')[1],
        mimeType: mimeType
      }
    };
  });

  const systemInstruction = getSystemInstruction(mode);

  try {
    const config: any = {
      systemInstruction,
      temperature: 0.7,
      tools: [{ googleSearch: {} }],
    };

    const contents = history.slice(-12).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    contents.push({
      role: 'user',
      parts: [
        { text: prompt || "Analyze these files." },
        ...attachmentParts
      ]
    });

    if (signal?.aborted) throw new Error('Request aborted');

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: targetModel,
      contents,
      config,
    });

    if (signal?.aborted) throw new Error('Request aborted');

    let text = "";
    let generatedImage = "";
    let sources: { title: string; uri: string }[] = [];

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        } else if (part.text) {
          text += part.text;
        }
      }
    }

    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      sources = response.candidates[0].groundingMetadata.groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title,
          uri: chunk.web.uri
        }));
    }

    return { 
      text: text || (generatedImage ? "Analysis complete. New visual context synthesized." : "No output from neural engine."), 
      generatedImage,
      sources: sources.length > 0 ? sources : undefined
    };

  } catch (error: any) {
    if (error.name === 'AbortError' || error.message === 'Request aborted') {
      return { text: "Protocol terminated by user.", error: false };
    }
    console.error("Gemini API Error:", error);
    return { text: "Neural link failure. Check your connection or the file complexity.", error: true };
  }
};
