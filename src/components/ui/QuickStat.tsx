import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Removido: import no usado

interface QuickStatProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  change?: string;
  changeType?: 'positive' | 'negative';
}

export default function QuickStat({ title, value, icon: Icon, color = 'bg-gold7 text-gold3', change, changeType }: QuickStatProps) {
  return (
    <Card className="border-green5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-green font-title">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green font-title">{value}</div>
        {change && (
          <p className={`text-xs font-body ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
} 