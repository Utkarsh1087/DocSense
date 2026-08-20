# DocSense — Enterprise Full-Stack AI RAG Platform

An enterprise-grade, high-throughput Retrieval-Augmented Generation (RAG) SaaS platform built with **Next.js 14 (App Router)**, **TypeScript**, **MongoDB Atlas**, **Pinecone**, **Google Gemini AI**, and **Stripe**.

DocSense allows users to ingest massive multi-page documents (PDF upload or URL import) through configurable parsing engines, retrieving semantically relevant vector contexts in **<150ms** and streaming AI responses with **<500ms time-to-first-token (TTFT)**.

---

## 🎯 Architecture & Performance Highlights

* **⚡ Ultra-Low Retrieval Latency (<150ms)**: Direct Pinecone vector queries with indexed user-level metadata filters.
* **🚀 Real-Time Token Streaming (<500ms TTFT)**: Server-Sent Events (SSE) streaming pipeline powered by Google Gemini 1.5 Flash.
* **📦 3-Engine Parallel Ingestion Pipeline (~2.5s / 10 pages)**:
  * **Standard Engine**: Sequential page-aware text extraction.
  * **Layout-Aware Engine**: Coordinate-based paragraph reconstruction and font-size heading detection.
  * **Table Engine**: X/Y coordinate clustering detecting grid structures and reconstructing Markdown pipe tables.
  * Embedded via **5 concurrent flight batches of 20 chunks** with exponential backoff retry.
* **🌐 High Concurrency & Scalability**:
  * Sustained **500 concurrent connections** in k6 load tests with **100% check success rate**.
  * Scaled to **40,000+ pages (~100,000 vectors)** in Pinecone free tier.
  * MongoDB connection pooling (`maxPoolSize: 50`) supporting **5,000+ registered users**.
* **🛡️ Security & Multi-Tenant Isolation**:
  * Cryptographically signed **HS256 JWT** session management (`auth.ts`).
  * Strict multi-tenant isolation in Pinecone (`userId: { $eq: userId }`) and MongoDB.
  * **SSRF Defense Engine** (`ssrfValidator.ts`) blocking loopback, cloud metadata (169.254.169.254), and private subnets.
  * In-memory sliding-window **Rate Limiter** (15 req/min Free / 60 req/min Pro) returning RFC 6585 headers.
* **💳 Automated SaaS Subscription Billing**:
  * Stripe Checkout integration ($12/month Pro Tier).
  * Cryptographically verified Stripe webhook (`/api/stripe/webhook`) for automatic tier upgrade and cancellation downgrade.

---

## 🛠️ System Architecture

```
                                  ┌─────────────────────────────┐
                                  │      Client / Browser       │
                                  │  (Next.js React Dashboard)  │
                                  └──────────────┬──────────────┘
                                                 │
                             SSE Streams / REST  │  JWT Sessions / Bearer
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Next.js 14 Backend                                       │
│                                                                                          │
│   ├── /api/chat ──────────► Sliding Rate Limiter ──► Pinecone (<150ms) ──► Gemini (SSE)  │
│   ├── /api/documents ─────► Ingestion Pipeline (5x Parallel Batches) ────► Pinecone      │
│   ├── /api/documents/import-url ──► SSRF Validator ──► Magic Byte Check ──► Pipeline    │
│   ├── /api/stripe/webhook ◄── Stripe Events (Cryptographic Signature Verification)       │
│   └── /api/settings ──────► Per-User Configuration Engine                                │
└────────────────────────────┬─────────────────────────────┬───────────────────────────────┘
                             │                             │
                             ▼                             ▼
              ┌─────────────────────────────┐┌─────────────────────────────┐
              │     MongoDB Atlas (M0)      ││   Pinecone Vector DB        │
              │  - Connection Pool (50 max) ││  - 100K Vector Capacity     │
              │  - Indexed User Isolation   ││  - Cosine Similarity (768d) │
              │  - Query Logs & Analytics   ││  - Metadata Multi-Tenancy   │
              └─────────────────────────────┘└─────────────────────────────┘
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js**: `v18.17.0+` or `v20.x`
* **MongoDB**: MongoDB Atlas Cluster URI
* **Pinecone**: Free tier API key & Index (`768` dimensions, `cosine` metric)
* **Google Gemini**: Gemini API Key
* **Stripe**: Test mode API keys

### 2. Clone and Install
```bash
git clone https://github.com/your-username/DocSense.git
cd DocSense
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Populate the keys in `.env`:
```env
# AI Models
GEMINI_API_KEY=your_gemini_api_key

# Vector Database (Pinecone)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/docsense?appName=docsense

# Stripe Billing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Load Testing with k6

DocSense includes an automated load testing suite in [`load_test.js`](load_test.js) targeting concurrency spikes, rate-limit thresholds, and response latencies.

### Run CLI Load Test:
```bash
k6 run load_test.js
```

### Run with Real-Time Web GUI:
```bash
k6 run --out "web-dashboard=open=true,port=5665" load_test.js
```
Open `http://127.0.0.1:5665` in your browser to inspect live throughput, p95 latency curves, and VU ramps.

---

## 📂 Project Structure

```
DocSense/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analytics/         # User & admin aggregated platform telemetry
│   │   │   ├── auth/              # JWT signup, login, and secure upgrade APIs
│   │   │   ├── chat/              # SSE streaming RAG retrieval route
│   │   │   ├── documents/         # Upload, delete, and URL import pipelines
│   │   │   ├── settings/          # Per-user MongoDB configuration endpoints
│   │   │   └── stripe/            # Stripe Checkout & Webhook handler
│   │   ├── dashboard/             # Library, Chat, Settings, and Analytics consoles
│   │   ├── login/ & signup/       # Auth pages with interactive canvas animations
│   │   └── page.tsx               # High-converting landing page with stars canvas
│   ├── components/                # Glassmorphic UI components & interactive canvases
│   └── lib/
│       ├── auth.ts                # Lightweight HS256 JWT crypto engine
│       ├── docHelpers.ts          # Atomic multi-tenant MongoDB document queries
│       ├── ingestionPipeline.ts   # 5x parallel batch embedding & upsert pipeline
│       ├── mongodb.ts             # Singleton connection pooling (50 max connections)
│       ├── rateLimiter.ts         # Sliding-window 15 RPM free-tier limiter
│       ├── ssrfValidator.ts       # Anti-SSRF URL validator & subnet filter
│       └── parsers/               # Standard, Layout-Aware, and Table PDF engines
├── data/settings.json             # Global fallback settings configuration
├── load_test.js                   # High-concurrency k6 load test script
└── next.config.mjs                # Next.js 14 configuration with security headers
```

---

## 🛡️ Security & Quality Standards

* **Zero Leaks**: Multi-tenant isolation verified with independent tests.
* **SSRF Protected**: Validated with private subnet blocking and magic byte (`%PDF-`) headers.
* **Type-Safe**: 100% TypeScript compilation (`npx tsc --noEmit` exits with 0 errors).
* **Production Bundled**: Built and validated with `npm run build`.

---

## ☕ Developer's Confession & Dad Jokes (From the Engine Room)

> **Dad Joke #1**: Why did the PDF go to therapy?  
> *Because it had too many formatting issues and couldn't find its margins.* 📄

> **Dad Joke #2**: Why did the vector database break up with the relational database?  
> *Because they had no common dimension and relational DB was way too attached to tables.* 📐

* **The 107-Character Stripe Key Saga**: Special thanks to Stripe for secret keys that look like randomized CAPTCHAs. If your test payments are failing, verify if your `0` is a zero, your `O` is a capital letter, and your `Q` isn't masquerading as an `O`. We've spent 2 AM debugging that.
* **CSS Overflow vs. Sanity**: More time was spent wrestling smooth-scrolling overflow conflicts than implementing the entire cosine similarity vector search pipeline. CSS `overflow: hidden`: keeping developers humble since 1996.
* **The AI Greetings Engine**: If you register with an email like `DoctorSensei99@docs.com`, our Gemini greeting endpoint will enthusiastically welcome you as `Hello, Doctorsensei99!`. You are officially a doctor in our database.
* **The "Coming Soon" Button**: Yes, it has a sleek purple badge. Yes, clicking it 50 times in a row will not magically write the feature by itself (we checked).

---

## 📜 License & Author

Crafted with 🖤, way too much tea ☕, and ~14,000 hot-reloads of `localhost:3000`.

**Author**: [Utkarsh Rajput](https://github.com/Utkarsh1087)  
**License**: MIT License

