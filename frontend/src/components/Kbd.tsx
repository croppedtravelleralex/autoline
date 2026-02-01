import { cn } from '../lib/utils';

interface KbdProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'outline' | 'ghost';
}

export function Kbd({ children, className, variant = 'default' }: KbdProps) {
    return (
        <kbd
            className={cn(
                "inline-flex items-center justify-center px-1.5 py-0.5 font-mono text-[9px] font-bold rounded shadow-sm transition-all select-none",
                variant === 'default' && "bg-slate-800 text-slate-300 border border-slate-700",
                variant === 'outline' && "bg-transparent text-muted-foreground border border-border",
                variant === 'ghost' && "bg-white/10 text-white/60 border border-white/5",
                className
            )}
        >
            {children}
        </kbd>
    );
}
