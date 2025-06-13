
import type React from 'react';
import { History, ArrowDownCircle, ArrowUpCircle, Repeat, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// This Transaction type should align with what your service layer (and eventually Lightspark SDK) provides.
// It might need adjustments as you implement the actual SDK calls.
export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'convert_to_usd' | 'convert_to_btc' | 'fee' | 'other'; // Added 'fee', 'other'
  amount: number; // Primary amount of the transaction
  currency: 'BTC' | 'USD' | string; // Allow other currency strings if needed
  convertedAmount?: number; // Amount after conversion, if applicable
  convertedCurrency?: 'BTC' | 'USD' | string; // Currency after conversion
  timestamp: Date;
  description: string;
  status?: string; // e.g., 'PENDING', 'COMPLETED', 'FAILED' - from SDK
  feeAmount?: number;
  feeCurrency?: string;
}

interface TransactionHistoryCardProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

const TransactionIcon: React.FC<{ type: Transaction['type'] }> = ({ type }) => {
  switch (type) {
    case 'deposit':
      return <ArrowDownCircle className="h-5 w-5 text-green-500" />;
    case 'withdraw':
      return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
    case 'convert_to_usd':
    case 'convert_to_btc':
      return <Repeat className="h-5 w-5 text-primary" />;
    default:
      return <History className="h-5 w-5 text-muted-foreground" />;
  }
};

const TransactionHistoryCard: React.FC<TransactionHistoryCardProps> = ({ transactions, isLoading }) => {
  return (
    <Card className="bg-background border-border shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-headline flex items-center gap-2 text-primary">
          <History size={24} />
          Transaction History
          {isLoading && <Loader2 size={20} className="animate-spin text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-3">
          {isLoading && transactions.length === 0 ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-card rounded-md">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 && !isLoading ? (
            <p className="text-muted-foreground text-sm text-center py-4">No transactions yet.</p>
          ) : (
            <ul className="space-y-3">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-start gap-3 p-3 bg-card rounded-md">
                  <TransactionIcon type={tx.type} />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleDateString()} {new Date(tx.timestamp).toLocaleTimeString()}
                      {tx.status && <span className="ml-2 capitalize">({tx.status.toLowerCase()})</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-semibold text-sm",
                        tx.type === 'deposit' || (tx.type === 'convert_to_btc' && tx.currency === 'BTC') || (tx.type === 'convert_to_usd' && tx.currency === 'USD' && !tx.convertedAmount) ? 'text-green-400' : 
                        tx.type === 'withdraw' || (tx.type === 'convert_to_btc' && tx.currency === 'USD' && !tx.convertedAmount) || (tx.type === 'convert_to_usd' && tx.currency === 'BTC') ? 'text-red-400' : 'text-foreground'
                      )}>
                      {tx.type === 'deposit' ? '+' : tx.type === 'withdraw' ? '-' : ''}
                      {tx.amount.toFixed(tx.currency === 'BTC' ? 8 : 2)} {tx.currency}
                    </p>
                    {tx.convertedAmount && tx.convertedCurrency && (
                       <p className={cn("text-xs", 
                           (tx.type === 'convert_to_usd' && tx.convertedCurrency === 'USD') || (tx.type === 'convert_to_btc' && tx.convertedCurrency === 'BTC') ? 'text-green-400' : 'text-orange-400'
                         )}>
                         &rarr; {tx.convertedAmount.toFixed(tx.convertedCurrency === 'BTC' ? 8 : 2)} {tx.convertedCurrency}
                       </p>
                    )}
                     {tx.feeAmount && tx.feeCurrency && (
                      <p className="text-xs text-muted-foreground">
                        Fee: {tx.feeAmount.toFixed(tx.feeCurrency === 'BTC' ? 8 : 2)} {tx.feeCurrency}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TransactionHistoryCard;
