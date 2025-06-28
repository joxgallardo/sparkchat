// src/ai/flows/understand-command.ts
'use server';
/**
 * @fileOverview A flow that uses natural language processing to understand user commands related to Bitcoin savings and spending.
 *
 * - understandCommand - A function that handles the command understanding process.
 * - UnderstandCommandInput - The input type for the understandCommand function.
 * - UnderstandCommandOutput - The return type for the understandCommand function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const UnderstandCommandInputSchema = z.object({
  command: z
    .string()
    .describe('The natural language command entered by the user.'),
});
export type UnderstandCommandInput = z.infer<typeof UnderstandCommandInputSchema>;

const UnderstandCommandOutputSchema = z.object({
  intent: z
    .string()
    .describe(
      'The identified intent of the command (e.g., deposit, withdraw, check_balance, convert_to_usd).'
    ),
  amount: z
    .number()
    .optional()
    .describe('The amount specified in the command, if applicable.'),
  currency: z
    .string()
    .optional()
    .describe('The currency specified in the command, if applicable (e.g., BTC, USD).'),
});
export type UnderstandCommandOutput = z.infer<typeof UnderstandCommandOutputSchema>;

export async function understandCommand(input: UnderstandCommandInput): Promise<UnderstandCommandOutput> {
  try {
    return await understandCommandFlow(input);
  } catch (error) {
    // Fallback to simple parsing if AI fails
    console.warn('AI command understanding failed, using fallback:', error);
    return fallbackCommandUnderstanding(input);
  }
}

const prompt = ai.definePrompt({
  name: 'understandCommandPrompt',
  input: { schema: UnderstandCommandInputSchema },
  output: { schema: UnderstandCommandOutputSchema },
  prompt: `You are an AI assistant designed to understand user commands related to Bitcoin savings and spending within a Telegram interface.

  Analyze the following command and extract the intent, amount, and currency (if provided).

  Command: {{{command}}}

  Respond in a JSON format with the following structure:
  {
    "intent": "", // The identified intent of the command (e.g., deposit, withdraw, check_balance, convert_to_usd)
    "amount": , // The amount specified in the command, if applicable
    "currency": "" // The currency specified in the command, if applicable (e.g., BTC, USD)
  }

  If no amount or currency are specified, set those fields to null.
  If you do not understand the command, set the intent to unknown.
  `,
});

const understandCommandFlow = ai.defineFlow(
  {
    name: 'understandCommandFlow',
    inputSchema: UnderstandCommandInputSchema,
    outputSchema: UnderstandCommandOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);

// Fallback function for when AI is not available
function fallbackCommandUnderstanding(input: UnderstandCommandInput): UnderstandCommandOutput {
  const { command } = input;
  const lowerCommand = command.toLowerCase();
  
  // Simple intent detection
  let intent = 'unknown';
  let amount: number | undefined;
  let currency: string | undefined;
  
  // Check for balance-related commands
  if (lowerCommand.includes('balance') || lowerCommand.includes('check') || lowerCommand.includes('how much')) {
    intent = 'check_balance';
  }
  // Check for deposit commands
  else if (lowerCommand.includes('deposit') || lowerCommand.includes('send') || lowerCommand.includes('add')) {
    intent = 'deposit';
  }
  // Check for withdrawal commands
  else if (lowerCommand.includes('withdraw') || lowerCommand.includes('take out') || lowerCommand.includes('remove')) {
    intent = 'withdraw';
  }
  // Check for conversion commands
  else if (lowerCommand.includes('convert') || lowerCommand.includes('exchange') || lowerCommand.includes('usd')) {
    intent = 'convert_to_usd';
  }
  
  // Extract amount and currency using regex
  const amountMatch = command.match(/(\d+(?:\.\d+)?)\s*(btc|usd|dollars?|bitcoin)/i);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1]);
    const currencyMatch = amountMatch[2].toLowerCase();
    if (currencyMatch === 'btc' || currencyMatch === 'bitcoin') {
      currency = 'BTC';
    } else if (currencyMatch === 'usd' || currencyMatch === 'dollars' || currencyMatch === 'dollar') {
      currency = 'USD';
    }
  }
  
  return {
    intent,
    amount,
    currency,
  };
}
