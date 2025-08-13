
'use server';

import { generateCardImage as generateCardImageFlow, type GenerateCardImageInput, type GenerateCardImageOutput } from '@/ai/flows/generate-card-image-flow';

export async function generateCardImage(input: GenerateCardImageInput): Promise<GenerateCardImageOutput> {
  return await generateCardImageFlow(input);
}
