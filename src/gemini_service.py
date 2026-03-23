
import google.generativeai as genai
import os
import base64
from typing import List, Dict, Optional

# A API_KEY deve estar configurada como variável de ambiente
# Uso mandatório: process.env.API_KEY (ou os.environ.get na versão Python)
api_key = os.environ.get("API_KEY")
if not api_key:
    raise ValueError("API_KEY não encontrada nas variáveis de ambiente.")

genai.configure(api_key=api_key)

class JetOpsGeminiService:
    """Serviço Python de alta fidelidade para o sistema JET OPS."""
    
    @staticmethod
    def generate_shift_briefing(flights: List[Dict]) -> str:
        """Gera um briefing operacional baseado nos dados dos voos do turno."""
        model = genai.GenerativeModel('gemini-3-flash-preview')
        
        summary = "\n".join([
            f"VOO: {f['flightNumber']} | CIA: {f['airline']} | STATUS: {f['status']} | GATE: {f['gate']}"
            for f in flights
        ])
        
        prompt = f"""
        Você é o Diretor de Operações de Solo do JET OPS.
        Gere um briefing operacional conciso para a troca de turno.
        Foque em gargalos operacionais e segurança.
        
        DADOS DO PÁTIO:
        {summary}
        """
        
        response = model.generate_content(prompt)
        return response.text or "Sem dados para briefing."

    @staticmethod
    def analyze_safety_image(image_base64: str, mime_type: str, context: str = "Inspeção geral") -> str:
        """Realiza inspeção visual de segurança usando IA Generativa."""
        model = genai.GenerativeModel('gemini-3-flash-preview')
        
        image_part = {
            "mime_type": mime_type,
            "data": image_base64
        }
        
        prompt = f"""
        Realize uma inspeção técnica de segurança operacional nesta imagem para o sistema JET OPS.
        Contexto: {context}.
        Analise FOD (objetos estranhos), EPIs e posicionamento de equipamentos.
        Formato: [STATUS: SEGURO/RISCO] seguido por notas técnicas.
        """
        
        response = model.generate_content([prompt, image_part])
        return response.text or "Erro na análise visual."

    @staticmethod
    def edit_visual_ops_image(image_base64: str, mime_type: str, edit_prompt: str) -> Optional[str]:
        """Aplica edições generativas em imagens de pátio (Ex: destacar tampa de combustível)."""
        model = genai.GenerativeModel('gemini-2.5-flash-image')
        
        image_part = {
            "mime_type": mime_type,
            "data": image_base64
        }
        
        # Nota: O modelo nano banana (gemini-2.5-flash-image) retorna a imagem em partes inlineData
        response = model.generate_content([edit_prompt, image_part])
        
        # Procura por partes de imagem na resposta
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'inline_data'):
                return part.inline_data.data
        
        return None

# Exemplo de uso
if __name__ == "__main__":
    service = JetOpsGeminiService()
    # flights_mock = [{"flightNumber": "LA3055", "airline": "LATAM", "status": "ABASTECENDO", "gate": "204"}]
    # print(service.generate_shift_briefing(flights_mock))
