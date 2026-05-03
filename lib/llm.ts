import OpenAI from 'openai';

const apiKey = process.env.OPENROUTER_API_KEY;
const baseURL = process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1';

if (!apiKey) {
  console.warn('[llm] OPENROUTER_API_KEY is not set — LLM calls will fail');
}

export const llm = new OpenAI({
  apiKey: apiKey ?? 'missing',
  baseURL,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000',
    'X-Title': 'AI Fact Checker',
  },
});

export const LLM_MODEL = process.env.LLM_MODEL ?? 'anthropic/claude-haiku-4.5';
