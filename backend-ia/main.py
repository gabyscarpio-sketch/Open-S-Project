import os
import traceback
from typing import Optional, List, Dict, Any

import requests
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

try:
    import google.generativeai as genai  # type: ignore
except ImportError:
    genai = None  # type: ignore

load_dotenv()

app = FastAPI(title="Medical AI Assistant API")

# Configure CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000", "http://127.0.0.1:5000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Initialize Google Gemini client (optional dependency)
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")  # Default to gemini-2.5-flash (stable)

if GOOGLE_API_KEY and genai is not None:
    genai.configure(api_key=GOOGLE_API_KEY)
    try:
        # Remove 'models/' prefix if present, as GenerativeModel expects just the model name
        model_name = GEMINI_MODEL.replace("models/", "")
        google_client = genai.GenerativeModel(model_name)
        print(f"Initialized Google Gemini with model: {model_name}")
    except Exception as e:
        print(f"Error initializing model {GEMINI_MODEL}: {e}")
        print("Falling back to gemini-2.5-flash")
        try:
            google_client = genai.GenerativeModel("gemini-2.5-flash")
        except Exception:
            print("Falling back to gemini-pro")
            google_client = genai.GenerativeModel("gemini-pro")
else:
    if GOOGLE_API_KEY and genai is None:
        print("google-generativeai library is not installed. Running without Gemini integration.")
    google_client = None

# Supabase configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# ElevenLabs configuration
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM") # Rachel default

# Local AI configuration (Ollama — supports multiple models)
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_GENERATE_URL = f"{OLLAMA_BASE_URL}/api/generate"
OLLAMA_TAGS_URL = f"{OLLAMA_BASE_URL}/api/tags"

# Comma-separated list of models to try in order (fallback chain)
# Example: "qwen2.5:7b,llama3.2:3b,mistral,deepseek-r1:7b,phi3,gemma2:2b"
OLLAMA_MODELS_STR = os.environ.get("OLLAMA_MODELS", "qwen2.5:7b,kimi-k2,llama3.2:3b,mistral,deepseek-r1:7b,phi4-mini,gemma3:4b")
OLLAMA_MODELS = [m.strip() for m in OLLAMA_MODELS_STR.split(",") if m.strip()]

# Legacy single-model support (overrides the first in the chain if set)
_legacy_model = os.environ.get("OLLAMA_MODEL")
if _legacy_model:
    if _legacy_model not in OLLAMA_MODELS:
        OLLAMA_MODELS.insert(0, _legacy_model)


# Pydantic models
class PatientQueryRequest(BaseModel):
    patient_id: int
    prompt_text: str


class AssistantResponse(BaseModel):
    response: str
    patient_id: int


class ConversationMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class DraftDiagnosisRequest(BaseModel):
    patient_id: int
    conversation: List[ConversationMessage]
    doctor_notes: Optional[str] = None  # Diagnóstico/observaciones del médico como contexto


class DraftDiagnosisResponse(BaseModel):
    draft_diagnosis: str
    patient_id: int


# Health check endpoint
@app.get("/")
async def root():
    return {
        "status": "ok",
        "google_ai_configured": google_client is not None,
        "supabase_configured": bool(SUPABASE_URL and SUPABASE_KEY)
    }

@app.get("/health")
async def health_check():
    """Detailed health check endpoint"""
    return {
        "status": "healthy",
        "google_ai_configured": google_client is not None,
        "supabase_configured": bool(SUPABASE_URL and SUPABASE_KEY),
        "api_version": "v1",
        "ai_provider": "Google Gemini",
        "model": GEMINI_MODEL if google_client else None
    }

@app.get("/api/v1/models")
async def list_models():
    """List available Google Gemini models"""
    if genai is None:
        raise HTTPException(
            status_code=500,
            detail="google-generativeai library is not installed on the server",
        )

    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Google API key not configured")
    
    try:
        models = genai.list_models()
        available_models = []
        for model in models:
            if 'generateContent' in model.supported_generation_methods:
                available_models.append({
                    "name": model.name,
                    "display_name": model.display_name,
                    "description": model.description
                })
        return {"models": available_models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing models: {str(e)}")


@app.get("/api/v1/local-models")
async def list_local_models():
    """
    List local Ollama models: configured fallback chain + installed models.
    Supported models include: qwen2.5, kimi-k2, llama3.2, mistral,
    deepseek-r1, phi4-mini, gemma3, codegemma, and any Ollama-compatible model.
    """
    installed = get_available_ollama_models()
    return {
        "ollama_url": OLLAMA_BASE_URL,
        "configured_chain": OLLAMA_MODELS,
        "installed_models": installed,
        "ready": [m for m in OLLAMA_MODELS if any(m in inst for inst in installed)],
        "missing": [m for m in OLLAMA_MODELS if not any(m in inst for inst in installed)],
    }


# Function to fetch patient history from Supabase
async def fetch_patient_history(patient_id: int) -> List[Dict[str, Any]]:
    """
    Fetch patient medical history from Supabase medical_records table.
    Returns a list of medical records for the given patient_id.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Warning: Supabase credentials not configured. Patient history will be empty.")
        return []
    
    try:
        base_url = SUPABASE_URL.rstrip("/") + "/rest/v1"
        url = f"{base_url}/medical_records"
        params = {
            "patient_id": f"eq.{patient_id}",
            "select": "*",
        }
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Accept": "application/json",
        }

        resp = requests.get(url, headers=headers, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        if isinstance(data, list):
            result: List[Dict[str, Any]] = data
        else:
            print(f"Unexpected Supabase response format: {type(data)}")
            result = []

        print(f"Successfully fetched {len(result)} medical records for patient {patient_id}")
        return result
    except Exception as e:
        print(f"Error fetching patient history from Supabase: {e}")
        return []

def get_available_ollama_models() -> List[str]:
    """Query Ollama for locally installed models."""
    try:
        resp = requests.get(OLLAMA_TAGS_URL, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return [m["name"] for m in data.get("models", [])]
    except Exception:
        return []


async def call_local_llm(prompt: str) -> str:
    """
    Call local Ollama model with automatic fallback chain.
    Tries each model in OLLAMA_MODELS in order until one succeeds.
    Supported models: qwen2.5, kimi-k2, llama3.2, mistral, deepseek-r1,
    phi4-mini, gemma3, codegemma, and any other Ollama-compatible model.
    """
    errors: List[str] = []
    for model in OLLAMA_MODELS:
        try:
            print(f"[Local LLM] Trying model '{model}' at {OLLAMA_GENERATE_URL}")
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False
            }
            response = requests.post(OLLAMA_GENERATE_URL, json=payload, timeout=60)
            response.raise_for_status()
            data = response.json()
            text = data.get("response", "").strip()
            if text:
                print(f"[Local LLM] Success with model '{model}'")
                return text
            else:
                errors.append(f"{model}: empty response")
        except requests.exceptions.ConnectionError:
            errors.append(f"{model}: Ollama no disponible en {OLLAMA_BASE_URL}")
            break  # No point trying other models if Ollama isn't running
        except Exception as e:
            errors.append(f"{model}: {str(e)[:80]}")
            continue  # Try next model

    print(f"[Local LLM] All models failed: {errors}")
    return (
        "El servicio de inteligencia artificial local no está disponible. "
        "Verifique que Ollama esté ejecutándose y que al menos uno de estos modelos esté instalado: "
        f"{', '.join(OLLAMA_MODELS)}. "
        f"Use 'ollama pull <modelo>' para instalar."
    )


# Virtual Assistant endpoint
@app.post("/api/v1/assistant/ask", response_model=AssistantResponse)
async def ask_assistant(request: PatientQueryRequest):
    """
    Process patient queries using the AI assistant.
    Fetches patient history and uses LLM to provide medical assistance.
    """
    try:
        # Validate request
        if not request.prompt_text or not request.prompt_text.strip():
            raise HTTPException(status_code=400, detail="Prompt text cannot be empty")
        
        if not request.patient_id or request.patient_id <= 0:
            raise HTTPException(status_code=400, detail="Invalid patient ID")
        
        # Fetch patient history
        patient_history = await fetch_patient_history(request.patient_id)
        
        # Build context with patient history
        context = ""
        if patient_history:
            context = "\n\nPatient Medical History:\n"
            for record in patient_history:
                date_value = record.get("date") or record.get("created_at") or "N/A"
                notes_value = (
                    record.get("description")
                    or record.get("notes")
                    or record.get("detail")
                    or "N/A"
                )
                context += f"- Date: {date_value}, Notes: {notes_value}\n"
        
        # If Google Gemini client is available, use it
        if google_client:
            try:
                history_context = context.strip() if context else "No hay información disponible en el historial médico del paciente."

                system_prompt = (
                    "Eres un asistente médico en español. Debes responder únicamente con la información que aparezca en el CONTEXTO DEL HISTORIAL MÉDICO. "
                    "Si la información solicitada no está en el contexto, responde exactamente: 'Esa información no está disponible en el historial del paciente.' "
                    "No inventes datos ni agregues consejos médicos. "
                    "Responde de forma ordenada usando Markdown cuando sea útil: listas con guiones (-), negritas (**texto**) para términos importantes y encabezados (##) para secciones."
                )

                # Build the full prompt with explicit sections
                full_prompt = (
                    f"{system_prompt}\n\n"
                    "--- CONTEXTO DEL HISTORIAL MÉDICO ---\n"
                    f"{history_context}\n"
                    "--- FIN DEL CONTEXTO ---\n\n"
                    f"Pregunta del usuario: {request.prompt_text}\n"
                    "Respuesta:"
                )
                
                # Generate response using Google Gemini
                response = google_client.generate_content(
                    full_prompt,
                    generation_config={
                        "temperature": 0.7,
                        "max_output_tokens": 500,
                    }
                )

                assistant_response = ""
                finish_reason = None
                safety_messages: List[str] = []

                if getattr(response, "candidates", None):
                    candidate = response.candidates[0]
                    finish_reason = getattr(candidate, "finish_reason", None)
                    content = getattr(candidate, "content", None)
                    parts = getattr(content, "parts", None) if content else None

                    if parts:
                        text_parts = []
                        for part in parts:
                            text_value = getattr(part, "text", None)
                            if text_value:
                                text_parts.append(text_value)

                        assistant_response = "\n".join(text_parts).strip()

                    safety_ratings = getattr(candidate, "safety_ratings", [])
                    for rating in safety_ratings:
                        if getattr(rating, "blocked", False):
                            category = getattr(rating, "category", "Contenido bloqueado")
                            safety_messages.append(category)

                prompt_feedback = getattr(response, "prompt_feedback", None)
                if prompt_feedback and getattr(prompt_feedback, "block_reason", None):
                    safety_messages.append(str(prompt_feedback.block_reason))
                    finish_reason = finish_reason or prompt_feedback.block_reason

                if not assistant_response:
                    finish_reason_str = str(finish_reason).upper() if finish_reason else "UNKNOWN"
                    print(
                        "Gemini response contained no text. Finish reason: "
                        f"{finish_reason_str}, safety messages: {safety_messages}"
                    )

                    if safety_messages:
                        reason_msg = ", ".join(safety_messages)
                        assistant_response = (
                            "Lo siento, no puedo responder esa solicitud porque infringe las políticas de seguridad "
                            f"del modelo (detalles: {reason_msg})."
                        )
                    elif finish_reason_str == "MAX_TOKENS":
                        assistant_response = (
                            "La respuesta fue truncada porque se alcanzó el límite de tokens. "
                            "Por favor, intenta reformular tu pregunta o dividirla en partes más pequeñas."
                        )
                    else:
                        assistant_response = (
                            "Lo siento, no pude generar una respuesta en este momento. "
                            "Intenta reformular tu pregunta o vuelve a intentarlo más tarde."
                        )
            except Exception as google_error:
                print(f"Google Gemini API error or Timeout: {google_error}")
                print("Falling back to Local LLM (Ollama)...")
                assistant_response = await call_local_llm(full_prompt)
        else:
            # Fallback to local model when Google API is not configured
            print("Google API Key not configured. Using Local LLM (Ollama)...")
            history_context = context.strip() if context else "No hay información disponible en el historial médico del paciente."
            system_prompt = "Eres un asistente médico en español. Responde basándote en este contexto:\n" + history_context
            full_prompt = f"{system_prompt}\n\nPregunta: {request.prompt_text}\nRespuesta:"
            assistant_response = await call_local_llm(full_prompt)

        return AssistantResponse(
            response=assistant_response,
            patient_id=request.patient_id
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error processing assistant request: {e}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing request: {str(e)}"
        )


@app.post("/api/v1/assistant/draft-diagnosis", response_model=DraftDiagnosisResponse)
async def draft_diagnosis(request: DraftDiagnosisRequest):
    """
    Genera un diagnóstico previo por IA a partir del historial completo del paciente
    en la base de datos y de la conversación mantenida en el chat.
    """
    if not request.patient_id or request.patient_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    patient_history = await fetch_patient_history(request.patient_id)

    history_context = ""
    if patient_history:
        history_context = "HISTORIAL MÉDICO DEL PACIENTE (base de datos):\n"
        for record in patient_history:
            date_value = record.get("date") or record.get("created_at") or "N/A"
            notes_value = (
                record.get("description")
                or record.get("notes")
                or record.get("detail")
                or "N/A"
            )
            history_context += f"- Fecha: {date_value}. Notas: {notes_value}\n"
    else:
        history_context = "No hay registros en el historial médico del paciente."

    conversation_text = ""
    if request.conversation:
        conversation_text = "CONVERSACIÓN CON EL ASISTENTE:\n"
        for msg in request.conversation:
            role_label = "Usuario" if msg.role == "user" else "Asistente"
            conversation_text += f"{role_label}: {msg.content}\n\n"

    doctor_notes_context = ""
    if request.doctor_notes and request.doctor_notes.strip():
        doctor_notes_context = (
            "NOTAS O DIAGNÓSTICO PRELIMINAR DEL MÉDICO (tener en cuenta para el informe):\n"
            f"{request.doctor_notes.strip()}\n\n"
        )

    if not google_client:
        # Fallback cuando el servicio de IA no está configurado
        fallback_text = (
            "## Motivo de consulta\n"
            "No especificado (el servicio de IA no está configurado).\n\n"
            "## Exploración física\n"
            "No especificado (el servicio de IA no está configurado).\n\n"
            "## Diagnóstico\n"
            "No se pudo generar un diagnóstico automático porque falta la configuración de GOOGLE_API_KEY.\n\n"
            "## Plan terapéutico\n"
            "No especificado.\n\n"
            "## Observaciones\n"
            "Configura la variable de entorno GOOGLE_API_KEY para habilitar el diagnóstico automático por IA."
        )

        return DraftDiagnosisResponse(
            draft_diagnosis=fallback_text,
            patient_id=request.patient_id,
        )

    system_instruction = (
        "Eres un médico que redacta informes. Tu tarea es generar un DIAGNÓSTICO PREVIO (análisis automático) estructurado "
        "basándote en: (1) el historial médico del paciente en base de datos, (2) la conversación del chat, "
        "y (3) si se proporciona, las notas o diagnóstico preliminar del médico. "
        "No inventes datos que no aparezcan en el contexto. "
        "Responde en español y usa exactamente las siguientes secciones en Markdown (## para títulos):\n\n"
        "## Motivo de consulta\n"
        "## Exploración física\n"
        "## Diagnóstico\n"
        "## Plan terapéutico\n"
        "## Observaciones\n\n"
        "Rellena cada sección con la información deducible. Si algo no está disponible, escribe 'No especificado'."
    )

    full_prompt = (
        f"{system_instruction}\n\n"
        "--- HISTORIAL Y CONTEXTO ---\n\n"
        f"{history_context}\n\n"
        f"{conversation_text}\n"
        f"{doctor_notes_context}"
        "--- FIN ---\n\n"
        "Genera el diagnóstico previo estructurado (análisis automático):"
    )

    try:
        response = google_client.generate_content(
            full_prompt,
            generation_config={
                "temperature": 0.4,
                "max_output_tokens": 800,
            }
        )

        draft_text = ""
        if getattr(response, "candidates", None) and len(response.candidates) > 0:
            candidate = response.candidates[0]
            content = getattr(candidate, "content", None)
            parts = getattr(content, "parts", None) if content else None
            if parts:
                text_parts = [getattr(p, "text", "") or "" for p in parts]
                draft_text = "\n".join(text_parts).strip()

        if not draft_text:
            draft_text = (
                "Motivo de consulta: No especificado.\n\n"
                "Exploración física: No especificado.\n\n"
                "Diagnóstico: No se pudo generar con la información disponible.\n\n"
                "Plan terapéutico: No especificado.\n\n"
                "Observaciones: Revisar historial y conversación."
            )

        return DraftDiagnosisResponse(
            draft_diagnosis=draft_text,
            patient_id=request.patient_id,
        )
    except Exception as e:
        print(f"Error generating draft diagnosis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar diagnóstico previo: {str(e)}",
        )

class VoiceRequest(BaseModel):
    text: str

@app.post("/api/v1/voice/generate")
async def generate_voice(request: VoiceRequest):
    """
    Generates audio from text using ElevenLabs API and streams it back.
    """
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
        
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}/stream"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    
    data = {
        "text": request.text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }

    try:
        response = requests.post(url, json=data, headers=headers, stream=True)
        response.raise_for_status()

        return StreamingResponse(
            response.iter_content(chunk_size=1024), 
            media_type="audio/mpeg"
        )
    except requests.exceptions.RequestException as e:
        print(f"Error calling ElevenLabs API: {e}")
        raise HTTPException(status_code=500, detail="Error generating audio stream")



# --- Patient CRUD endpoints (Supabase) ---

@app.get("/api/v1/patients")
async def list_patients(q: str = ""):
    """List patients from Supabase. Optional search by name."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"patients": []}
    try:
        base_url = SUPABASE_URL.rstrip("/") + "/rest/v1"
        url = f"{base_url}/patients"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Accept": "application/json",
        }
        params: dict = {"select": "*", "order": "created_at.desc", "limit": "50"}
        if q.strip():
            params["name"] = f"ilike.*{q.strip()}*"
        resp = requests.get(url, headers=headers, params=params, timeout=10)
        resp.raise_for_status()
        return {"patients": resp.json() if isinstance(resp.json(), list) else []}
    except Exception as e:
        print(f"Error listing patients: {e}")
        return {"patients": []}


@app.get("/api/v1/patients/{patient_id}")
async def get_patient(patient_id: int):
    """Get a single patient by ID from Supabase."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    try:
        base_url = SUPABASE_URL.rstrip("/") + "/rest/v1"
        url = f"{base_url}/patients"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Accept": "application/json",
        }
        params = {"id": f"eq.{patient_id}", "select": "*"}
        resp = requests.get(url, headers=headers, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if not data:
            raise HTTPException(status_code=404, detail="Patient not found")
        return {"patient": data[0]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching patient: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/patients/{patient_id}/records")
async def get_patient_records(patient_id: int):
    """Get medical records for a patient from Supabase."""
    records = await fetch_patient_history(patient_id)
    return {"records": records, "patient_id": patient_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
