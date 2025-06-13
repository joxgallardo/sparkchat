
"use client";

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/spark-chat/Header';
import ChatWindow from '@/components/spark-chat/ChatWindow';
import type { Message } from '@/components/spark-chat/ChatMessage';
import BalanceDisplay from '@/components/spark-chat/BalanceDisplay';
import TransactionHistoryCard, { type Transaction } from '@/components/spark-chat/TransactionHistoryCard';
import SavingsAssistantCard from '@/components/spark-chat/SavingsAssistantCard';
import { Separator } from '@/components/ui/separator';
import { understandCommand, type UnderstandCommandOutput } from '@/ai/flows/understand-command';
import { getSavingsSuggestions, type SavingsAssistantOutput } from '@/ai/flows/savings-assistant';
import { useToast } from "@/hooks/use-toast";
import {
  fetchBalancesAction,
  fetchTransactionsAction,
  depositBTCAction,
  withdrawUSDAction,
  convertBTCToUSDAction,
  convertUSDToBTCAction
} from './actions';

// Simulate a logged-in user. In a real app, this would come from an auth provider.
const CURRENT_USER_ID = 'test-user-123';

export default function SparkChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [btcBalance, setBtcBalance] = useState<number | null>(null);
  const [usdBalance, setUsdBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsAdvice, setSavingsAdvice] = useState<SavingsAssistantOutput | null>(null);
  
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [isAssistantProcessing, setIsAssistantProcessing] = useState(false);

  const { toast } = useToast();

  const addMessageToChat = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const refreshBalancesAndTransactions = useCallback(async () => {
    setIsLoadingBalances(true);
    setIsLoadingTransactions(true);
    try {
      const balances = await fetchBalancesAction(CURRENT_USER_ID);
      setBtcBalance(balances.btc);
      setUsdBalance(balances.usd);
    } catch (error) {
      console.error("Error fetching balances:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not fetch balances.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingBalances(false);
    }

    try {
      const fetchedTransactions = await fetchTransactionsAction(CURRENT_USER_ID);
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not fetch transaction history.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [toast]);

  useEffect(() => {
    addMessageToChat({
      id: crypto.randomUUID(),
      sender: 'bot',
      text: `Welcome to SparkChat! I'm connecting to your account (User: ${CURRENT_USER_ID})... Try commands like 'deposit 0.01 BTC', 'convert 100 USD to BTC', 'withdraw 50 USD', or 'check balance'.`,
      timestamp: new Date(),
    });
    refreshBalancesAndTransactions();
  }, [addMessageToChat, refreshBalancesAndTransactions]);


  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text,
      timestamp: new Date(),
    };
    addMessageToChat(userMessage);
    setIsProcessingCommand(true);

    try {
      const interpretation = await understandCommand({ command: text });
      const botInterpretationMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'bot',
        text: `Understood: ${interpretation.intent}` + (interpretation.amount ? ` Amount: ${interpretation.amount} ${interpretation.currency || ''}` : ''),
        timestamp: new Date(),
        interpretation: interpretation,
      };
      addMessageToChat(botInterpretationMessage);
      await processCommand(interpretation);
    } catch (error) {
      console.error("Error understanding/processing command:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      addMessageToChat({
        id: crypto.randomUUID(),
        sender: 'bot',
        text: `Sorry, I had trouble with that: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      });
      toast({
        title: "Command Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessingCommand(false);
    }
  };

  const processCommand = async (command: UnderstandCommandOutput) => {
    const amount = command.amount || 0;
    const currency = command.currency?.toUpperCase();
    let responseText = "";

    try {
      switch (command.intent) {
        case 'deposit':
          if (currency === 'BTC' && amount > 0) {
            const result = await depositBTCAction(amount, CURRENT_USER_ID);
            setBtcBalance(result.newBtcBalance);
            responseText = `Successfully initiated deposit of ${amount} BTC.`;
            if (result.invoice) {
              responseText += `\nInvoice: ${result.invoice.substring(0,30)}... (Full invoice in service logs for mock)`;
            }
            toast({ title: "Deposit Initiated", description: `BTC Deposit for ${amount} started.` });
          } else if (currency === 'USD' && amount > 0) {
             responseText = "USD deposits are handled by converting to BTC first. Try 'convert X USD to BTC' then 'deposit Y BTC'.";
          } else {
            responseText = "Invalid deposit command. Please specify a valid amount and currency (BTC). E.g., 'deposit 0.1 BTC'.";
          }
          break;

        case 'withdraw':
          if (currency === 'USD' && amount > 0) {
            // In a real scenario, the AI or UI would need to get the targetAddress for withdrawal.
            // For now, using a mock address passed to the action.
            const mockTargetAddress = "placeholder_withdrawal_address_or_details";
            const result = await withdrawUSDAction(amount, mockTargetAddress, CURRENT_USER_ID);
            setUsdBalance(result.newUsdBalance);
            responseText = `Successfully initiated withdrawal of ${amount} USD to ${mockTargetAddress}.`;
            toast({ title: "Withdrawal Initiated", description: responseText });
          } else {
            responseText = "Invalid withdrawal command. Please specify amount in USD. E.g., 'withdraw 100 USD'. BTC withdrawals require conversion to USD first.";
          }
          break;

        case 'convert_to_usd': 
          if (currency === 'BTC' && amount > 0) {
            const result = await convertBTCToUSDAction(amount, CURRENT_USER_ID);
            setBtcBalance(result.newBtcBalance);
            setUsdBalance(result.newUsdBalance);
            responseText = `Converted ${amount} BTC to approx ${result.transaction.convertedAmount?.toFixed(2)} USD.`;
            toast({ title: "Conversion Successful", description: responseText });
          } else {
            responseText = "Invalid conversion. Try 'convert 0.01 BTC to USD'.";
          }
          break;
        
        case 'convert_to_btc': 
          if (currency === 'USD' && amount > 0) {
            const result = await convertUSDToBTCAction(amount, CURRENT_USER_ID);
            setUsdBalance(result.newUsdBalance);
            setBtcBalance(result.newBtcBalance);
            responseText = `Converted ${amount} USD to approx ${result.transaction.convertedAmount?.toFixed(8)} BTC.`;
            toast({ title: "Conversion Successful", description: responseText });
          } else {
            responseText = "Invalid conversion. Try 'convert 100 USD to BTC'.";
          }
          break;

        case 'check_balance':
          await refreshBalancesAndTransactions(); 
          responseText = `Your current balances (refreshed for User: ${CURRENT_USER_ID}):\nBTC: ${btcBalance?.toFixed(8) ?? 'Loading...'}\nUSD: ${usdBalance?.toFixed(2) ?? 'Loading...'}`;
          break;

        default:
          responseText = "Sorry, I couldn't understand that command. You can try 'deposit', 'withdraw', 'convert', or 'check balance'.";
          break;
      }
    } catch (error) {
      console.error("Error processing command:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred with the financial operation.";
      responseText = `Operation failed: ${errorMessage}`;
      toast({ title: "Operation Failed", description: responseText, variant: "destructive" });
    }

    addMessageToChat({
      id: crypto.randomUUID(),
      sender: 'bot',
      text: responseText,
      timestamp: new Date(),
    });

    if (command.intent !== 'check_balance' && command.intent !== 'unknown' && !responseText.startsWith("Operation failed")) {
      await refreshBalancesAndTransactions();
    }
  };

  const handleGetSavingsAdvice = async (savingsPatterns: string, financialGoals: string) => {
    setIsAssistantProcessing(true);
    setSavingsAdvice(null);
    try {
      // Savings assistant is generic and doesn't need userId for now.
      const advice = await getSavingsSuggestions({ savingsPatterns, financialGoals });
      setSavingsAdvice(advice);
      addMessageToChat({
        id: crypto.randomUUID(),
        sender: 'bot',
        text: `Savings Assistant says:\nSuggestions: ${advice.savingsSuggestions}\nAdvice: ${advice.investmentAdvice}`,
        timestamp: new Date(),
      });
      toast({ title: "Savings Advice Generated", description: "Check the savings assistant panel for details." });
    } catch (error) {
      console.error("Error getting savings advice:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not fetch savings advice.";
      addMessageToChat({
        id: crypto.randomUUID(),
        sender: 'bot',
        text: `Sorry, I couldn't get savings advice right now: ${errorMessage}`,
        timestamp: new Date(),
      });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAssistantProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-1 p-3 md:p-4 flex flex-col md:flex-row gap-3 md:gap-4 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 md:w-2/3">
          <ChatWindow messages={messages} onSendMessage={handleSendMessage} isProcessing={isProcessingCommand} />
        </div>
        <div className="md:w-1/3 flex flex-col gap-3 md:gap-4 overflow-y-auto p-1 rounded-lg bg-card/50 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <BalanceDisplay 
            btcBalance={btcBalance === null ? undefined : btcBalance} 
            usdBalance={usdBalance === null ? undefined : usdBalance} 
            isLoading={isLoadingBalances}
            userId={CURRENT_USER_ID}
          />
          <Separator className="bg-border" />
          <TransactionHistoryCard transactions={transactions} isLoading={isLoadingTransactions} />
          <Separator className="bg-border"/>
          <SavingsAssistantCard onGetAdvice={handleGetSavingsAdvice} advice={savingsAdvice} isAssistantProcessing={isAssistantProcessing} />
        </div>
      </main>
    </div>
  );
}
