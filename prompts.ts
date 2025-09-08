// FIX: This file had invalid placeholder content. It has been replaced with the necessary prompt constants.
export const SYSTEM_PERSONAGEM_GENERAL = `
Você é um editor de imagens especialista. Sua tarefa é editar a imagem fornecida com base nas instruções do usuário.
Você deve executar apenas a modificação solicitada, preservando o restante da imagem (fundo, iluminação, outras pessoas) com a máxima fidelidade.
O personagem principal da imagem é a pessoa que deve ser modificada.
Não altere o ângulo da câmera ou a pose do personagem.
`;

export const ACTION_SWAP_CHARACTER = `
Substitua o personagem principal na imagem pelo personagem da imagem de referência.
Integre o novo personagem de forma realista na cena, combinando a iluminação e o estilo da imagem original.
Mantenha a pose do novo personagem o mais próximo possível da pose do personagem original.
`;

export const ACTION_SWAP_BLUSA = `
Altere a blusa/camisa do personagem principal para ser como a da imagem de referência.
Mantenha o corpo e a pose do personagem, apenas substitua a peça de roupa.
Adapte a nova blusa ao corpo do personagem e à iluminação da cena.
`;

export const ACTION_SWAP_CALCA = `
Altere a calça do personagem principal para ser como a da imagem de referência.
Mantenha o corpo e a pose do personagem, apenas substitua a peça de roupa.
Adapte a nova calça ao corpo do personagem e à iluminação da cena.
`;

export const ACTION_EDIT_HAIR = (style: 'amarrado' | 'solto'): string => {
    if (style === 'amarrado') {
        return `
Altere o cabelo do personagem principal para um estilo preso (como um rabo de cavalo ou coque).
A cor e a textura do cabelo devem permanecer as mesmas do original.
`;
    }
    return `
Altere o cabelo do personagem principal para um estilo solto.
A cor e a textura do cabelo devem permanecer as mesmas do original.
`;
};

export const ACTION_CHAT_REEDIT = (instruction: string): string => {
    return `
Execute a seguinte modificação na imagem, com base no comando de chat do usuário.
Esta é uma reedição, então aplique a alteração na última imagem gerada.
Comando do usuário: "${instruction}"
`;
};
