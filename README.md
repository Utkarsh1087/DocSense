# DocSense RAG Pipeline

A professional Retrieval-Augmented Generation (RAG) system built with **Node.js**, **LangChain**, **Google Gemini AI**, and **Pinecone**. This system allows you to upload PDFs and have an AI-powered conversation with their content.

## 🚀 Features
- **Smart PDF Indexing**: Uses `RecursiveCharacterTextSplitter` for high-quality context chunks.
- **Gemini 2.0 Integration**: High-speed, high-accuracy embeddings and responses.
- **Vector Search**: Pinecone-powered semantic search for pinpoint retrieval.
- **Robustness**: Built-in metadata flattening, vector slicing, and server-side retry logic.

## 🛠️ Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd RAG1
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX_NAME=your_index_name
   ```

## 📖 Usage

### Step 1: Index your PDF
Place your PDF in the root directory (rename it to `dsa.pdf` or update the path in `index.js`) and run:
```bash
node index.js
```

### Step 2: Ask Questions
Start the chat interface:
```bash
node query.js
```

## 📝 Technologies Used
- **LangChain**: Document processing and splitting.
- **Google Gemini**: Text embeddings and LLM generation.
- **Pinecone**: Cloud-native vector database.
- **Node.js**: Backend runtime.
