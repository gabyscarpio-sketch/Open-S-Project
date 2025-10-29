# Medical AI Assistant

## Overview
A comprehensive medical AI assistant application that helps healthcare providers and patients interact with an intelligent chatbot. The system features a FastAPI backend with OpenAI GPT-5 integration and a modern Next.js frontend with a professional medical-themed UI.

**Current Status**: MVP Complete - Full-stack medical AI assistant with chat interface, patient cards, and LLM integration.

## Recent Changes (October 29, 2025)
- ✅ Initialized project structure with `backend-ia` and `frontend` directories
- ✅ Set up FastAPI backend with OpenAI GPT-5 integration
- ✅ Implemented Supabase integration for medical records
- ✅ Created Next.js frontend with TypeScript and Tailwind CSS
- ✅ Built chat interface with real-time messaging
- ✅ Added PatientCard component for patient information display
- ✅ Configured workflows for both backend (port 8000) and frontend (port 5000)
- ✅ **NEW UX Enhancements:**
  - Intelligent patient search with 300ms debounce and friendly empty states
  - Typing indicator with animated dots while AI responds
  - Streaming text effect (word-by-word) for natural conversation flow
  - Copy-to-clipboard button on hover for assistant messages
  - Toast notifications for user feedback (success/error/info)
  - Medical history timeline with color-coded icons
  - Collapsible descriptions for long medical records
  - Improved loading states and form feedback

## Project Architecture

### Backend (`backend-ia/`)
- **Framework**: FastAPI with uvicorn server
- **AI Integration**: OpenAI GPT-5 for intelligent medical assistance
- **Database**: Supabase for medical records storage
- **Main Endpoint**: `/api/v1/assistant/ask` - Processes patient queries with context from medical history

**Key Features**:
- CORS enabled for development
- Patient medical history retrieval from Supabase
- Context-aware AI responses using patient history
- Pydantic models for request/response validation
- Error handling with HTTP exceptions

### Frontend (`frontend/`)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with medical-themed design
- **UI Components**:
  - Chat interface with message history
  - PatientCard component for displaying patient info
  - Responsive gradient background (blue to indigo)
  - Real-time loading states

**Key Features**:
- Client-side state management with React hooks
- API integration with backend via fetch
- Professional medical UI with indigo color scheme
- Example patient cards with name, age, and last visit date
- **Advanced UX Features**:
  - Smart patient search with debouncing
  - Typing indicator for chat responses
  - Streaming text animation for AI replies
  - One-click copy for assistant messages
  - Toast notifications system
  - Interactive medical history timeline
  - Color-coded event types (cardiology, prescriptions, labs)
  - Collapsible long descriptions

## Environment Variables

### Backend (Required for full functionality)
- `OPENAI_API_KEY`: OpenAI API key for GPT-5 access
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase service key

### Frontend (Optional for Supabase features)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL for client-side access
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key for browser

## Running the Application

The application uses two workflows:
1. **Backend API** - Runs on port 8000 (console output)
2. **Frontend** - Runs on port 5000 (webview output)

Both workflows start automatically. The frontend is accessible at port 5000.

## Database Schema

Expected Supabase table structure:
```sql
medical_records:
  - patient_id (integer)
  - date (text/timestamp)
  - notes (text)
  - [other medical record fields]
```

## User Preferences
- Language: English/Spanish support
- Focus: Medical/healthcare applications
- Emphasis on clean, professional medical UI design

## Tech Stack
- **Backend**: Python 3.11, FastAPI, OpenAI SDK, Supabase client, uvicorn
- **Frontend**: Node.js 20, Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI Model**: GPT-5 (latest OpenAI model as of August 2025)
- **Database**: Supabase (PostgreSQL)

## Next Phase Features
- User authentication for healthcare providers and patients
- Comprehensive patient profile management
- Real-time chat updates using WebSockets
- Patient dashboard with appointment scheduling
- Document upload for medical records
- Conversation history persistence
- Multi-language support
- HIPAA compliance features
