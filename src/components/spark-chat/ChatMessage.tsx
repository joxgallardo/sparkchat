import type React from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface Message {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: Date;
  interpretation?: {
    intent: string;
    amount?: number;
    currency?: string;
  };
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  if (isSystem) {
    return (
      <div className="my-2 text-center">
        <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-end gap-2 my-2 animate-in fade-in-20 slide-in-from-bottom-4 duration-300',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-accent text-accent-foreground">
            <Bot size={20} />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[70%] p-3 rounded-xl shadow',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-card text-card-foreground rounded-bl-none'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        {message.interpretation && (
          <div className="mt-1 pt-1 border-t border-opacity-50 border-current text-xs opacity-80">
            <p>Intent: {message.interpretation.intent}</p>
            {message.interpretation.amount && <p>Amount: {message.interpretation.amount}</p>}
            {message.interpretation.currency && <p>Currency: {message.interpretation.currency}</p>}
          </div>
        )}
        <p className="text-xs opacity-70 mt-1 text-right">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {isUser && (
        <Avatar className="h-8 w-8">
           <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User size={20} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
