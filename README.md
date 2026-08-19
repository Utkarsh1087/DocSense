# DocSense Full-Stack SaaS RAG System

A professional, full-stack Retrieval-Augmented Generation (RAG) platform built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **LangChain**, **Google Gemini AI**, **Pinecone**, and **Stripe**.

This system allows users to upload local PDFs or index public PDF links directly, managing documents, chat reasoning logs, and subscription billing tiers in real-time.

---

## 🚀 Key Features

*   **⚡ Dynamic Ingestion Playground**: Paste a direct PDF link or Google Drive preview link on the homepage to instantly download, parse, and index it into your dashboard library.
*   **💳 Stripe Checkout Billing Portal**: Fully functional Stripe-hosted checkouts. Automatically redirects users to Stripe to purchase the Pro Tier ($12/mo) and handles successful return flows.
*   **🛡️ Multi-Tier SaaS Limits**:
    *   **Starter (Free)**: Restricted to 3 document uploads per month, standard search latency, and a capped 32K token reasoning context.
    *   **Pro ($12/mo)**: Unlimited document uploads, 128K token context, source citation references, and high-priority retrieval.
*   **⚙️ Advanced RAG Configurations**: Custom settings console in `/dashboard/settings` to control:
    *   Active Gemini LLM models (`gemini-1.5-flash` or `gemini-1.5-pro`).
    *   Temperature, output tokens, chunk sizes, and chunk overlaps.
    *   Ingestion parsing engines (Standard, Layout-Aware, or Tables).
    *   Ignored keywords filter and custom document cache expiration policies.
*   **🎨 Premium Aesthetics**: Modern landing page with interactive gravity stars animations, glassmorphic card groups, and custom micro-interactions.
*   **🔒 Session-Guard Authentication**: Local session checks that lock paid features (like Analytics and Team dashboards) and redirect guest users.

---

## 🛠️ Getting Started

### 1. Installation

Clone the repository and install the dependencies:
```bash
git clone <your-repo-url>
cd DocSense
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:
```bash
cp .env.example .env
```
Fill in the credentials:
```env
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name

# Stripe Keys
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 3. Launch Locally

Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Architecture

*   `src/app/api/documents/route.ts`: Upload, list, and delete PDF files, updating the local registry and Pinecone index.
*   `src/app/api/documents/import-url/route.ts`: Ingest and parse PDFs from public links or Google Drive preview links.
*   `src/app/api/chat/route.ts`: Query vector database and stream responses from Gemini.
*   `src/app/api/stripe/checkout/route.ts`: Backend handler generating Stripe checkout session links.
*   `src/app/dashboard/settings/page.tsx`: Advanced AI inference and document parsing parameters.
*   `src/app/dashboard/page.tsx`: Dynamic library grid containing files count, search indices, and plan status banners.

---

## ☕ Developer's Confession (From the Engine Room)

*   **The 107-Character Stripe Key Saga**: Special thanks to Stripe for test keys that look like randomized CAPTCHAs. If your test payments are failing, verify if your `0` is a zero, your `O` is a capital letter, and your `Q` isn't masquerading as an `O`. We've been there.
*   **Lenis Scroll vs. Settings Layout**: More time was spent wrestling a Lenis smooth-scrolling conflict than it took to implement the entire vector database embedding pipeline. CSS `overflow: hidden`: keeping developers humble since 1996.
*   **The AI Greetings Engine**: If you register with an email like `DoctorSensei99@docs.com`, our Gemini greeting endpoint will enthusiastically welcome you as `Hello, Doctorsensei99!`. You are officially a doctor in our database.
*   **The OCR "Coming Soon" Button**: Yes, it has a purple badge. Yes, the toggle is deactivated. No, clicking it 50 times in a row will not write the OCR image parsing logic by itself.

Made with 🖤, too many cups of tea, and 14,000 hot-reloads of `localhost:3000`.
