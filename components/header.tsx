import { Button } from "@/components/ui/button";
import { RotateCcw, Sun, Moon } from "lucide-react";
import Image from 'next/image';
import { useTheme } from "next-themes";

interface HeaderProps {
  onReset: () => void;
}

export function Header({ onReset }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex justify-between items-center mb-8 relative p-4 rounded-lg bg-gradient-to-r from-primary/10 via-transparent to-primary/10 overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_25%,rgba(68,68,68,.2)_50%,transparent_50%,transparent_75%,rgba(68,68,68,.2)_75%)] bg-[length:10px_10px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
      </div>
      
      <Button
        variant="outline"
        size="icon"
        onClick={onReset}
        className="h-10 w-10 rounded-full relative z-10"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2 relative z-10">
        <div className="relative w-40 h-16">
          <Image
            src="/logo-light.png"
            alt="حاسبة الأجرة"
            fill
            className="object-contain dark:hidden [&>*]:!whitespace-nowrap"
            priority
          />
          <Image
            src="/logo-dark.png"
            alt="حاسبة الأجرة"
            fill
            className="object-contain hidden dark:block [&>*]:!whitespace-nowrap"
            priority
          />
        </div>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="h-10 w-10 rounded-full relative z-10"
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>
    </div>
  );
} 