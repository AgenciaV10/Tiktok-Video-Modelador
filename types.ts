export interface Timecode {
  start_s: number;
  end_s: number;
  duration_s: number;
}

export interface SpeechMeta {
  presence: boolean;
  type: 'dialogue' | 'voiceover' | 'noise' | 'music' | 'silence';
  speaker: 'female' | 'male' | 'child' | 'unknown';
}

export interface Actor {
  id: string;
  type: 'woman' | 'man' | 'person' | 'unknown';
  age_hint: string;
  wardrobe: string;
  position: string;
}

export interface Environment {
  location: string;
  lighting: string;
  time_of_day: string;
}

export interface Camera {
  mode: 'selfie' | 'external' | 'unclear';
  shot_type: 'CU' | 'MCU' | 'MS' | 'WS' | 'unclear';
  movement: 'static' | 'pan' | 'tilt' | 'dolly' | 'handheld' | 'unclear';
  notes: string;
}

export interface Action {
  t: string;
  actor: string;
  action: string;
}

export interface Take {
  take_id: string;
  timecode: Timecode;
  speech_ptBR: string;
  speech_meta: SpeechMeta;
  actors: Actor[];
  objects: string[];
  environment: Environment;
  camera: Camera;
  actions: Action[];
  start_state: string;
  end_state: string;
  veo3_prompt_en: string;
  notes: string[];
}

export interface MachineReadableOutput {
  video_duration_s: number;
  take_size_s: number;
  takes: Take[];
}

export interface TikTokData {
  id: string;
  play: string;
  cover: string;
  music: string;
  author: {
    nickname: string;
  };
  title: string;
}

export interface TikTokApiResponse {
    code: number;
    msg: string;
    data: TikTokData;
}

export interface EditImageOptions {
  baseImage: File;
  prompt: string;
  referenceImage?: File | null;
}

export interface HistoryItem {
    data: TikTokData;
    addedAt: string; // ISO 8601 string
}
