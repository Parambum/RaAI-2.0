# RaAI — Agentic RAG Emotional Wellness System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)

An AI-powered emotional intelligence coach using Retrieval-Augmented Generation (RAG) for personalized wellness exercises and journal analysis.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (optional)
- At least one LLM API key (Google Gemini, Groq, or OpenAI)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/taqneeq/talking-rock.git
cd RaAI
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Option A: Docker Compose (Recommended)**
```bash
docker-compose up -d
```
- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- MongoDB: localhost:27017
- Qdrant: http://localhost:6333

4. **Option B: Native Development**

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                        │
│  (App Router, TypeScript, Tailwind, Radix UI)               │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API
┌───────────────────────▼─────────────────────────────────────┐
│                    FastAPI Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Core       │  │     RAG      │  │   Prompts    │     │
│  │  Modules     │  │   Pipeline   │  │   Registry   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────┬─────────────────┬─────────────────┬───────────┘
            │                 │                 │
    ┌───────▼──────┐  ┌──────▼─────┐  ┌────────▼────────┐
    │   MongoDB    │  │    FAISS   │  │  LLM Providers  │
    │  (Sessions)  │  │  (Vectors) │  │ Gemini/Groq/GPT │
    └──────────────┘  └────────────┘  └─────────────────┘
```

### Key Features

- **5-Dimension EQ Analysis**: Self-awareness, self-regulation, motivation, empathy, social skills
- **Cognitive Distortion Detection**: Dual LLM + regex-based pattern recognition
- **RAG-Powered Exercises**: Personalized recommendations from wellness document corpus
- **Session Management**: Multiple named conversations like ChatGPT
- **Offline-First Frontend**: Graceful degradation with local fallbacks
- **TTS/STT Integration**: ElevenLabs voice I/O with mock fallbacks
- **Crisis Detection**: Keyword + LLM-based safety escalation

## 📚 Documentation

- [**GitHub Copilot Instructions**](.github/copilot-instructions.md) - AI agent guide
- [**Architecture Vision**](COPILOT_PROMPT.md) - System design and roadmap
- [**API Documentation**](http://localhost:8000/docs) - Interactive Swagger UI (when backend running)

## 🧪 Testing

```bash
cd backend

# Run all tests
pytest tests/

# Run with coverage
pytest --cov=core --cov=rag tests/

# Run specific test module
pytest tests/agents/test_journal_analyzer.py -v

# Run by marker
pytest -m unit
```

Test structure:
- `tests/agents/` - Core business logic tests
- `tests/rag/` - RAG pipeline and retrieval tests
- `tests/db/` - MongoDB data layer tests
- `tests/conftest.py` - Shared fixtures and mocks

## 🔧 Configuration

### Environment Variables

Required (set at least one):
- `GEMINI_API_KEY` - Google Gemini LLM
- `GROQ_API_KEY` - Groq LLM
- `OPENAI_API_KEY` - OpenAI GPT

Optional:
- `MONGO_URI` - MongoDB connection string (default: localhost)
- `QDRANT_URL` - Qdrant vector store (falls back to FAISS)
- `ELEVENLABS_API_KEY` - TTS/STT (uses mocks if not set)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` - SMS alerts
- `FCM_SERVER_KEY` - Push notifications

### LLM Provider Selection

Edit `backend/config/config.yaml`:
```yaml
llm:
  google:
    provider: "google"
    model_name: "gemini-2.0-flash-exp"
    temperature: 0.2
  groq:
    provider: "groq"
    model_name: "llama-3.1-8b-instant"
    temperature: 0.2
```

## 🌐 Deployment

### Production Checklist

- [ ] Set all required environment variables
- [ ] Configure MongoDB Atlas connection
- [ ] (Optional) Set up Qdrant Cloud for vectors
- [ ] Enable CORS for frontend domain
- [ ] Set up SSL/TLS certificates
- [ ] Configure backup strategy for MongoDB

### Recommended Platforms

**Backend (FastAPI):**
- [Render](https://render.com) - Easy Python deployment
- [Fly.io](https://fly.io) - Global edge deployment
- [Railway](https://railway.app) - Quick one-click deploy

**Frontend (Next.js):**
- [Vercel](https://vercel.com) - Zero-config Next.js hosting
- [Netlify](https://netlify.com) - Alternative with edge functions

**Database:**
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Managed MongoDB
- [Qdrant Cloud](https://cloud.qdrant.io) - Managed vector store

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing patterns (see `.github/copilot-instructions.md`)
- Add tests for new features
- Use structured logging (see `logger/custom_logger.py`)
- All LLM calls must use `PROMPT_REGISTRY`
- Mock external APIs in tests

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- LangChain for RAG orchestration
- FastAPI for the backend framework
- Next.js for the frontend
- Google Gemini / Groq for LLM capabilities
- shadcn/ui for UI components

## 📧 Contact

Project Link: [https://github.com/taqneeq/talking-rock](https://github.com/taqneeq/talking-rock)

---

*Built with ❤️ for emotional wellness*
