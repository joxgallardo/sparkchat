import type React from 'react';
import { useEffect, useRef } from 'react';
import ChatMessage, { type Message } from './ChatMessage';
import ChatInput from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (messageText: string) => void;
  isProcessing: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isProcessing }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Card className="flex flex-col h-full shadow-xl border-border bg-background">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div ref={viewportRef} className="h-full">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </div>
      </ScrollArea>
      <ChatInput onSendMessage={onSendMessage} isProcessing={isProcessing} />
    </Card>
  );
};

export default ChatWindow;
