<div align="center">
  <h1><b>Insight Engine | Narrative & Market Miner</b></h1>
  <p>A Micro-SaaS for "Frustration Archaeology", extracting community data to identify demand business niches using local AI.</p>

  <h3>Tech Stack</h3>
  <p>Engineered with <b>NestJS</b>, <b>Next.js 16</b>, <b>Ollama</b>, <b>llama.cpp</b>, and <b>BullMQ</b> for high-performance AI processing.</p>
</div>

---

## 🎯 Business Impact & The "Why"
**Insight Engine** is a Micro-SaaS designed for "Frustration Archaeology". It automates the extraction of massive unstructured data from communities (Reddit/YouTube), processes it using local LLMs (Llama 3/Mistral via Ollama) under sociological frameworks, and generates high-fidelity D3.js cluster maps to identify high-demand business niches.

---

## 🧠 System Architecture
```text
insight-engine/
├── apps/
│   ├── backend/    (NestJS Modular Core, Prisma, BullMQ, Swagger)
│   └── frontend/   (Next.js App Router, Server Components, D3.js)
├── docker-compose.yml  (Redis, PostgreSQL, pgvector)
├── package.json
├── pnpm-workspace.yaml
└── turbo.json      (Monorepo orchestration)
```

---

## 🚀 Technical Deep Dive
- **Local AI Inference:** Implemented a custom Ollama Factory Provider for zero-cost, private LLM execution using NVIDIA hardware.
- **Asynchronous Processing:** Built event-driven queues with BullMQ and Redis to decouple heavy scraping/AI tasks from the client.
- **Semantic Search:** Extended PostgreSQL with pgvector to transform human complaints into mathematical vectors.
- **Robust Security & Auth:** Stateless JWT Authentication with Edge Middleware protection in Next.js.
- **Type Safety & Contracts:** E2E type safety with Zod schemas and globally enforced API contracts via Interceptors.

---

## 💻 Getting Started

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

4. **Start the Monorepo Services:**
   - Run both Frontend & Backend concurrently:
     ```bash
     pnpm run dev
     ```
   - Run **only** Backend:
     ```bash
     pnpm --filter backend run dev
     ```
   - Run **only** Frontend:
     ```bash
     pnpm --filter frontend run dev
     ```

---

## 👥 Author
**Nilton Segura (Nkaleth)**
- GitHub: [@Nkaleth](https://github.com/Nkaleth)
- LinkedIn: [Nilton Segura](https://www.linkedin.com/in/niltonsegura)

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](../../issues/).

## 📝 License
This project is [MIT](./LICENSE) licensed.
