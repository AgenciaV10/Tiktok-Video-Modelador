import type { TikTokApiResponse, TikTokData } from '../types';

export const getTikTokData = async (url: string): Promise<TikTokData> => {
  const response = await fetch('https://www.tikwm.com/api/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error('A resposta da rede não foi bem-sucedida. Verifique sua conexão.');
  }

  const result: TikTokApiResponse = await response.json();

  if (result.code !== 0 || !result.data || !result.data.play) {
    throw new Error(result.msg || 'Falha ao buscar dados do TikTok. A URL pode ser inválida ou o vídeo pode ser privado.');
  }

  return result.data;
};
