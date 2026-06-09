import { VertexAI, type GenerativeModel } from "@google-cloud/vertexai";

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "your-gcp-project";
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const MODEL = process.env.AI_MODEL || "gemini-2.5-flash";

let cachedModel: GenerativeModel | null = null;

export function getGeminiModel(): GenerativeModel {
  if (!cachedModel) {
    const vertex = new VertexAI({ project: PROJECT, location: LOCATION });
    cachedModel = vertex.getGenerativeModel({ model: MODEL });
  }
  return cachedModel;
}

export async function generateText(prompt: string): Promise<string> {
  const model = getGeminiModel();
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  const text =
    result.response.candidates?.[0]?.content?.parts
      ?.map((p) => ("text" in p ? p.text : ""))
      .join("") ?? "";
  return text;
}

export const geminiConfig = { project: PROJECT, location: LOCATION, model: MODEL } as const;
