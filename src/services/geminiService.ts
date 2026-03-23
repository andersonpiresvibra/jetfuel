import { GoogleGenAI, GenerateContentResponse, Type, FunctionDeclaration, SendMessageParameters } from "@google/genai";
import { FlightData, Vehicle, OperatorProfile, ChatMessage } from "../types";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Função para analisar o inventário do pool de veículos
export const analyzePoolInventory = async (vehicles: Vehicle[]): Promise<string> => {
  if (!ai) return "API Key not configurada.";

  try {
    const prompt = `Analise o seguinte inventário de veículos e forneça insights sobre a disponibilidade, status e quaisquer recomendações para otimização. Formate a resposta de forma concisa e profissional, destacando pontos críticos.
Inventário de Veículos: ${JSON.stringify(vehicles, null, 2)}`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Usando o modelo flash para respostas rápidas
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text || "Nenhuma análise gerada.";
  } catch (error) {
    console.error("Gemini API Error (analyzePoolInventory):", error);
    return "Erro ao gerar análise do inventário.";
  }
};

// Função para gerar análise de voo (existente, mas com modelo atualizado)
export const generateFlightAnalysis = async (flightData: FlightData): Promise<string> => {
  if (!ai) return "API Key not configurada.";
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Usando o modelo flash para respostas rápidas
      contents: [{ parts: [{ text: `Analise estes dados de voo para potenciais atrasos e forneça um resumo conciso: ${JSON.stringify(flightData)}` }] }],
    });
    return response.text || "Nenhuma análise gerada.";
  } catch (error) {
    console.error("Gemini API Error (generateFlightAnalysis):", error);
    return "Erro ao gerar análise de voo.";
  }
};

// Função para gerar descrições de imagens (ex: inspeção de aeronaves)
export const generateImageDescription = async (base64Image: string, mimeType: string, prompt: string = "Descreva esta imagem."): Promise<string> => {
  if (!ai) return "API Key not configurada.";

  try {
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Image,
      },
    };
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image", // Modelo otimizado para visão
      contents: { parts: [imagePart, textPart] },
    });
    return response.text || "Nenhuma descrição gerada.";
  } catch (error) {
    console.error("Gemini API Error (generateImageDescription):", error);
    return "Erro ao gerar descrição da imagem.";
  }
};

// Função para interações de chat com o modelo
export const chatWithGemini = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  if (!ai) return "API Key not configurada.";

  try {
    const chatHistory = history.map(msg => ({
      role: msg.isManager ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      history: chatHistory,
      config: {
        systemInstruction: "Você é um assistente de IA para operações de aeroporto, fornecendo informações concisas e precisas.",
      },
    });

    const response: GenerateContentResponse = await chat.sendMessage({
      message: { text: newMessage },
    });
    return response.text || "Não entendi a pergunta.";
  } catch (error) {
    console.error("Gemini API Error (chatWithGemini):", error);
    return "Erro na comunicação com a IA.";
  }
};

// Função para gerar um briefing de turno (placeholder)
export const generateShiftBriefing = async (operatorProfile: OperatorProfile, flights: FlightData[]): Promise<string> => {
  if (!ai) return "API Key not configurada.";
  return Promise.resolve("Briefing de turno gerado (funcionalidade em desenvolvimento).");
};

// Função para editar imagem com Gemini (placeholder)
export const editImageWithGemini = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
  if (!ai) return "API Key not configurada.";
  return Promise.resolve("Edição de imagem (funcionalidade em desenvolvimento).");
};

// Função para analisar imagem para segurança (placeholder)
export const analyzeImageForSafety = async (base64Image: string, mimeType: string): Promise<string> => {
  if (!ai) return "API Key not configurada.";
  return Promise.resolve("Análise de segurança da imagem (funcionalidade em desenvolvimento).");
};

// Função para sugerir otimizações de equipe
export const suggestTeamOptimizations = async (teamProfiles: OperatorProfile[], flights: FlightData[]): Promise<string> => {
  if (!ai) return "API Key not configurada.";

  try {
    const prompt = `Com base nos perfis da equipe e nos voos atuais, sugira otimizações para a alocação de operadores e veículos. Considere status, experiência e carga de trabalho para minimizar atrasos e maximizar a eficiência.
Perfis da Equipe: ${JSON.stringify(teamProfiles, null, 2)}
Voos Atuais: ${JSON.stringify(flights, null, 2)}`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text || "Nenhuma sugestão de otimização.";
  } catch (error) {
    console.error("Gemini API Error (suggestTeamOptimizations):", error);
    return "Erro ao sugerir otimizações de equipe.";
  }
};
