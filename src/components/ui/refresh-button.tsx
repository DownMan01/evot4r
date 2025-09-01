import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  text?: string;
  mobileText?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'outline' | 'default' | 'ghost' | 'secondary';
}
export const RefreshButton = ({
  onClick,
  loading = false,
  disabled = false,
  text = 'Refresh Data',
  mobileText = 'Refresh',
  className,
  size = 'sm',
  variant = 'outline'
}: RefreshButtonProps) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn("flex items-center gap-2", className)}
    >
      <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
      <span className="hidden sm:inline">{text}</span>
      <span className="sm:hidden">{mobileText}</span>
    </Button>
  );
};