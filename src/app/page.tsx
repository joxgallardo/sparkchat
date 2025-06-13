"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
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

const BITCOIN_TO_USD_RATE = 50000; // Example static rate

export default function SparkChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [btcBalance, setBtcBalance] = useState(0.05); // Initial BTC balance
  const [usdBalance, setUsdBalance] = useState(1000); // Initial USD balance
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsAdvice, setSavingsAdvice] = useState<SavingsAssistantOutput | null>(null);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [isAssistantProcessing, setIsAssistantProcessing] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    // Initial welcome message
    addMessageToChat({
      id: crypto.randomUUID(),
      sender: 'bot',
      text: "Welcome to SparkChat! I can help you manage your Bitcoin savings. Try commands like 'deposit 0.01 BTC', 'convert 100 USD to BTC', 'withdraw 50 USD', or 'check balance'.",
      timestamp: new Date(),
    });
  }, []);

  const addMessageToChat = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setTransactions((prev) => [...prev, newTransaction]);
  };

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
      processCommand(interpretation);
    } catch (error) {
      console.error("Error understanding command:", error);
      addMessageToChat({
        id: crypto.randomUUID(),
        sender: 'bot',
        text: "Sorry, I had trouble understanding that. Please try again.",
        timestamp: new Date(),
      });
      toast({
        title: "Error",
        description: "Could not process your command.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingCommand(false);
    }
  };

  const processCommand = (command: UnderstandCommandOutput) => {
    const amount = command.amount || 0;
    const currency = command.currency?.toUpperCase();

    let responseText = "";
    let transactionDetails: Omit<Transaction, 'id' | 'timestamp'> | null = null;

    switch (command.intent) {
      case 'deposit':
        if (currency === 'BTC' && amount > 0) {
          setBtcBalance((prev) => prev + amount);
          responseText = `Successfully deposited ${amount} BTC.`;
          transactionDetails = { type: 'deposit', amount, currency: 'BTC', description: `Deposited ${amount} BTC` };
          toast({ title: "Deposit Successful", description: responseText });
        } else if (currency === 'USD' && amount > 0) {
           // Assuming direct USD deposit capability, or conversion first
          setUsdBalance((prev) => prev + amount);
          responseText = `Successfully deposited ${amount} USD.`;
          transactionDetails = { type: 'deposit', amount, currency: 'USD', description: `Deposited ${amount} USD` };
          toast({ title: "Deposit Successful", description: responseText });
        } else {
          responseText = "Invalid deposit command. Please specify a valid amount and currency (BTC or USD). E.g., 'deposit 0.1 BTC'.";
        }
        break;

      case 'withdraw':
        if (currency === 'USD' && amount > 0) {
          if (usdBalance >= amount) {
            setUsdBalance((prev) => prev - amount);
            responseText = `Successfully withdrew ${amount} USD.`;
            transactionDetails = { type: 'withdraw', amount, currency: 'USD', description: `Withdrew ${amount} USD` };
            toast({ title: "Withdrawal Successful", description: responseText });
          } else {
            responseText = "Insufficient USD balance for this withdrawal.";
          }
        } else if (currency === 'BTC' && amount > 0) {
            // This typically would involve converting BTC to USD first, then withdrawing USD.
            // For simplicity, let's allow direct BTC withdrawal if intent is clear, or guide user to convert.
            const usdEquivalent = amount * BITCOIN_TO_USD_RATE;
            responseText = `To withdraw BTC, please first convert it to USD. You can withdraw ${amount} BTC (approx. ${usdEquivalent.toFixed(2)} USD). Or specify withdrawal in USD.`;
        }
        else {
          responseText = "Invalid withdrawal command. Please specify amount in USD. E.g., 'withdraw 100 USD'.";
        }
        break;

      case 'convert_to_usd': // e.g. "convert 0.01 BTC to USD"
        if (currency === 'BTC' && amount > 0) {
          if (btcBalance >= amount) {
            const convertedUsd = amount * BITCOIN_TO_USD_RATE;
            setBtcBalance((prev) => prev - amount);
            setUsdBalance((prev) => prev + convertedUsd);
            responseText = `Converted ${amount} BTC to ${convertedUsd.toFixed(2)} USD.`;
            transactionDetails = { type: 'convert_to_usd', amount, currency: 'BTC', convertedAmount: convertedUsd, convertedCurrency: 'USD', description: `Converted ${amount} BTC to USD` };
            toast({ title: "Conversion Successful", description: responseText });
          } else {
            responseText = "Insufficient BTC balance for conversion.";
          }
        } else {
          responseText = "Invalid conversion. Try 'convert 0.01 BTC to USD'.";
        }
        break;
      
      case 'convert_to_btc': // e.g. "convert 100 USD to BTC"
        if (currency === 'USD' && amount > 0) {
          if (usdBalance >= amount) {
            const convertedBtc = amount / BITCOIN_TO_USD_RATE;
            setUsdBalance((prev) => prev - amount);
            setBtcBalance((prev) => prev + convertedBtc);
            responseText = `Converted ${amount} USD to ${convertedBtc.toFixed(8)} BTC.`;
            transactionDetails = { type: 'convert_to_btc', amount, currency: 'USD', convertedAmount: convertedBtc, convertedCurrency: 'BTC', description: `Converted ${amount} USD to BTC` };
            toast({ title: "Conversion Successful", description: responseText });
          } else {
            responseText = "Insufficient USD balance for conversion.";
          }
        } else {
          responseText = "Invalid conversion. Try 'convert 100 USD to BTC'.";
        }
        break;

      case 'check_balance':
        responseText = `Your current balances are:\nBTC: ${btcBalance.toFixed(8)}\nUSD: ${usdBalance.toFixed(2)}`;
        break;

      default:
        responseText = "Sorry, I couldn't understand that command. You can try 'deposit', 'withdraw', 'convert', or 'check balance'.";
        break;
    }

    addMessageToChat({
      id: crypto.randomUUID(),
      sender: 'bot',
      text: responseText,
      timestamp: new Date(),
    });

    if (transactionDetails) {
      addTransaction(transactionDetails);
    }
  };

  const handleGetSavingsAdvice = async (savingsPatterns: string, financialGoals: string) => {
    setIsAssistantProcessing(true);
    setSavingsAdvice(null);
    try {
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
      addMessageToChat({
        id: crypto.randomUUID(),
        sender: 'bot',
        text: "Sorry, I couldn't get savings advice right now.",
        timestamp: new Date(),
      });
      toast({
        title: "Error",
        description: "Could not fetch savings advice.",
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
        <div className="flex-1 flex flex-col min-h-0 md:w-2/3"> {/* Ensure ChatWindow can shrink and grow */}
          <ChatWindow messages={messages} onSendMessage={handleSendMessage} isProcessing={isProcessingCommand} />
        </div>
        <div className="md:w-1/3 flex flex-col gap-3 md:gap-4 overflow-y-auto p-1 rounded-lg bg-card/50 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <BalanceDisplay btcBalance={btcBalance} usdBalance={usdBalance} />
          <Separator className="bg-border" />
          <TransactionHistoryCard transactions={transactions} />
          <Separator className="bg-border"/>
          <SavingsAssistantCard onGetAdvice={handleGetSavingsAdvice} advice={savingsAdvice} isAssistantProcessing={isAssistantProcessing} />
        </div>
      </main>
    </div>
  );
}
