// savings-assistant.ts
'use server';
/**
 * @fileOverview AI-powered savings assistant for personalized savings suggestions and investment advice via Telegram.
 *
 * - getSavingsSuggestions - A function that provides savings suggestions based on user savings patterns.
 * - SavingsAssistantInput - The input type for the getSavingsSuggestions function.
 * - SavingsAssistantOutput - The return type for the getSavingsSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SavingsAssistantInputSchema = z.object({
  savingsPatterns: z
    .string()
    .describe('A description of the user savings patterns and history.'),
  financialGoals: z.string().describe('The financial goals of the user.'),
});
export type SavingsAssistantInput = z.infer<typeof SavingsAssistantInputSchema>;

const SavingsAssistantOutputSchema = z.object({
  savingsSuggestions: z.string().describe('Personalized savings suggestions for the user.'),
  investmentAdvice: z.string().describe('Investment advice based on the savings patterns and financial goals.'),
});
export type SavingsAssistantOutput = z.infer<typeof SavingsAssistantOutputSchema>;

export async function getSavingsSuggestions(input: SavingsAssistantInput): Promise<SavingsAssistantOutput> {
  return savingsAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'savingsAssistantPrompt',
  input: {schema: SavingsAssistantInputSchema},
  output: {schema: SavingsAssistantOutputSchema},
  prompt: `You are a savings assistant providing personalized savings suggestions and investment advice.

  Based on the user's savings patterns and financial goals, provide savings suggestions and investment advice.

  Savings Patterns: {{{savingsPatterns}}}
  Financial Goals: {{{financialGoals}}}

  Provide savings suggestions and investment advice that are tailored to the user's specific situation.
  Be brief and specific, and provide suggestions that are actionable.
  Ensure that you respond in a way that is appropriate for sending in a Telegram chat.
  `,
});

const savingsAssistantFlow = ai.defineFlow(
  {
    name: 'savingsAssistantFlow',
    inputSchema: SavingsAssistantInputSchema,
    outputSchema: SavingsAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
