export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(req: Request) {
  let username = "";
  let email = "";
  try {
    const { searchParams } = new URL(req.url);
    username = searchParams.get("username") || "";
    email = searchParams.get("email") || "";

    if (!username && !email) {
      return NextResponse.json({ greetingName: "User" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Clean fallback if API key is missing
      const cleanFallback = (username || email.split("@")[0] || "User")
        .split(" ")[0]
        .replace(/[^a-zA-Z0-9]/g, "");
      const capitalized = cleanFallback.charAt(0).toUpperCase() + cleanFallback.slice(1);
      return NextResponse.json({ greetingName: capitalized });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Extract the first name or a friendly, clean first name for a greeting from this username: "${username}" and/or email: "${email}".
Examples:
- "utkarsh1087" -> "Utkarsh"
- "john.doe@company.com" -> "John"
- "admin@docsense.io" -> "Admin"
- "Alice Smith" -> "Alice"

Respond with ONLY the capitalized first name. No formatting, no punctuation, no other words.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Clean up any extra outputs from LLM
    const cleanText = text.replace(/[^a-zA-Z0-9]/g, "");
    const finalName = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);

    return NextResponse.json({ greetingName: finalName || "User" });
  } catch (error) {
    console.error("Failed to generate AI greeting:", error);
    // Simple fallback parsing
    const cleanFallback = (username || email.split("@")[0] || "User")
      .split(" ")[0]
      .replace(/[^a-zA-Z0-9]/g, "");
    const capitalized = cleanFallback.charAt(0).toUpperCase() + cleanFallback.slice(1);
    return NextResponse.json({ greetingName: capitalized });
  }
}
