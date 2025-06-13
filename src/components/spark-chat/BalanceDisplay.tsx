import type React from 'react';
import { Bitcoin, DollarSign, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BalanceDisplayProps {
  btcBalance: number;
  usdBalance: number;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ btcBalance, usdBalance }) => {
  return (
    <Card className="bg-background border-border shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-headline flex items-center gap-2 text-primary">
          <Wallet size={24} />
          Your Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-card rounded-md">
          <div className="flex items-center gap-2">
            <Bitcoin size={20} className="text-orange-400" />
            <span className="text-foreground">Bitcoin (BTC)</span>
          </div>
          <span className="font-semibold text-lg text-foreground">{btcBalance.toFixed(8)}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-card rounded-md">
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-green-400" />
            <span className="text-foreground">US Dollar (USD)</span>
          </div>
          <span className="font-semibold text-lg text-foreground">${usdBalance.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceDisplay;
