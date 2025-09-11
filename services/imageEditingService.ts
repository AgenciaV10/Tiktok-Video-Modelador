import { GoogleGenAI, Modality } from "@google/genai";
import type { EditImageOptions } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (reader.result) {
            resolve((reader.result as string).split(',')[1]);
        } else {
            reject(new Error("Failed to read file."));
        }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

export const editImage = async ({ baseImage, prompt, referenceImage }: EditImageOptions): Promise<string> => {
    // Re-structured the `parts` array to be more explicit and unambiguous for the Gemini model.
    // Instead of sending images and then a block of text, each image is now "labeled" with
    // a preceding text part, clearly defining its role in the editing process.
    // This directly addresses the issue where the model failed to associate the reference image
    // with the character swap instruction.
    const parts: ({ inlineData: { data: string; mimeType: string; } } | { text: string })[] = [];

    // 1. Label and add the base image
    parts.push({ text: 'Esta é a imagem base que precisa ser editada:' });
    const baseImagePart = await fileToGenerativePart(baseImage);
    parts.push(baseImagePart);

    // 2. If a reference image exists, label and add it
    if (referenceImage) {
        parts.push({ text: 'Esta é a imagem de referência para a substituição (personagem ou item):' });
        const referenceImagePart = await fileToGenerativePart(referenceImage);
        parts.push(referenceImagePart);
    }
    
    // 3. Add the final detailed instructions
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType;
            const base64Data = part.inlineData.data;
            return `data:${mimeType};base64,${base64Data}`;
        }
    }

    throw new Error("Nenhuma imagem foi gerada na resposta.");
};