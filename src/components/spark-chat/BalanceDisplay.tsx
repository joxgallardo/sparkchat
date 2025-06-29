
import type React from 'react';
import { Bitcoin, DollarSign, Wallet, Loader2, UserCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface BalanceDisplayProps {
  btcBalance?: number;
  usdBalance?: number;
  isLoading?: boolean;
  userId?: string; // Added to display which user's balance this is
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ btcBalance, usdBalance, isLoading, userId }) => {
  return (
    <Card className="bg-background border-border shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-headline flex items-center gap-2 text-primary">
          <Wallet size={24} />
          Your Balances
          {isLoading && <Loader2 size={20} className="animate-spin text-muted-foreground" />}
        </CardTitle>
        {userId && (
          <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground">
            <UserCircle size={14} /> User: {userId}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-2 pt-2">
        <div className="flex items-center justify-between p-3 bg-card rounded-md">
          <div className="flex items-center gap-2">
            <Bitcoin size={20} className="text-orange-400" />
            <span className="text-foreground">Bitcoin (BTC)</span>
          </div>
          {isLoading || btcBalance === undefined ? (
            <Skeleton className="h-6 w-28" />
          ) : (
            <span className="font-semibold text-lg text-foreground">{btcBalance.toFixed(8)}</span>
          )}
        </div>
        <div className="flex items-center justify-between p-3 bg-card rounded-md">
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-green-400" />
            <span className="text-foreground">US Dollar (USD)</span>
          </div>
          {isLoading || usdBalance === undefined ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            <span className="font-semibold text-lg text-foreground">${usdBalance.toFixed(2)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceDisplay;
