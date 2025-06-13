// src/ai/flows/understand-command.ts
'use server';
/**
 * @fileOverview A flow that uses natural language processing to understand user commands related to Bitcoin savings and spending.
 *
 * - understandCommand - A function that handles the command understanding process.
 * - UnderstandCommandInput - The input type for the understandCommand function.
 * - UnderstandCommandOutput - The return type for the understandCommand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return understandCommandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'understandCommandPrompt',
  input: {schema: UnderstandCommandInputSchema},
  output: {schema: UnderstandCommandOutputSchema},
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
    const {output} = await prompt(input);
    return output!;
  }
);
