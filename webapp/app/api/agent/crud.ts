import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings} from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { pull } from "langchain/hub";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { DynamicTool } from 'langchain/tools';
import { createReactAgent, AgentExecutor } from 'langchain/agents';
// "../../../../vecdb/chromadb"

function getModel() {
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    temperature: 0
  });
}


export async function llmBot(input: string, context: string): Promise<string> {
  const model = getModel();


  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful brokerage assistant; Based on the retrieved information: {context}, respond appropriately."],
    ["user", "Tell me about {topic}"],
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  const invoke = await chain.invoke({ topic: input, context: context });



  return invoke;
}



const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004",
  taskType: TaskType.RETRIEVAL_DOCUMENT,
  title: "Document Baisc",
});

// Sample documents with multiple contexts
// const docs = [
//   { pageContent: "Apple Inc. (AAPL) has a market cap of $2.5 trillion", metadata: { author: "Alice" } },
//   { pageContent: "Tesla Inc. (TSLA) has a market cap of $800 billion", metadata: { author: "Bob" } },
//   { pageContent: "Amazon.com Inc. (AMZN) has a market cap of $1.7 trillion", metadata: { author: "Charlie" } },
// ];

// let vectorstore: MemoryVectorStore;

// async function initializeVectorStore() {
//   vectorstore = await MemoryVectorStore.fromDocuments(docs, embeddings);
// }



export async function ragBot(input: string): Promise<string> {
  // const retriever = vectorstore.asRetriever(1);
  // const retrievedDocuments = await retriever.invoke(input);

  // const retrive = retrievedDocuments[0]?.pageContent || "No relevant information found.";

  // start server on /vecdb/server.py first
  const retrive = await fetch('http://localhost:8181/retrive?question=' + encodeURIComponent(input));
  const result = await llmBot(input, await retrive.text());
  console.log(result);

  return result;
}

// Commented out to prevent execution during build
// ragBot("How many stationary does Ken have? ");




const tools = [
 new DynamicTool({
    name: "Stock",
    description: "Buy or Sell stock symbol with amount and price. output example: {\"todo\":\"BUY\", \"symbol\":\"APPL\", \"amount\":\"200\", \"price\":\"100\"}",
    func: async (input: string) => {
      const { todo, symbol, amount, price} = JSON.parse(input);
      return `${todo} ${amount} ${symbol} at ${price}.`;
    },
 })
];

async function agentBot() {
  const systemMessage = `
Answer the following questions as best you can. You have access to the following tools: {tools}.
You are a helpful brokerage assistant; Based on the retrieved information, respond appropriately.
Action: the action to take, should be one of [{tool_names}]
Final Anwser :return parsable JSON . 
example: 
{{
  "input": "value",
  "output": "value",
  "response": "value"
}} 
the output value do not have  and \`\`\`json
the output value inside quote must start with open parenthese end with close parenthese 
Avoid error : OutputParserException [Error]: Could not parse LLM output
`;
// Observation: action result
// ... (repeat Thought/Action/Observation N times)
// Thought: I know what to respond
  const model = getModel();
  // const prompt = await pull<PromptTemplate>("jet-taekyo-lee/time-aware-react-multi-input-json");
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemMessage],
    ["user", "{input}"],
    ["human", "Thought: {agent_scratchpad}"]
]);

  const agent = await createReactAgent({ llm: model, tools, prompt: prompt, });
  

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose:true
  });

  const result = await agentExecutor.invoke({
    input: "Buy 2123 NVDA 30$",
  })

  const out = await llmBot(result.output,"extract the value in response in output with plain string");

  
  return out
}

// runAgent();