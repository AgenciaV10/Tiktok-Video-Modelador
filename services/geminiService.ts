import { GoogleGenAI, Type } from "@google/genai";
import type { MachineReadableOutput } from '../types';
import { TAKE_DURATION_S } from '../constants';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper para converter o objeto File em uma GenerativePart para o Gemini.
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (reader.result) {
            resolve((reader.result as string).split(',')[1]);
        } else {
            reject(new Error("Falha ao ler o arquivo."));
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

// Schema para um único objeto "Take".
const getTakeSchema = () => ({
    type: Type.OBJECT,
    properties: {
        take_id: { type: Type.STRING },
        timecode: {
            type: Type.OBJECT,
            properties: {
                start_s: { type: Type.NUMBER },
                end_s: { type: Type.NUMBER },
                duration_s: { type: Type.NUMBER },
            },
            required: ['start_s', 'end_s', 'duration_s']
        },
        speech_ptBR: { type: Type.STRING },
        speech_meta: {
            type: Type.OBJECT,
            properties: {
                presence: { type: Type.BOOLEAN },
                type: { type: Type.STRING },
                speaker: { type: Type.STRING },
            },
            required: ['presence', 'type', 'speaker']
        },
        actors: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    age_hint: { type: Type.STRING },
                    wardrobe: { type: Type.STRING },
                    position: { type: Type.STRING },
                },
                required: ['id', 'type', 'age_hint', 'wardrobe', 'position']
            }
        },
        objects: { type: Type.ARRAY, items: { type: Type.STRING } },
        environment: {
            type: Type.OBJECT,
            properties: {
                location: { type: Type.STRING },
                lighting: { type: Type.STRING },
                time_of_day: { type: Type.STRING },
            },
            required: ['location', 'lighting', 'time_of_day']
        },
        camera: {
            type: Type.OBJECT,
            properties: {
                mode: { type: Type.STRING },
                shot_type: { type: Type.STRING },
                movement: { type: Type.STRING },
                notes: { type: Type.STRING },
            },
            required: ['mode', 'shot_type', 'movement', 'notes']
        },
        actions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    t: { type: Type.STRING },
                    actor: { type: Type.STRING },
                    action: { type: Type.STRING },
                },
                required: ['t', 'actor', 'action']
            }
        },
        start_state: { type: Type.STRING },
        end_state: { type: Type.STRING },
        veo3_prompt_en: { type: Type.STRING },
        notes: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['take_id', 'timecode', 'speech_ptBR', 'speech_meta', 'actors', 'objects', 'environment', 'camera', 'actions', 'start_state', 'end_state', 'veo3_prompt_en', 'notes']
});

// Schema raiz para toda a saída da análise.
const getRootSchema = () => ({
    type: Type.OBJECT,
    properties: {
        video_duration_s: { type: Type.NUMBER, description: "Duração total do vídeo em segundos." },
        take_size_s: { type: Type.NUMBER, description: `A duração padrão de cada take, deve ser ${TAKE_DURATION_S}.` },
        takes: {
            type: Type.ARRAY,
            description: "Um array de todos os takes do vídeo.",
            items: getTakeSchema()
        }
    },
    required: ['video_duration_s', 'take_size_s', 'takes']
});

export const generateVeoPrompts = async (file: File): Promise<MachineReadableOutput> => {
  const videoPart = await fileToGenerativePart(file);

  const prompt = `
    Você é um analista multimodal especializado. Sua tarefa é analisar meticulosamente o arquivo de vídeo fornecido e gerar um único objeto JSON estruturado que divide o vídeo em "takes" para um gerador de prompts VEO.
    
    **INSTRUÇÕES CRÍTICAS:**
    1.  **SEM ALUCINAÇÕES:** Toda a sua análise DEVE ser baseada **exclusivamente** nas informações visuais e de áudio presentes no arquivo de vídeo fornecido. NÃO invente ações, sons, objetos ou diálogos.
    2.  **Segmentação de Vídeo:**
        -   Calcule a duração total do vídeo.
        -   Divida o vídeo em segmentos contíguos ("takes") de exatamente ${TAKE_DURATION_S} segundos.
        -   O último take deve ter a duração restante se for menor que ${TAKE_DURATION_S} segundos.
    3.  **Para CADA take, realize a seguinte análise:**
        -   **Transcrição de Áudio:** Ouça o áudio e transcreva quaisquer palavras faladas verbatim em **Português do Brasil (pt-BR)**. Se não houver fala, indique silêncio, música ou ruído no 'speech_meta'.
        -   **Análise Visual:** Descreva todas as ações, movimentos, interações e mudanças na cena em **INGLÊS**. Seja preciso e use timestamps relativos ao início de cada take (ex: "0.5-1.2s").
        -   **Continuidade:** Garanta que o 'start_state' de cada take reflita com precisão o 'end_state' do take anterior. Isso é crucial para uma geração de vídeo sem interrupções posteriormente.
        -   **Geração de Prompt Veo3:** Para cada take, crie o campo 'veo3_prompt_en'. Deve estar em INGLÊS, mas o diálogo transcrito DEVE permanecer em pt-BR e estar entre aspas duplas. O prompt deve seguir o modelo: um parágrafo de resumo, depois marcadores para Ações, Câmera, Ambiente, Continuidade, Diálogo, Fundo de Áudio e Duração.
    4.  **Formato de Saída:**
        -   Sua saída final deve ser um **único objeto JSON** que corresponda perfeitamente ao schema fornecido.
        -   Não inclua nenhum texto, explicações ou formatação markdown antes ou depois do objeto JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        parts: [
          { text: prompt },
          videoPart,
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: getRootSchema(),
    },
  });

  const jsonString = response.text;
  const result = JSON.parse(jsonString) as MachineReadableOutput;
  
  return result;
};
