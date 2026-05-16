<div align="center">
  <h1><b>Insight Engine 🚀</b></h1>
  <p><b>Narrative & Market Miner | AI-Powered Frustration Archaeology</b></p>
  
  <p>
    <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
    <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/BullMQ-FF4081?style=for-the-badge&logo=redis&logoColor=white" alt="BullMQ" />
    <img src="https://img.shields.io/badge/llama.cpp-000000?style=for-the-badge&logo=meta&logoColor=white" alt="Llama.cpp" />
  </p>
</div>

---

## 🎯 Mission & Business Value

**Insight Engine** is an advanced Micro-SaaS built for creators, marketers, and solopreneurs to perform **"Frustration Archaeology"**. 

Instead of guessing what an audience wants, Insight Engine automatically extracts massive amounts of unstructured community data (from Reddit and YouTube comments), processes it through **local Large Language Models (LLMs)**, and identifies recurring pain points, unmet needs, and highly profitable business niches or content ideas.

By translating human complaints into mathematical vectors and applying sociological frameworks, it removes the guesswork from product development and content strategy.

---

## 💡 The Problem & The Solution

**The Problem:** The internet is full of valuable feedback hidden in plain sight. Users constantly complain about their problems on Reddit threads and YouTube comment sections. However, manually scraping, reading, and categorizing thousands of comments to find a viable business idea or a viral video angle is impossible to scale.

**The Solution:** Insight Engine automates this workflow end-to-end.
1. **Scraping:** It ingests hundreds of comments/posts in seconds.
2. **Analysis:** It runs sentiment analysis, semantic clustering, and frustration scoring using local AI models.
3. **Actionability:** It generates visual niche maps (D3.js), ready-to-use content ideas, and optimized prompts for viral titles based on real demand evidence.

---

## 🚀 Key Features

*   **🔍 Multi-Source Data Ingestion:** Automated scraping pipelines for Reddit subreddits and YouTube video comments.
*   **🧠 Local AI Processing:** Seamless integration with `llama.cpp` and `Ollama` for zero-cost, privacy-first inference and embedding generation using models like Llama 3 or Mistral.
*   **📊 Semantic Search & Clustering:** Transforms text into embeddings, storing them in PostgreSQL (`pgvector`), and groups similar pain points into visual clusters.
*   **💡 AI Content Strategist:** Generates high-converting YouTube video ideas, complete with Opportunity Scores, Formats, Hooks, and evidence backed by actual user comments.
*   **🗺️ Interactive Market Map:** A fully interactive D3.js visualization to explore market gaps and audience sentiments intuitively.
*   **📋 Prompt Generator:** Built-in tool that outputs a viral title generation prompt perfectly tailored with the analyzed audience data, ready to be pasted into ChatGPT/Claude.

---

## 🧠 System Architecture

The application is built as a highly scalable **Monorepo** managed by Turborepo, separating the heavy background processing from the interactive client.

```text
insight-engine/
├── apps/
│   ├── backend/       # NestJS Modular Core
│   │   ├── Scraping Services (Reddit/YouTube APIs)
│   │   ├── AI Inference Module (OpenAI-compatible client for llama.cpp)
│   │   ├── Vectorization & Database (Prisma + pgvector)
│   │   └── Job Queues (BullMQ + Redis)
│   │
│   └── frontend/      # Next.js 16 (App Router)
│       ├── Server & Client Components
│       ├── Data Visualization (D3.js)
│       ├── UI Framework (Tailwind CSS, Lucide Icons)
│       └── State Management (React Query)
│
├── docker-compose.yml # Infrastructure (Redis, PostgreSQL with pgvector)
└── turbo.json         # Monorepo orchestration
```

---

## 🛠️ Technical Deep Dive (For Engineering Teams)

As a Senior-level project, Insight Engine solves several complex engineering challenges:

1.  **VRAM & Resource Management:** Running local LLMs for inference and embeddings simultaneously can easily crash a GPU. The backend implements an unloading strategy, ensuring models are swapped out of memory dynamically to prevent Out-Of-Memory (OOM) errors during heavy vectorization tasks.
2.  **Asynchronous Event-Driven Queues:** Scraping and analyzing 500+ comments takes time. The backend uses **BullMQ** and **Redis** to offload processing to background workers, keeping the NestJS HTTP thread unblocked and highly responsive.
3.  **Strict API Contracts:** E2E type safety is enforced. The backend utilizes Global Pipes, Zod schemas, and standard Interceptors to guarantee predictable JSON shapes, which are seamlessly consumed by the React Query hooks in the frontend.
4.  **Vector Databases:** Extended standard PostgreSQL with the `pgvector` extension to perform cosine-similarity searches on semantic data.
5.  **Extensible Prompt Library:** The AI logic is completely decoupled from the application logic. The "Narrative Auditor" uses a strict JSON-schema prompt design to force LLMs to output valid, parseable structures reliably.

---

## 💻 Getting Started (Local Development)

### Prerequisites
*   Node.js (v18+) & `pnpm`
*   Docker & Docker Compose
*   Local AI Server (e.g., `llama.cpp` server or `Ollama` running on default ports)

### Installation

1. **Clone the repo:**
   ```bash
   git clone https://github.com/Nkaleth/insight-engine.git
   cd insight-engine
   ```

2. **Start Infrastructure (Redis, Postgres, pgvector):**
   ```bash
   docker compose up -d
   ```

3. **Install Dependencies:**
   ```bash
   pnpm install
   ```

4. **Environment Variables:**
   Copy the `.env.example` files to `.env` in both `apps/backend` and `apps/frontend`, and configure your database URLs and AI endpoints.

5. **Database Initialization:**
   Push the Prisma schema to your local PostgreSQL instance to create the tables and the `vector` extension:
   ```bash
   cd apps/backend
   pnpm prisma db push
   # or: pnpm prisma migrate dev
   cd ../..
   ```

6. **Start the Application:**
   Run both the Frontend & Backend concurrently via Turborepo:
   ```bash
   pnpm run dev
   ```

---

## 👥 Author

**Nilton Segura (Nkaleth)**
- **GitHub:** [@Nkaleth](https://github.com/Nkaleth)
- **LinkedIn:** [Nilton Segura](https://www.linkedin.com/in/niltonsegura)
- **Role:** Full-Stack Software Engineer specializing in AI Integration and Scalable Architectures.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](../../issues/).

## 📝 License
This project is [MIT](./LICENSE) licensed.
