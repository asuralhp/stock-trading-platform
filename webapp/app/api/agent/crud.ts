"use server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// GOOGLE_API_KEY=your-api-key

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0
});

import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export async function callAgent( input: string): Promise<string> {
    const prompt = ChatPromptTemplate.fromTemplate("tell me a joke about {topic}");

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const invoke = await chain.invoke({ topic: input });
    
    return invoke;
}