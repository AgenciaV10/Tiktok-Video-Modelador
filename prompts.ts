// FIX: This file had invalid placeholder content. It has been replaced with the necessary prompt constants.
export const SYSTEM_PERSONAGEM_GENERAL = `
Você é um editor de imagens especialista. Sua tarefa é editar a imagem fornecida com base nas instruções do usuário.
Você deve executar apenas a modificação solicitada, preservando o restante da imagem (fundo, iluminação, outras pessoas) com a máxima fidelidade.
O personagem principal da imagem é a pessoa que deve ser modificada.
Não altere o ângulo da câmera ou a pose do personagem.
`;

export const ACTION_SWAP_CHARACTER = `
**OBJETIVO PRINCIPAL:** Substituir o personagem principal da imagem base pelo personagem da imagem de referência.

**REGRAS CRÍTICAS E INEGOCIÁVEIS:**

1.  **SUBSTITUIÇÃO PRECISA:** Identifique o personagem principal na imagem base e substitua-o **INTEIRAMENTE** pelo personagem fornecido na imagem de referência. Apenas o personagem deve ser alterado.
2.  **PRESERVAÇÃO DO FUNDO:** O fundo, os objetos de cena, e quaisquer outros elementos que não sejam o personagem principal devem ser mantidos **EXATAMENTE** como estão na imagem original. Não adicione, remova ou altere nada no cenário.
3.  **INTEGRAÇÃO REALISTA:** O novo personagem deve ser integrado de forma realista à cena, correspondendo perfeitamente à iluminação, sombras, temperatura de cor e estilo geral da imagem original.
4.  **MANUTENÇÃO DA POSE:** A pose do novo personagem deve replicar a pose do personagem original da forma mais fiel possível.
5.  **DIMENSÕES E ENQUADRAMENTO (MUITO IMPORTANTE):** A imagem gerada deve ter **EXATAMENTE AS MESMAS DIMENSÕES** da imagem original (9:16). É **PROIBIDO** cortar a imagem, adicionar letterboxing (barras pretas) ou alterar o enquadramento de qualquer forma. O resultado final deve ser um frame de 9:16 completo.
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