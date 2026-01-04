// components/admin/StatsCard.tsx
import Card from '@/components/ui/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'purple' | 'orange' | 'blue' | 'green' | 'red';
}

export default function StatsCard({ title, value, subtitle, icon, trend, color = 'purple' }: StatsCardProps) {
  const colors = {
    purple: 'from-purple-500 to-brand-purple',
    orange: 'from-orange-500 to-brand-orange',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <Card className={`bg-gradient-to-br ${colors[color]} text-white border-none shadow-xl`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm opacity-90 mb-1">{title}</p>
          <p className="text-4xl font-bold mb-2">{value}</p>
          {subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-semibold ${trend.isPositive ? 'text-green-200' : 'text-red-200'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="text-5xl opacity-80">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
