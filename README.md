# Medical AI Assistant

A comprehensive medical AI assistant application with a FastAPI backend and Next.js frontend.

## Features

- **AI-Powered Chat**: Intelligent medical assistant using OpenAI GPT-5
  - Typing indicator with animated dots
  - Streaming text effect for natural conversation
  - Copy-to-clipboard for assistant responses
- **Smart Patient Search**: Instant search with debouncing and friendly empty states
- **Medical History Timeline**: Visual timeline with color-coded icons
  - Red for cardiology
  - Blue for prescriptions
  - Purple for lab results
  - Collapsible descriptions
- **Patient Cards**: Display patient information with age and last visit
- **Toast Notifications**: Real-time feedback for user actions
- **Medical Records Integration**: Supabase integration for patient history
- **Professional UI**: Medical-themed design with Tailwind CSS

## Quick Start

### 1. Set Up Environment Variables

The application requires an OpenAI API key to function. Supabase credentials are optional.

**Backend (.env in root directory):**
```bash
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_url (optional)
SUPABASE_KEY=your_supabase_key (optional)
```

**Frontend (optional for Supabase features):**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Access the Application

The application runs on two servers:
- **Frontend**: Port 5000 (main application interface)
- **Backend API**: Port 8000 (internal API)

Open the webview to access the frontend interface.

### 3. Using the Chat

1. Type your medical question in the input field
2. Click "Send" to get an AI-powered response
3. The assistant uses patient history from Supabase if available

## Project Structure

```
.
├── backend-ia/           # FastAPI backend
│   ├── main.py          # Main API application
│   └── .env.example     # Environment template
├── frontend/            # Next.js frontend
│   ├── app/            # Next.js App Router
│   │   ├── page.tsx   # Main chat page
│   │   ├── layout.tsx # Root layout
│   │   └── globals.css # Global styles
│   ├── components/     # React components
│   │   └── PatientCard.tsx
│   └── lib/           # Utilities
│       └── supabaseClient.ts
└── README.md          # This file
```

## API Endpoints

### Backend API (Port 8000)

- `GET /` - Health check
- `POST /api/v1/assistant/ask` - Ask the AI assistant
  ```json
  {
    "patient_id": 123,
    "prompt_text": "What should I know about my condition?"
  }
  ```

## Technologies

- **Backend**: Python 3.11, FastAPI, OpenAI SDK, Supabase
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI**: OpenAI GPT-5
- **Database**: Supabase (PostgreSQL)

## Development

Both services start automatically via Replit workflows:
- Backend runs: `cd backend-ia && python main.py`
- Frontend runs: `cd frontend && npm run dev`

## Notes

- The backend includes fallback responses if OpenAI API key is not configured
- Supabase is optional; the app works without it but won't have patient history
- The frontend proxies `/api/*` requests to the backend on port 8000
