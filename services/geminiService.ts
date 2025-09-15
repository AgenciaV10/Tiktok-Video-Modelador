import { GoogleGenAI, Type } from "@google/genai";
import type { MachineReadableOutput } from '../types';
import { TAKE_DURATION_S } from '../constants';

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
    Você é um analista de vídeo de elite, agindo como um "script supervisor" para um diretor de cinema. Sua especialidade é analisar vídeos de demonstração de produtos (estilo TikTok Shop) com uma precisão desumana. Sua tarefa é decompor o vídeo fornecido em uma análise quadro a quadro, capturando cada detalhe sutil de interação humana, expressão facial e manipulação de objetos, e gerar um único objeto JSON estruturado para um gerador de prompts VEO.

    **REGRAS FUNDAMENTAIS E INEGOCIÁVEIS:**
    1.  **FIDELIDADE ABSOLUTA E FÍSICA REALISTA (ZERO ALUCINAÇÃO):**
        -   Sua análise deve se basear **estritamente** no que é visto e ouvido. É proibido inventar, inferir ou embelezar.
        -   **ARTICULE A FÍSICA DO MUNDO REAL:** Esta é a regra mais importante. Não basta descrever a ação, você deve **explicar ativamente as consequências físicas** dessa ação no prompt VEO3. Descreva explicitamente conceitos como **gravidade, peso, inércia, colisão e separação de objetos**. Sua descrição deve guiar o gerador de vídeo para que ele entenda as leis da física da cena.
            -   **Exemplo de Conceito:** Ao descrever alguém levantando uma panela de uma pilha, não diga apenas "ela levanta a panela". Diga: "ela levanta a panela de cima, que se move de forma independente, enquanto a panela de baixo permanece imóvel sobre a mesa devido ao seu próprio peso e à gravidade, demonstrando que são dois objetos distintos e sólidos".
        -   **BIOMECÂNICA REALISTA:** Os movimentos humanos descritos devem ser anatomicamente possíveis, naturais e refletir o esforço apropriado para manipular o peso e o material do objeto.

    2.  **ANÁLISE FOCADA EM PRODUTOS (ESTILO TIKTOK SHOP):**
        -   **O PRODUTO É O PROTAGONISTA:** Preste atenção máxima em como o produto é apresentado. Como o apresentador o segura para a câmera? Quais características são destacadas? Como a luz reflete no material?
        -   **INTERAÇÃO DETALHADA:** Documente o "storytelling" tátil. O apresentador aperta o produto? Desliza os dedos sobre a textura? Abre e fecha compartimentos? Demonstra a funcionalidade? Cada uma dessas interações é uma "ação" crítica.
        -   **REAÇÕES E EXPRESSÕES:** Analise as expressões faciais do apresentador em resposta ao produto. Surpresa ao ver uma funcionalidade? Satisfação ao tocar a textura? Concentração ao montar uma peça? Conecte a expressão à interação.

    3.  **ANÁLISE MICROSCÓPICA DE AÇÕES:**
        -   **NÃO PERCA NADA:** Documente **TODOS** os movimentos, por menores que sejam: gestos de mão (apontar, beliscar, segurar com a ponta dos dedos), mudanças de expressão facial (levantar de sobrancelha, sorriso sutil), direção do olhar, ajustes de postura.
        -   **Exemplo de Interação com Objeto:**
            -   **RUIM:** \`"action": "segura o pote"\`.
            -   **EXCELENTE:** \`{"t":"1.2-1.5", "actor":"A1", "action":"gira o pote de creme lentamente com a mão esquerda, enquanto a ponta do dedo indicador direito traça o contorno do logo em relevo na tampa"}\`.
        -   **Exemplo de Expressão:**
            -   **RUIM:** \`"action":"ela sorri"\`.
            -   **EXCELENTE:** \`{"t":"3.4-4.0", "actor":"A1", "action":"após abrir o produto, levanta as sobrancelhas levemente em sinal de surpresa agradável e um sorriso sutil se forma no canto de sua boca enquanto olha para a câmera"}\`.

    4.  **SEGMENTAÇÃO E CONTINUIDADE:**
        -   Calcule a duração total e divida em "takes" de ${TAKE_DURATION_S} segundos, com o último take sendo o restante.
        -   A continuidade entre os takes é sagrada. O 'end_state' do take N deve ser uma descrição precisa da cena para que o 'start_state' do take N+1 seja uma continuação perfeita.

    5.  **TRANSCRIÇÃO DE ÁUDIO (PT-BR):**
        -   Transcreva o diálogo em **Português do Brasil (pt-BR)** com precisão literal para o campo \`speech_ptBR\`.
        -   Se não houver fala, classifique corretamente em 'speech_meta' (silêncio, música, ruído).

    6.  **PROMPT VEO3 (EM INGLÊS, DIÁLOGO EM PT-BR):**
        -   Para cada take, construa o campo 'veo3_prompt_en'. Este é o campo mais importante para o usuário.
        -   **NÃO FAÇA RESUMOS!** O objetivo deste prompt é ser **longo, rico e explicitamente detalhado**. Sintetize **TODAS** as micro-ações, expressões faciais, interações E, crucialmente, **as regras de física em jogo** que você analisou. O prompt deve ser um manual de instruções para um animador de IA que não tem conhecimento prévio de como os objetos interagem no mundo real.
        -   **Incorpore a Causa e Efeito Físico:** Sua narrativa deve deixar claro como os objetos interagem. Por exemplo, descreva como a luz reflete no material, como um tecido se dobra sob o toque, ou como um objeto pesado resiste ao movimento inicial (inércia).
        -   O prompt deve seguir o modelo rigoroso: um parágrafo de descrição detalhada, seguido por marcadores.
        -   O diálogo transcrito DEVE permanecer em **pt-BR**, dentro de aspas duplas ("...") e ser rotulado com o marcador: \`- Dialogue pt-br:\`.

    7.  **FORMATO DE SAÍDA JSON:**
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