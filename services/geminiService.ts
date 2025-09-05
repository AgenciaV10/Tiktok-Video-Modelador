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
    Você é um analista de vídeo de elite, agindo como um "script supervisor" para um diretor de cinema. Sua tarefa é decompor o vídeo fornecido em uma análise quadro a quadro, capturando cada detalhe sutil e gerando um único objeto JSON estruturado para um gerador de prompts VEO. Sua atenção aos detalhes deve ser sobre-humana.

    **REGRAS FUNDAMENTAIS E INEGOCIÁVEIS:**
    1.  **FIDELIDADE ABSOLUTA (ZERO ALUCINAÇÃO):** Sua análise deve se basear **estritamente** no que é visto e ouvido no vídeo. É proibido inventar, inferir ou embelezar. Se uma ação é ambígua, descreva-a como tal.
    2.  **ANÁLISE MICROSCÓPICA DE AÇÕES:**
        -   **NÃO PERCA NADA.** Documente **TODOS** os movimentos, não importa quão pequenos. Isso inclui: gestos de mão (apontar, coçar, tocar), mudanças de expressão facial, direção do olhar, tiques, etc.
        -   **Exemplo:** Se um ator coça o nariz, você DEVE registrar: \`{"t":"1.2-1.5", "actor":"A1", "action":"raises right hand and scratches the side of their nose with their index finger"}\`. Se ele aponta para algo fora da tela, registre: \`{"t":"3.4-4.0", "actor":"A1", "action":"points with their right index finger towards the bottom right of the frame"}\`.
        -   **INTERAÇÕES COM OBJETOS:** Descreva a manipulação de objetos com extrema precisão. Como o objeto é segurado, girado, apresentado à câmera? Se um objeto é mostrado em detalhe (como o interior de uma chaleira), isso DEVE ser documentado. Ex: \`{"t":"5.1-6.3", "actor":"A1", "action":"tilts the kettle forward, bringing it close to the camera to show its interior"}\`.
    3.  **SEGMENTAÇÃO E CONTINUIDADE:**
        -   Calcule a duração total e divida em "takes" de ${TAKE_DURATION_S} segundos, com o último take sendo o restante.
        -   A continuidade entre os takes é sagrada. O 'end_state' do take N deve ser uma descrição precisa da cena para que o 'start_state' do take N+1 seja uma continuação perfeita.
    4.  **TRANSCRIÇÃO DE ÁUDIO (PT-BR):**
        -   Transcreva o diálogo em **Português do Brasil (pt-BR)** com precisão literal. Mantenha palavras de preenchimento e pausas se forem significativas.
        -   Se não houver fala, classifique corretamente em 'speech_meta' (silêncio, música, ruído).
    5.  **PROMPT VEO3 (EM INGLÊS, DIÁLOGO EM PT-BR):**
        -   Para cada take, construa o campo 'veo3_prompt_en'. A descrição deve estar em INGLÊS, mas o diálogo transcrito DEVE permanecer em pt-BR, dentro de aspas duplas ("...").
        -   O prompt deve seguir o modelo rigoroso: parágrafo de resumo, seguido por marcadores para Ações, Câmera, Ambiente, Continuidade, Diálogo, Fundo de Áudio e Duração.
    6.  **FORMATO DE SAÍDA JSON:**
        -   Sua saída deve ser um **ÚNICO OBJETO JSON VÁLIDO**, sem nenhum texto, comentário ou formatação markdown fora do JSON. Aderência estrita ao schema fornecido é obrigatória.
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