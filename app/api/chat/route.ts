import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = streamText({
        model: google('gemini-1.5-pro-latest'),
        system: "You are an expert technical writer for the brand 'ENTITIES'. Write a full, structured blog post in Markdown based on the user's prompt. Use H2 headers, bullet points, and bold text for emphasis.",
        messages,
    });

    return result.toDataStreamResponse();
}
