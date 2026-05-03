import { tavily } from '@tavily/core';

const apiKey = process.env.TAVILY_API_KEY;

if (!apiKey) {
  console.warn('[tavily] TAVILY_API_KEY is not set — search will fail');
}

export const tavilyClient = tavily({ apiKey: apiKey ?? 'missing' });
