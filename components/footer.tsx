import { Button } from "@/components/ui/button";
import { Mail, Info } from "lucide-react";

interface FooterProps {
  onInstructionsClick: () => void;
}

export function Footer({ onInstructionsClick }: FooterProps) {
  const handleContactClick = () => {
    window.location.href = "mailto:omarnazihcs@gmail.com";
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
      <div className="container mx-auto flex justify-center gap-4">
        <Button 
          variant="ghost" 
          onClick={handleContactClick}
          className="gap-2"
        >
          <Mail className="h-4 w-4" />
          تواصل مع المطور
        </Button>
        <Button
          variant="ghost"
          onClick={onInstructionsClick}
          className="gap-2"
        >
          <Info className="h-4 w-4" />
          تعليمات الاستخدام
        </Button>
      </div>
    </footer>
  );
} 