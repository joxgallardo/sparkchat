import type React from 'react';
import { useState } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { SavingsAssistantOutput } from '@/ai/flows/savings-assistant';

interface SavingsAssistantCardProps {
  onGetAdvice: (savingsPatterns: string, financialGoals: string) => Promise<void>;
  advice: SavingsAssistantOutput | null;
  isAssistantProcessing: boolean;
}

const SavingsAssistantCard: React.FC<SavingsAssistantCardProps> = ({ onGetAdvice, advice, isAssistantProcessing }) => {
  const [savingsPatterns, setSavingsPatterns] = useState('Regular monthly deposits, occasional larger deposits from bonuses.');
  const [financialGoals, setFinancialGoals] = useState('Long-term growth, save for a down payment in 5 years.');

  const handleSubmit = () => {
    if (savingsPatterns.trim() && financialGoals.trim()) {
      onGetAdvice(savingsPatterns, financialGoals);
    }
  };

  return (
    <Card className="bg-background border-border shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-headline flex items-center gap-2 text-primary">
          <Lightbulb size={24} />
          Savings Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="savingsPatterns" className="text-foreground">Your Savings Patterns</Label>
          <Textarea
            id="savingsPatterns"
            value={savingsPatterns}
            onChange={(e) => setSavingsPatterns(e.target.value)}
            placeholder="Describe your savings habits..."
            className="mt-1 bg-input text-foreground placeholder-muted-foreground focus:ring-primary"
            rows={3}
            disabled={isAssistantProcessing}
          />
        </div>
        <div>
          <Label htmlFor="financialGoals" className="text-foreground">Your Financial Goals</Label>
          <Textarea
            id="financialGoals"
            value={financialGoals}
            onChange={(e) => setFinancialGoals(e.target.value)}
            placeholder="What are you saving for?"
            className="mt-1 bg-input text-foreground placeholder-muted-foreground focus:ring-primary"
            rows={3}
            disabled={isAssistantProcessing}
          />
        </div>
        <Button onClick={handleSubmit} disabled={isAssistantProcessing || !savingsPatterns.trim() || !financialGoals.trim()} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          {isAssistantProcessing ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Lightbulb className="h-5 w-5 mr-2" />
          )}
          Get Savings Advice
        </Button>
        {advice && (
          <div className="mt-4 p-3 bg-card rounded-md space-y-2 animate-in fade-in-20 duration-300">
            <div>
              <h4 className="font-semibold text-sm text-primary">Savings Suggestions:</h4>
              <p className="text-xs text-foreground whitespace-pre-wrap">{advice.savingsSuggestions}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-primary">Investment Advice:</h4>
              <p className="text-xs text-foreground whitespace-pre-wrap">{advice.investmentAdvice}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavingsAssistantCard;
