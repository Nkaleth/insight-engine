<a name="readme-top"></a>

<div align="center">
  <h1><b>Oracle API | AI Orchestrator Backend</b></h1>
  <p>A specialized Ruby on Rails 8 REST API for local LLM orchestration, technical guidance, and real-time inference streaming.</p>

  <h3>Project Architecture</h3>
  <p>Engineered with <b>Rails 8</b>, <b>Ollama</b>, and <b>Sidekiq</b> for high-performance AI processing.</p>
</div>

# 📗 Table of Contents

- [📖 About the Project](#about-project)
  - [🛠 Built With](#built-with)
    - [Tech Stack](#tech-stack)
    - [Key Features](#key-features)
- [💻 Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Install](#install)
  - [Database & Seeds](#database--seeds)
  - [AI Model Setup (Ollama)](#ollama-setup)
  - [Usage](#usage)
- [👥 Authors](#authors)
- [🔭 Future Features](#future-features)
- [🤝 Contributing](#contributing)
- [⭐️ Show your support](#support)
- [🙏 Acknowledgements](#acknowledgements)
- [📝 License](#license)

# 📖 Oracle API - Backend <a name="about-project"></a>

> **Oracle API** is a technical orchestrator that bridges user requests with local Large Language Models. Built on **Rails 8**, it utilizes a service-oriented architecture to manage AI queries via **Ollama**, ensuring a responsive UI through asynchronous job processing and real-time state synchronization.

**🔗 Frontend Repository:** [Oracle Chat (Next.js)](https://github.com/Nkaleth/oracle_front)

## 🛠 Built With <a name="built-with"></a>

### Tech Stack <a name="tech-stack"></a>

<details>
  <summary>Core & Jobs</summary>
  <ul>
    <li><a href="https://rubyonrails.org/">Ruby on Rails 8</a></li>
    <li><a href="https://www.postgresql.org/">PostgreSQL</a> (Primary DB)</li>
    <li><a href="https://sidekiq.org/">Sidekiq</a> (Background Job Processing)</li>
    <li><a href="https://redis.io/">Redis</a> (Job state & Sincronization)</li>
  </ul>
</details>

<details>
  <summary>AI & Security</summary>
  <ul>
    <li><a href="https://ollama.com/">Ollama</a> (Local LLM Inference)</li>
    <li><a href="https://jwt.io/">JWT</a> (Stateless Authentication)</li>
    <li><a href="https://github.com/rails/kredis">Kredis</a> (Idempotency Layer)</li>
  </ul>
</details>

### Key Features <a name="key-features"></a>

- **Asynchronous AI Inference**: Uses **Sidekiq** to process heavy AI requests without blocking the main thread.
- **Sidekiq-Rails Sync**: Real-time synchronization via **Redis** to update the conversation state once the LLM finishes inference.
- **Service-Oriented Design**: Dedicated `Service Objects` to encapsulate the complexity of Ollama API interactions.
- **JWT Authentication**: Secure and stateless user access control.
- **Request Idempotency**: Powered by **Kredis** to prevent duplicate generations during network instability.
- **Smart Seeding**: Includes predefined **System Prompts** and test users to accelerate development environment setup.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 💻 Getting Started <a name="getting-started"></a>

Follow these steps to set up the backend orchestrator locally.

### Prerequisites

- **Ruby 3.3.0+**
- **PostgreSQL**
- **Redis**
- **Ollama** (Installed and running)

### Setup

Clone the repository:

```bash
git clone [https://github.com/Nkaleth/oracle_api.git](https://github.com/Nkaleth/oracle_api.git)
cd oracle_api
```

### Install

Install dependencies:

```bash
bundle install
```

### Database Setup

Configure your `database.yml` and run:

```bash
rails db:prepare
rails db:seed
```

### AI Model Setup (Ollama) <a name="ollama-setup"></a>

1. Ensure Ollama is running: `ollama serve`
2. Download the preferred model:

<!-- end list -->

```bash
ollama run llama3 # or your specific model
```

### Usage

Start the background workers and the server:

```bash
# Terminal 1: Background Jobs
bundle exec sidekiq

# Terminal 2: Rails Server
rails s
```

The API will be available at `http://localhost:3000`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 👥 Authors <a name="authors"></a>

👤 **Nilton Segura**

- GitHub: [@Nkaleth](https://github.com/Nkaleth)
- Twitter: [@NoeSeguraL](https://twitter.com/NoeSeguraL)
- LinkedIn: [Nilton Segura](https://www.linkedin.com/in/niltonsegura/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🔭 Future Features <a name="future-features"></a>

- [ ] **Smart Pagination (Pagy)**: Activate the pre-installed Pagy gem to handle large message histories efficiently.
- [ ] **Fine-grained Authorization**: Implement **Pundit** or **CanCanCan** for secure resource access control (RBAC).
- [ ] **Vector Search (RAG)**: Integrate a vector database to provide the AI with local documentation context.
- [ ] **Multi-Model Support**: Dynamic model selection per conversation thread.
- [ ] **Rate Limiting**: Throttling for AI inference endpoints using `rack-attack`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🤝 Contributing <a name="contributing"></a>

Feel free to fork this project and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## ⭐️ Show your support <a name="support"></a>

If you find this backend architecture useful, please give it a star\! 🌟

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🙏 Acknowledgements <a name="acknowledgements"></a>

- The Rails team for the **Rails 8** revolution and the rock-solid **Action Cable** architecture.
- The **Sidekiq** community for providing the gold standard in high-performance background processing.
- The **Ollama** community for making local LLM deployment accessible and efficient for developers.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 📝 License <a name="license"></a>

This project is [MIT](https://www.google.com/search?q=./LICENSE) licensed.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
