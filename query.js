import * as dotenv from "dotenv";
dotenv.config();
import readlineSync from 'readline-sync'
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- 1. Global Initialization (Efficient: Only happens once) ---

// Gemini LLM
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-latest",
    systemInstruction: "You are a Data Structure and Algorithm Expert. Answer questions based ONLY on the provided context. If the answer is not in the context, say 'I could not find the answer in the provided document.' Keep answers concise and educational."
});

// Gemini Embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({ 
    apiKey: process.env.GEMINI_API_KEY,
    modelName: "gemini-embedding-001"
});

// Pinecone
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

const History = [];

async function chatting(userProblem) {
    try {
        // 1. Convert question to vector
        const rawVector = await embeddings.embedQuery(userProblem);
        const queryVector = rawVector.slice(0, 768);

        // 2. Query Pinecone
        const queryResult = await pineconeIndex.query({
            topK: 5,
            vector: queryVector,
            includeMetadata: true
        });

        // 3. Prepare Context
        const context = queryResult.matches.map(match => match.metadata.text).join("\n\n---\n\n");

        // 4. Generate Answer with Gemini (with Retry for 503/429)
        History.push({
            role: 'user',
            parts: [{ text: `Context: ${context}\n\nQuestion: ${userProblem}` }]
        });

        let result;
        let retries = 3;
        while (retries > 0) {
            try {
                result = await model.generateContent({ contents: History });
                break; 
            } catch (e) {
                if (retries > 1 && (e.message.includes('503') || e.message.includes('429'))) {
                    process.stdout.write("...Server busy, retrying... ");
                    await new Promise(r => setTimeout(r, 2000));
                    retries--;
                } else {
                    throw e;
                }
            }
        }

        const responseText = result.response.text();
        
        History.push({
            role: 'model',
            parts: [{ text: responseText }]
        });

        console.log("\n[DocSense]:", responseText, "\n");

    } catch (error) {
        console.error("Error in chat:", error.message);
    }
}

async function main() {
    const userProblem = readlineSync.question("Ask me anything ---> ");
    if (userProblem.toLowerCase() === 'exit') return;
    await chatting(userProblem);
    main();
}

main();
