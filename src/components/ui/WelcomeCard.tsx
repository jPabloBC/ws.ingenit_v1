import { Card, CardContent, CardHeader, CardTitle } from './card';
import { LucideIcon } from 'lucide-react';

interface WelcomeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
  onClick?: () => void;
}

export default function WelcomeCard({ title, description, icon: Icon, color = 'blue', onClick }: WelcomeCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    red: 'text-red-600 bg-red-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100'
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-shadow ${onClick ? 'hover:scale-105' : ''}`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
} 