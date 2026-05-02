# OpenS — Resilience Edition

CRM Médico Inteligente con Arquitectura de IA Híbrida.

---

## Descripción

OpenS es una plataforma clínica que fusiona la gestión de pacientes con inteligencia artificial. Utiliza una arquitectura híbrida que transiciona de forma transparente entre **Google Gemini** (Cloud) y **modelos locales** (Ollama) para garantizar atención ininterrumpida, incluso en ambulatorios sin conexión a internet.

## Arquitectura

```
┌─────────────┐     ┌──────────────────────────────┐
│   Frontend   │────▶│   Backend (FastAPI :8001)     │
│  Astro :5000 │     │                              │
│              │     │  ┌──────────┐  ┌───────────┐ │
│  /           │     │  │ Gemini   │  │  Ollama   │ │
│  /auth       │     │  │ (Cloud)  │──▶│  (Local)  │ │
│  /asistente  │     │  └──────────┘  │           │ │
│  /doctor     │     │     Falla?     │ qwen2.5   │ │
│  /paciente   │     │     ──────▶    │ kimi-k2   │ │
│  /admin      │     │               │ llama3.2  │ │
│  /seguros    │     │               │ mistral   │ │
│              │     │               │ deepseek  │ │
│              │     │               │ phi4-mini │ │
│              │     │               │ gemma3    │ │
│              │     │               └───────────┘ │
│              │     │       │                     │
│              │     │  ┌────▼─────┐  ┌──────────┐ │
│              │     │  │ Supabase │  │ElevenLabs│ │
│              │     │  │   (DB)   │  │  (Voz)   │ │
│              │     │  └──────────┘  └──────────┘ │
└─────────────┘     └──────────────────────────────┘
```

---

## Requisitos Previos

| Herramienta | Versión | Uso |
|-------------|---------|-----|
| Python | 3.11+ | Backend API |
| Node.js | 22+ | Frontend |
| Ollama | Última | IA local (opcional) |
| Supabase | Cloud | Base de datos |
| Google AI Studio | — | API Key para Gemini |
| ElevenLabs | — | Síntesis de voz (opcional) |

---

## 1. Configuración de Supabase (Base de Datos)

### Paso 1: Crear proyecto

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Haz clic en **"New Project"**
3. Elige un nombre (ej: `opens-hackathon`), una contraseña y tu región más cercana
4. Espera ~2 minutos a que el proyecto se cree

### Paso 2: Obtener credenciales

1. En tu proyecto, ve a **Settings** (ícono de engranaje) → **API**
2. Copia estos dos valores:

| Campo | Qué copiar | Variable en `.env` |
|-------|-----------|-------------------|
| **Project URL** | `https://xxxxx.supabase.co` | `SUPABASE_URL` |
| **service_role key** (en `Project API keys`) | La clave larga que dice `service_role` | `SUPABASE_KEY` |

> ⚠️ **Importante**: Usa la `service_role` key, NO la `anon` key. La `service_role` tiene permisos para leer todas las tablas.

### Paso 3: Crear las tablas

1. En tu proyecto Supabase, ve a **SQL Editor** (ícono `<>` en el menú lateral izquierdo)
2. Haz clic en **"New query"**
3. Copia y pega **todo** el contenido del archivo `Base de Datos/supabase_schema.sql`
4. Haz clic en **"Run"** (o presiona `Ctrl + Enter`)
5. Deberías ver: `Success. No rows returned`

### Paso 4: Verificar

1. Ve a **Table Editor** (ícono de tabla en el menú lateral)
2. Deberías ver 3 tablas:
   - `profiles` — Perfiles de usuario vinculados a Auth
   - `patients` — Pacientes registrados (3 de ejemplo)
   - `medical_records` — Registros médicos (7 de ejemplo)

3. Haz clic en `patients` para ver los datos de ejemplo:
   - Ana María Rodríguez
   - Carlos Eduardo Pérez
   - María José González

### Paso 5: (Producción) Securizar las políticas

El schema incluye políticas de desarrollo que permiten lectura pública. **En producción**, elimina estas políticas:

```sql
DROP POLICY "Public read patients" ON public.patients;
DROP POLICY "Public read medical_records" ON public.medical_records;
DROP POLICY "Public insert patients" ON public.patients;
DROP POLICY "Public insert medical_records" ON public.medical_records;
```

---

## 2. Configuración del `.env`

Crea el archivo `backend-ia/.env` copiando la plantilla:

```bash
cp backend-ia/.env.example backend-ia/.env
```

Edita `backend-ia/.env` y rellena los valores:

```bash
# ═══════════════════════════════════════════
# IA CLOUD — Google Gemini
# ═══════════════════════════════════════════
# Obtener en: https://aistudio.google.com/apikey
GOOGLE_API_KEY=tu_clave_de_google
GEMINI_MODEL=gemini-2.5-flash

# ═══════════════════════════════════════════
# IA LOCAL — Ollama (cadena de fallback)
# ═══════════════════════════════════════════
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODELS=qwen2.5:7b,kimi-k2,llama3.2:3b,mistral,deepseek-r1:7b,phi4-mini,gemma3:4b

# ═══════════════════════════════════════════
# BASE DE DATOS — Supabase
# ═══════════════════════════════════════════
# (Los valores que copiaste en el Paso 2)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_service_role_key

# ═══════════════════════════════════════════
# VOZ — ElevenLabs (opcional)
# ═══════════════════════════════════════════
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

---

## 3. Instalar Modelos Locales (Ollama)

### Instalar Ollama

```bash
# Linux/macOS
curl -fsSL https://ollama.com/install.sh | sh

# Windows: descargar desde https://ollama.com/download
```

### Descargar modelos

El sistema intenta cada modelo en orden. Instala **al menos uno**:

```bash
# Recomendado para español (Alibaba Qwen 2.5, 7B)
ollama pull qwen2.5:7b

# Moonshot Kimi K2
ollama pull kimi-k2

# Meta Llama 3.2 (ligero, 3B — ideal para hardware limitado)
ollama pull llama3.2:3b

# Mistral 7B (buen balance velocidad/calidad)
ollama pull mistral

# DeepSeek R1 (razonamiento avanzado)
ollama pull deepseek-r1:7b

# Microsoft Phi-4 Mini (muy ligero)
ollama pull phi4-mini

# Google Gemma 3 (4B)
ollama pull gemma3:4b
```

### Modelos adicionales soportados

Cualquier modelo compatible con Ollama funciona. Agrega el nombre a `OLLAMA_MODELS`:

```bash
# Más opciones:
ollama pull llama3.1:8b       # Meta Llama 3.1 (8B)
ollama pull qwen2.5:14b       # Qwen 2.5 grande (14B, requiere 16GB RAM)
ollama pull mistral-small     # Mistral Small (22B)
ollama pull codegemma         # Google CodeGemma (para código)
ollama pull codellama         # Meta Code Llama
ollama pull yi                # 01.AI Yi
ollama pull solar             # Upstage Solar
ollama pull command-r         # Cohere Command R
```

### Verificar modelos instalados

```bash
# Ver modelos descargados
ollama list

# Probar un modelo
ollama run qwen2.5:7b "Hola, ¿cómo estás?"
```

### Verificar desde la API

Una vez el backend esté corriendo:
```bash
curl http://localhost:8001/api/v1/local-models
```

Respuesta esperada:
```json
{
  "ollama_url": "http://localhost:11434",
  "configured_chain": ["qwen2.5:7b", "kimi-k2", "llama3.2:3b", ...],
  "installed_models": ["qwen2.5:7b", "llama3.2:3b"],
  "ready": ["qwen2.5:7b", "llama3.2:3b"],
  "missing": ["kimi-k2", "mistral", ...]
}
```

---

## 4. Instalación y Ejecución

### Backend

```bash
cd backend-ia
pip install fastapi uvicorn python-dotenv google-generativeai requests
python3 main.py
# → http://localhost:8001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5000
```

---

## 5. Lógica de IA Híbrida

```
Petición del usuario
        │
        ▼
¿Google API Key configurada?
   │           │
  SÍ          NO
   │           │
   ▼           │
Llamar a       │
Gemini ────▶ ¿Éxito?
   │           │
  SÍ          NO (error/timeout)
   │           │
   ▼           ▼
Respuesta   CADENA DE FALLBACK LOCAL
 Cloud      ┌─▶ qwen2.5:7b ─▶ ¿Ok? → Respuesta
            │   ✗
            ├─▶ kimi-k2 ────▶ ¿Ok? → Respuesta
            │   ✗
            ├─▶ llama3.2:3b ▶ ¿Ok? → Respuesta
            │   ✗
            ├─▶ mistral ────▶ ¿Ok? → Respuesta
            │   ✗
            ├─▶ deepseek ───▶ ¿Ok? → Respuesta
            │   ✗
            ├─▶ phi4-mini ──▶ ¿Ok? → Respuesta
            │   ✗
            └─▶ gemma3:4b ──▶ ¿Ok? → Respuesta
```

El sistema prueba cada modelo local en secuencia hasta que uno responda exitosamente. Si Ollama no está corriendo, se detiene inmediatamente sin intentar los demás.

---

## 6. Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Health check básico |
| `GET` | `/health` | Estado detallado del sistema |
| `POST` | `/api/v1/assistant/ask` | Pregunta al asistente IA |
| `POST` | `/api/v1/assistant/draft-diagnosis` | Genera diagnóstico previo |
| `POST` | `/api/v1/voice/generate` | Genera audio con ElevenLabs |
| `GET` | `/api/v1/models` | Lista modelos Gemini (cloud) |
| `GET` | `/api/v1/local-models` | Lista modelos Ollama (local) |
| `GET` | `/api/v1/patients` | Lista pacientes de Supabase |
| `GET` | `/api/v1/patients/:id` | Obtiene un paciente por ID |
| `GET` | `/api/v1/patients/:id/records` | Registros médicos del paciente |

---

## 7. Estructura del Proyecto

```
OpenS/
├── backend-ia/
│   ├── main.py              # API FastAPI (IA híbrida + voz)
│   ├── .env                 # Variables de entorno (tu copia)
│   └── .env.example         # Plantilla con documentación
│
├── frontend/                # Astro 6 + Tailwind CSS 4
│   ├── astro.config.mjs     # Configuración + proxy
│   ├── public/
│   │   ├── sw.js            # Service Worker (PWA)
│   │   └── manifest.json    # Manifiesto PWA
│   └── src/
│       ├── layouts/BaseLayout.astro
│       ├── components/Navbar.astro
│       └── pages/
│           ├── index.astro      # Landing pública
│           ├── auth.astro       # Login / Registro
│           ├── asistente.astro  # Chat IA
│           ├── doctor.astro     # Dashboard médico
│           ├── paciente.astro   # Portal del paciente
│           ├── admin.astro      # Administración
│           └── seguros.astro    # Seguros
│
├── Base de Datos/
│   └── supabase_schema.sql  # Schema + datos de ejemplo
│
├── EXECUTIVE_SUMMARY.md
└── README.md
```

---

## 8. Páginas y Roles

| Ruta | Visibilidad | Rol | Descripción |
|------|-------------|-----|-------------|
| `/` | Pública | — | Landing para pacientes |
| `/auth` | Pública | — | Login/Registro |
| `/asistente` | Privada | Médico | Chat IA con historial |
| `/doctor` | Privada | Médico | Dashboard y stats |
| `/paciente` | Privada | Paciente | Portal personal |
| `/admin` | Privada | Admin | Config del sistema |
| `/seguros` | Privada | Admin/Médico | Convenios |

---

## Stack Tecnológico

| Componente | Tecnología |
|------------|-----------|
| Frontend | Astro 6, Tailwind CSS 4 |
| Backend | Python 3.11, FastAPI, Uvicorn |
| IA Cloud | Google Gemini 2.5 Flash |
| IA Local | Ollama (Qwen, Kimi, Llama, Mistral, DeepSeek, Phi, Gemma) |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Voz | ElevenLabs TTS |
| PWA | Service Worker + Manifest |

---

## Licencia

Proyecto para la Hackathon Dev3pack.
