import type React from 'react';
import { History, ArrowDownCircle, ArrowUpCircle, Repeat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'convert_to_usd' | 'convert_to_btc';
  amount: number;
  currency: 'BTC' | 'USD';
  convertedAmount?: number;
  convertedCurrency?: 'BTC' | 'USD';
  timestamp: Date;
  description: string;
}

interface TransactionHistoryCardProps {
  transactions: Transaction[];
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

const TransactionHistoryCard: React.FC<TransactionHistoryCardProps> = ({ transactions }) => {
  return (
    <Card className="bg-background border-border shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-headline flex items-center gap-2 text-primary">
          <History size={24} />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-3">
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No transactions yet.</p>
          ) : (
            <ul className="space-y-3">
              {transactions.slice().reverse().map((tx) => (
                <li key={tx.id} className="flex items-start gap-3 p-3 bg-card rounded-md">
                  <TransactionIcon type={tx.type} />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.timestamp.toLocaleDateString()} {tx.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-semibold text-sm",
                        tx.type === 'deposit' || (tx.type === 'convert_to_btc' && tx.currency === 'BTC') || (tx.type === 'convert_to_usd' && tx.currency === 'USD') ? 'text-green-400' : 
                        tx.type === 'withdraw' || (tx.type === 'convert_to_btc' && tx.currency === 'USD') || (tx.type === 'convert_to_usd' && tx.currency === 'BTC') ? 'text-red-400' : 'text-foreground'
                      )}>
                      {tx.type === 'deposit' ? '+' : tx.type === 'withdraw' ? '-' : ''}
                      {tx.amount.toFixed(tx.currency === 'BTC' ? 8 : 2)} {tx.currency}
                    </p>
                    {tx.convertedAmount && tx.convertedCurrency && (
                       <p className={cn("text-xs", tx.convertedCurrency === 'USD' ? 'text-green-400' : 'text-orange-400')}>
                         &rarr; {tx.convertedAmount.toFixed(tx.convertedCurrency === 'BTC' ? 8 : 2)} {tx.convertedCurrency}
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
