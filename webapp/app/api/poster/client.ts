/**
 * API Client for poster generation service
 */

import { POSTER_API_URL } from '@/GLOVAR';



export interface RunPayload {
  positive_prompt: string;
  slogan: string;
}

export interface RunResponse {
  status: string;
  message?: string;
  image_url?: string;
  [key: string]: any;
}

/**
 * Test the /run endpoint
 */
export async function testRun(): Promise<RunResponse> {
  console.log('Testing POST /run');
  
  const payload: RunPayload = {
    positive_prompt: 'Circle Internet Group, stable coin, fintech, blockchain, cryptocurrency',
    slogan: 'Test slogan for CRCL IPO'
  };

  try {
    const response = await fetch(`${POSTER_API_URL}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    console.log(`Status Code: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data, null, 2)}\n`);

    return data;
  } catch (error) {
    console.error('Error calling /run endpoint:', error);
    throw error;
  }
}
// testRun(); // Commented out - call manually when needed

/**
 * Call the poster generation API via Next.js API route
 */
export async function generatePoster(
  positivePrompt: string,
  slogan: string
): Promise<RunResponse> {
  const payload: RunPayload = {
    positive_prompt: positivePrompt,
    slogan: slogan
  };

  // Use Next.js API route to avoid CORS issues
  const response = await fetch(`/api/poster`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Health check endpoint
 */
export async function healthCheck(): Promise<any> {
  const response = await fetch(`${POSTER_API_URL}/health`);
  return await response.json();
}

/**
 * Get the current poster path from global data
 */
export async function getPosterPath(): Promise<string> {
  const response = await fetch('/api/poster/path');
  const data = await response.json();
  return data.path;
}

/**
 * Set the poster path in global data
 */
export async function setPosterPath(path: string): Promise<void> {
  await fetch('/api/poster/path', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path }),
  });
}

/**
 * Get image URL for a given path (to be used in img src)
 */
export function getImageUrl(path: string): string {
  return `/api/poster/image?path=${encodeURIComponent(path)}`;
}
