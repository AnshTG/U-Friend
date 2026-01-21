
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { Message, Attachment, ChatMode } from "../types";

const TEXT_MODEL = 'gemini-3-flash-preview';

const getSystemInstruction = (mode: ChatMode): string => {
  const base = "You are 'U Friend', an advanced multimodal AI assistant. You excel at analyzing text, high-resolution images, video files, and document formats like PDFs. You are helpful, precise, and creative.";
  
  switch(mode) {
    case 'study':
      return `${base} In Study mode, you act as a world-class tutor. Break down complex documents or videos into digestible concepts. Use bullet points and clear headings.`;
    case 'search':
      return `${base} In Search mode, you leverage real-time information. Always cite your sources with the provided URLs when using Google Search grounding.`;
    case 'image':
      return `${base} In Creative mode, focus on the artistic and aesthetic details of visual media. Help users brainstorm or iterate on creative projects.`;
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const attachmentParts: Part[] = attachments.map(att => {
    const base64Data = att.data.includes(',') ? att.data.split(',')[1] : att.data;
    return {
      inlineData: {
        data: base64Data,
        mimeType: att.type || 'application/octet-stream'
      }
    };
  });

  const systemInstruction = getSystemInstruction(mode);

  try {
    const config: any = {
      systemInstruction,
      temperature: 0.7,
      tools: mode === 'search' ? [{ googleSearch: {} }] : [], // Specific tools per mode
    };

    // Construct conversation history
    const contents = history.slice(-12).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content || "Context provided." }]
    }));

    // Add current user turn with multimodal attachments
    contents.push({
      role: 'user',
      parts: [
        { text: prompt || "Analyze the provided items." },
        ...attachmentParts
      ]
    });

    if (signal?.aborted) throw new Error('Request aborted');

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents,
      config,
    });

    if (signal?.aborted) throw new Error('Request aborted');

    let text = response.text || "";
    let generatedImage = "";
    let sources: { title: string; uri: string }[] = [];

    // Extract search grounding citations
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      sources = response.candidates[0].groundingMetadata.groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title,
          uri: chunk.web.uri
        }));
    }

    return { 
      text: text || "Response processed.", 
      generatedImage,
      sources: sources.length > 0 ? sources : undefined
    };

  } catch (error: any) {
    if (error.name === 'AbortError' || error.message === 'Request aborted') {
      return { text: "Protocol terminated.", error: false };
    }
    console.error("Gemini API Error:", error);
    return { text: "Neural link failure. The files might be too complex or the context window exceeded.", error: true };
  }
};
