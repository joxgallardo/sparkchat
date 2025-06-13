import type React from 'react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isProcessing }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isProcessing) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 border-t border-border bg-card">
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type your command..."
        className="flex-1 bg-input text-foreground placeholder-muted-foreground focus:ring-primary"
        disabled={isProcessing}
        aria-label="Chat input"
      />
      <Button type="submit" size="icon" disabled={isProcessing || !inputValue.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
        {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
};

export default ChatInput;
