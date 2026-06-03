# AI-Powered Interview Preparation Platform

An AI-driven full-stack simulation engine that parses candidate profiles, evaluates job specifications, isolates learning deficiencies, and coordinates live mock interview runs using agentic architectures.

---

## Technical Stack & Architecture

### Frontend
- **Framework**: React 18 + Vite
- **Router**: React Router Dom
- **Analytics & Visualizations**: Chart.js + React Chartjs 2 (Radar chart skill overlaps)
- **Icons**: Lucide React
- **Theme**: Premium Custom HSL Slate Dark System (Vanilla CSS variables)

### Backend
- **Platform**: Node.js + Express (ES Modules)
- **Database**: MongoDB (Mongoose models for session persistence)
- **Vector Index (RAG)**: ChromaDB with dynamic local in-memory vector fallback
- **Orchestration**: LangChain & LangGraph agents framework
- **Telemetry Evaluation**: LangSmith metric aggregators

---

## 🤖 Multi-Agent Graph Orchestration (LangGraph Flow)

The setup pipeline runs through 5 specialized sub-agents:
1. **ResumeAgent**: Extracts PDF/DOCX content into structured profile profiles (Skills, Experience, Certifications).
2. **JDAgent**: Evaluates job descriptions to extract target roles, levels, stack, and responsibilities.
3. **GapAgent**: Maps semantic similarities between candidate skills and role target skills, calculating scores for the radar visualizer.
4. **QuestionGeneratorAgent**: Generates dynamic questions based on missing skills using RAG context.
5. **RoadmapAgent**: Structures a 4-week learning tracker packed with target resources to fill identified gaps.

---

## 🛡️ Enterprise-Grade Security Implementation

- **Prompt Injection Defense**: Intercepts and rejects requests carrying override/system-redefining queries. Blocks are tracked in audit logs.
- **Strict Rate Limiting**:
  - General endpoints: 100 req / 15 mins.
  - Auth routes: 15 attempts / 15 mins (prevents brute forcing).
  - AI LLM calls: 30 calls / hour (prevents billing abuse).
- **Data Masking**: Masks credentials and keys in database transaction logs.
- **Audit Logs**: Logs state-changing endpoints, IP signatures, status results, and security alerts.

---

## 📊 Telemetry and Correctness Dials (Evaluation)

The platform evaluates LLM requests to display key metrics:
- **Latency (ms)**: Average turnaround time of Groq queries.
- **Estimated Cost (USD)**: Calculated using input and output token counts against model pricing.
- **Accuracy**: Measure of factual correctness.
- **Relevance**: Alignment of prompt constraints to responses.
- **Faithfulness**: Validation of RAG grounding.
- **Hallucination Rate**: Verification of unsupported claims.

---

## Local Development Instructions

### 1. Requirements
- Node.js v16+
- MongoDB running locally or MongoDB Atlas connection string.
- (Optional) ChromaDB running on port 8000. If unavailable, the platform automatically starts an in-memory mock vector database.

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Setup environment variables by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Populate your real `GROQ_API_KEY` and `LANGCHAIN_API_KEY`. If keys are not set, ensure `DEMO_MODE=true` is enabled in `.env`.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start React dev server:
   ```bash
   npm run dev
   ```
4. Access the web app at: `http://localhost:5173`.

---

## Deployment Strategy

### Backend Deployment (Render / Docker)
Deploy the Node server as a web service.
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- Set environment variables (`MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`, etc.) in the Render dashboard.

### Frontend Deployment (Vercel)
Deploy the React application to Vercel.
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- Set up a redirection route in `vercel.json` if using custom page routers:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
"# AI-Powered-Interview-Preparation-Platform" 
