import * as dotenv from "dotenv";
dotenv.config();

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";

async function indexDocument() {
    try {
        console.log("--- Starting DocSense Indexing ---");

        // 1. Load PDF
        const pdfLoader = new PDFLoader('./dsa.pdf');
        const rawDocs = await pdfLoader.load();
        console.log(`✓ PDF loaded (${rawDocs.length} pages)`);

        // 2. Chunking
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 2000,
            chunkOverlap: 400,
        });
        const allChunks = await textSplitter.splitDocuments(rawDocs);
        const chunkedDocs = allChunks.filter(doc => doc.pageContent.trim().length > 0);
        console.log(`✓ Chunking complete (${chunkedDocs.length} valid chunks)`);

        // 3. Configure Embeddings
        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GEMINI_API_KEY,
            modelName: "gemini-embedding-001",
        });

        // 4. Initialize Pinecone
        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const { host } = await pinecone.describeIndex(process.env.PINECONE_INDEX_NAME);
        console.log(`✓ Connected to Pinecone index: ${process.env.PINECONE_INDEX_NAME}`);

        // 5. Indexing in Batches
        const batchSize = 10;
        console.log(`--- Indexing ${chunkedDocs.length} chunks in batches of ${batchSize} ---`);

        // Helper to flatten nested metadata for Pinecone
        const flattenObject = (obj, prefix = '') => {
            return Object.keys(obj).reduce((acc, k) => {
                const pre = prefix.length ? prefix + '.' : '';
                const value = obj[k];
                
                // Pinecone rejects null/undefined. Only process if we have a valid value.
                if (value === null || value === undefined) return acc;

                if (typeof value === 'object' && !Array.isArray(value)) {
                    Object.assign(acc, flattenObject(value, pre + k));
                } else {
                    acc[pre + k] = value;
                }
                return acc;
            }, {});
        };

        for (let i = 0; i < chunkedDocs.length; i += batchSize) {
            const batch = chunkedDocs.slice(i, i + batchSize);
            
            const embeds = await embeddings.embedDocuments(batch.map(d => d.pageContent));
            
            const vectors = batch.map((doc, index) => {
                const values = embeds[index]?.slice(0, 768) || [];
                if (values.length === 0) return null;

                // Flatten metadata to match tutorial (e.g. loc.pageNumber)
                const metadata = { 
                    ...flattenObject(doc.metadata),
                    text: doc.pageContent 
                };

                return { id: `id-${i + index}`, values, metadata };
            }).filter(v => v !== null);

            if (vectors.length > 0) {
                const response = await fetch(`https://${host}/vectors/upsert`, {
                    method: 'POST',
                    headers: {
                        'Api-Key': process.env.PINECONE_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ vectors })
                });

                if (!response.ok) {
                    const error = await response.json();
                    console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
                } else {
                    console.log(`[${Math.floor(i / batchSize) + 1}/${Math.ceil(chunkedDocs.length / batchSize)}] Batch successfully indexed.`);
                }
            }

            // Rate limiting for Free Tier
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log("\n--- DocSense Indexing Complete! ---");
    } catch (error) {
        console.error("Indexing failed:", error.message);
    }
}

indexDocument();
