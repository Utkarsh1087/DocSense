# DocSense 📄🤖

DocSense is a powerful RAG (Retrieval-Augmented Generation) system that allows you to index and search through PDF documents using AI. It leverages LangChain, Google Gemini for embeddings, and Pinecone for vector storage.

## 🚀 Features

- **PDF Parsing**: Automatically extract text from local PDF files.
- **Intelligent Chunking**: Splits large documents into manageable pieces using `RecursiveCharacterTextSplitter`.
- **High-Performance Embeddings**: Uses Google's `text-embedding-004` model for high-quality semantic representations.
- **Vector Search**: Stores and retrieves document segments using Pinecone's serverless vector database.

## 🛠️ Setup

### 1. Prerequisites

- Node.js (v18 or higher)
- A Pinecone account and API key
- A Google AI Studio (Gemini) API key

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Utkarsh1087/DocSense.git
cd DocSense
npm install --legacy-peer-deps
```

### 3. Environment Variables

Create a `.env` file in the root directory and add your credentials:

```env
PINECONE_API_KEY=your_pinecone_key
GEMINI_API_KEY=your_gemini_key
PINECONE_INDEX_NAME=your_index_name
```

## 📂 Usage

To index a document (e.g., `dsa.pdf`), place it in the root directory and run:

```bash
node index.js
```

This will:
1. Load the PDF.
2. Split the text into chunks.
3. Generate embeddings for each chunk.
4. Upload the vectors to Pinecone.

## 🏗️ Tech Stack

- **LangChain**: Framework for LLM applications.
- **Google Generative AI**: Embedding models.
- **Pinecone**: Vector database.
- **Node.js**: Runtime environment.

## 📄 License

This project is licensed under the ISC License.
