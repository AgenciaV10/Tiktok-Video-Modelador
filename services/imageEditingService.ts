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
    const baseImagePart = await fileToGenerativePart(baseImage);
    // FIX: Explicitly type the array to allow both image and text parts.
    // Without this, TypeScript infers the array type from the first element only (an image part),
    // causing a type error when a text part is pushed later.
    const imageParts: ({ inlineData: { data: string; mimeType: string; } } | { text: string })[] = [baseImagePart];

    if (referenceImage) {
        const referenceImagePart = await fileToGenerativePart(referenceImage);
        // Add a text hint for the reference image's role
        imageParts.push({ text: 'Reference image for the character/item:' });
        imageParts.push(referenceImagePart);
    }

    const fullPrompt = `${prompt}`;
    const parts = [...imageParts, { text: fullPrompt }];

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

    throw new Error("No image was generated in the response.");
};
