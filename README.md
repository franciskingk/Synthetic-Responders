# Synthetic Research Lab (SRL)

Production-grade MVP SaaS platform for synthetic survey respondent generation using AI.

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL database (Supabase free tier recommended)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database
python -c "from app.db.init_db import init_db; init_db()"

# Run server
python -m uvicorn main:app --reload
```

Backend available at: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with backend URL

# Run development server
npm run dev
```

Frontend available at: `http://localhost:3000`

## Architecture

### Backend (Python 3.11 + FastAPI)
- **Layered architecture**:
  - Routes → Services → Engine → Data Layer
  - Strict separation of concerns
- **Core modules**:
  - Auth Service: JWT, password hashing, Google OAuth
  - Persona Service: CRUD + validation
  - Survey Service: Builder + question management
  - Simulation Engine: Quant + Qual response generation
  - LLM Adapter: Groq → OpenRouter → Local fallback
  - Export Service: CSV generation

### Frontend (Next.js 14 + TypeScript)
- **App Router** with server/client components
- **Pages**:
  - `/login` - Email/password authentication
  - `/register` - User registration
  - `/dashboard` - Summary statistics
  - `/personas` - Create/manage research personas
  - `/surveys` - Create/manage surveys
  - `/simulations` - Run simulations & export results
- **State management**: React hooks + Axios
- **Styling**: Tailwind CSS

### Database (PostgreSQL)
- **Tables**: users, personas, surveys, questions, simulations, responses
- **Relationships**: User → Personas, Surveys, Simulations
- **Indexes**: Optimized for common queries

## Core Features

### 1. **User Authentication**
- Email/password sign-up and login
- JWT tokens (7-day expiry)
- Google OAuth support

### 2. **Persona Management**
- Demographics: name, age, gender, location, income, education
- Psychographics: 5-trait model (0-1 scale) with validation & clamping
- CRUD operations with user isolation

### 3. **Survey Builder**
- Create surveys with multiple question types
- MCQ (multiple choice)
- Likert scale (1-5)
- Open-ended questions
- Question reordering

### 4. **Synthetic Response Generation**
#### Quantitative (Deterministic)
- **Likert**: `score = 3 + (brand_loyalty×1.2) + (price_sensitivity×1.0) + N(0,0.5)` → clamp[1,5]
- **MCQ**: Weighted random selection based on persona traits

#### Qualitative (LLM-based)
- Persona-conditioned prompts (demographics + psychographics)
- Natural, first-person responses
- Max 120 words

### 5. **LLM Adapter** (Provider-agnostic)
- **Primary**: Groq (fast, free tier)
- **Fallback 1**: OpenRouter (broad model selection)
- **Fallback 2**: Local endpoint (self-hosted)
- Automatic retry with exponential backoff
- 30-second timeout per request

### 6. **Data Export**
- CSV format with all response metadata
- Columns: respondent_id, question_id, question_text, type, numeric_answer, text_answer, created_at
- Browser download

## Tech Stack

### Backend
- **Framework**: FastAPI 0.104.1
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL (Supabase)
- **Auth**: JWT (python-jose) + bcrypt
- **HTTP**: httpx (async)
- **Server**: Uvicorn

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript 5.3
- **UI**: Tailwind CSS 3.3
- **HTTP Client**: Axios
- **Forms**: React Hook Form

## Deployment

### Frontend → Vercel
1. Push code to GitHub
2. Create Vercel project → connect GitHub repo
3. Set `NEXT_PUBLIC_API_URL` environment variable
4. Auto-deploys on push

### Backend → Render
1. Create Render Web Service
2. Connect GitHub repository
3. Set environment variables (.env)
4. Deploy Python 3.11 runtime
5. Auto-deploys on push

### Database → Supabase
1. Create Supabase project
2. Get PostgreSQL connection string
3. Set `DATABASE_URL` in backend .env
4. Run `python -c "from app.db.init_db import init_db; init_db()"`

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=your-secret-key
GROQ_API_KEY=your-groq-key
OPENROUTER_API_KEY=your-openrouter-key
LOCAL_LLM_ENDPOINT=http://localhost:8000
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000  # Dev
NEXT_PUBLIC_API_URL=https://api.yourdomain.com  # Prod
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `POST /auth/google` - Google OAuth

### Personas
- `GET /personas` - List user's personas
- `POST /personas` - Create persona
- `GET /personas/{id}` - Get persona
- `PUT /personas/{id}` - Update persona
- `DELETE /personas/{id}` - Delete persona

### Surveys
- `GET /surveys` - List user's surveys
- `POST /surveys` - Create survey
- `GET /surveys/{id}` - Get survey with questions
- `DELETE /surveys/{id}` - Delete survey
- `POST /surveys/{id}/questions` - Add question
- `PUT /surveys/{id}/reorder-questions` - Reorder questions
- `DELETE /surveys/{id}/questions/{question_id}` - Delete question

### Simulations
- `POST /simulations` - Create & run simulation (background task)
- `GET /simulations` - List user's simulations
- `GET /simulations/{id}` - Get simulation status
- `GET /simulations/{id}/export` - Export CSV

## Project Structure

```
Synthetic Response/
├── backend/
│   ├── app/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── engine/          # Quant + Qual engines
│   │   ├── llm/            # LLM adapter
│   │   ├── models/          # ORM + Pydantic schemas
│   │   ├── db/              # Database config
│   │   ├── middleware/      # Auth & error handling
│   │   └── config.py        # Settings
│   ├── main.py              # FastAPI app entry
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
└── frontend/
    ├── app/                 # Next.js pages
    │   ├── login/
    │   ├── register/
    │   ├── dashboard/
    │   ├── personas/
    │   ├── surveys/
    │   └── simulations/
    ├── components/          # React components
    ├── lib/                 # Utilities (API, auth, types)
    ├── styles/              # Global CSS
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── .env.local.example
    └── README.md
```

## Development Workflow

1. **Start backend**:
   ```bash
   cd backend && python -m uvicorn main:app --reload
   ```

2. **Start frontend**:
   ```bash
   cd frontend && npm run dev
   ```

3. **Develop**: Make changes, see hot-reload

4. **Test**: 
   - Backend: Visit `http://localhost:8000/docs`
   - Frontend: Visit `http://localhost:3000`

5. **Deploy**: Push to GitHub → auto-deployment on Vercel/Render

## Security

- JWT tokens with 7-day expiry
- bcrypt password hashing (rounds=12)
- CORS protection (configurable origins)
- SQL injection prevention (parameterized queries)
- XSS prevention (React auto-escaping)
- API key management (backend-only, .env-stored)
- User isolation (all resources checked for ownership)

## Performance Optimization

- **Database**: Indexes on common query paths
- **LLM**: Async calls with timeouts
- **Frontend**: Next.js static optimization
- **API**: Request/response caching ready
- **Simulation**: Batch response generation

## MVP Definition: ✓ COMPLETE

- [x] User registration & login
- [x] Persona creation (demographics + psychographics)
- [x] Survey builder with multiple question types
- [x] Synthetic respondent generation
- [x] Quantitative responses (deterministic formula + weighted random)
- [x] Qualitative responses (LLM-generated)
- [x] Response storage
- [x] CSV export
- [x] Deployment-ready (Vercel + Render + Supabase)

## Next Steps (Post-MVP)

- Advanced analytics dashboard
- Persona templates library
- Survey template gallery
- Batch simulation scheduling
- Custom LLM model fine-tuning
- Response validation & consistency checks
- A/B testing simulation comparisons
- Team collaboration & sharing

## Support & Contributing

This is an MVP for demonstration. For production use, add:
- Comprehensive error handling
- Rate limiting
- Request validation
- Logging & monitoring
- Automated testing
- CI/CD pipeline

---

**Built with engineering excellence for research platforms.**
