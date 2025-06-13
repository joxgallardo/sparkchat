import { MessageSquareText } from 'lucide-react';
import type React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-card p-4 shadow-md">
      <div className="container mx-auto flex items-center gap-2">
        <MessageSquareText className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-headline font-semibold text-primary">SparkChat</h1>
      </div>
    </header>
  );
};

export default Header;
