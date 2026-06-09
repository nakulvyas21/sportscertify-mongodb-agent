import { VoyageAIClient } from "voyageai";
import { getConfig } from "../config/env.js";

let cachedClient: VoyageAIClient | null = null;

function getClient(): VoyageAIClient {
  const env = getConfig();
  if (!env.VOYAGE_API_KEY) {
    throw new Error(
      "VOYAGE_API_KEY is not set. Add it to .env to generate embeddings."
    );
  }
  if (!cachedClient) {
    cachedClient = new VoyageAIClient({ apiKey: env.VOYAGE_API_KEY });
  }
  return cachedClient;
}

export function voyageConfigured(): boolean {
  return Boolean(getConfig().VOYAGE_API_KEY);
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const env = getConfig();
  const client = getClient();
  const res = await client.embed({
    input: texts,
    model: env.VOYAGE_MODEL,
    inputType: "document",
    outputDimension: env.VOYAGE_EMBED_DIM,
  });
  return (res.data ?? []).map((d) => d.embedding as number[]);
}

export async function embedQuery(text: string): Promise<number[]> {
  const env = getConfig();
  const client = getClient();
  const res = await client.embed({
    input: [text],
    model: env.VOYAGE_MODEL,
    inputType: "query",
    outputDimension: env.VOYAGE_EMBED_DIM,
  });
  const embedding = res.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error("Voyage returned no embedding for the query.");
  }
  return embedding as number[];
}
