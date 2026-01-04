// app/api/blog/generate/route.ts
import { NextRequest } from "next/server";
import {generateText,Output  } from "ai";
import { google } from "@ai-sdk/google";
export const maxDuration = 30;

import { z } from "zod";
import {BlogPostSchema} from "@/types/blog"

export const runtime = "edge";

const InputSchema = z.object({
  topic: z.string().min(3),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = InputSchema.safeParse(json);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid body", details: parsed.error.format() }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const { topic } = parsed.data;

  const result = await generateText({
    model: google("gemini-1.5-pro"),
    output: Output.object({
    schema:BlogPostSchema}),
    prompt: `
Generate a blog post object for the topic: "${topic}".

Rules:
- "title": engaging, under 80 characters.
- "slug": url-safe, lowercase, words separated by dashes.
- "content": markdown-friendly long form article (800–1200 words).
- "excerpt": 1–3 sentence summary of the article.
Return ONLY the JSON fields that match the schema.
    `,
  });


  return new Response(JSON.stringify(result.output), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
