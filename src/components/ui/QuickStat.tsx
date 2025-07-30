import { Card, CardContent, CardHeader, CardTitle } from './card';
import { LucideIcon } from 'lucide-react';

interface QuickStatProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
}

export default function QuickStat({ title, value, icon: Icon, color = 'blue', change }: QuickStatProps) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs ${change.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
            {change.type === 'increase' ? '+' : '-'}{change.value}%
          </p>
        )}
      </CardContent>
    </Card>
  );
} 