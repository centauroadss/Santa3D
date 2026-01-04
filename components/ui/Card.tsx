// components/ui/Card.tsx
import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
}

export default function Card({ children, title, subtitle, footer, className, ...props }: CardProps) {
  return (
    <div className={cn('card', className)} {...props}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-xl font-bold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}
      <div>{children}</div>
      {footer && <div className="mt-4 pt-4 border-t border-gray-200">{footer}</div>}
    </div>
  );
}
