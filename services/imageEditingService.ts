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

    // 1. Check for prompt-level blocks (highest priority)
    if (response.promptFeedback?.blockReason) {
        throw new Error(`A geração foi bloqueada por segurança. Motivo: ${response.promptFeedback.blockReason}`);
    }

    // 2. Check if there are any candidates
    if (!response.candidates || response.candidates.length === 0) {
        throw new Error("A resposta da API não contém nenhum candidato de resultado.");
    }

    const candidate = response.candidates[0];

    // 3. Check for candidate-level blocks or errors
    if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
         throw new Error(`A geração falhou ou foi interrompida. Motivo: ${candidate.finishReason}`);
    }
    
    // 4. Check for content and parts
    if (!candidate.content?.parts || candidate.content.parts.length === 0) {
        throw new Error("O candidato na resposta não continha conteúdo ou o conteúdo estava vazio.");
    }
    
    let textResponse = '';
    // 5. Iterate through parts to find the image
    for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        if (part.text) {
            textResponse += part.text + ' ';
        }
    }

    // 6. If no image found, throw an error with the text response, if any
    if (textResponse.trim()) {
        throw new Error(`Nenhuma imagem foi gerada. Resposta do modelo: "${textResponse.trim()}"`);
    }

    throw new Error("Nenhuma imagem foi gerada e nenhuma mensagem de texto foi recebida.");
};