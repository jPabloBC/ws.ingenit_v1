import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Removido: import no usado

interface WelcomeCardProps {
  userName?: string;
  storeType?: string;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
  onClick?: () => void;
}

export default function WelcomeCard({ 
  userName, 
  storeType, 
  title, 
  description, 
  icon: Icon, 
  color = 'blue', 
  onClick 
}: WelcomeCardProps) {
  const colorClasses = {
    blue: 'text-gold3 bg-gold7',
    green: 'text-green bg-green6',
    red: 'text-red-600 bg-red-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100'
  };

  // Si se proporcionan userName y storeType, mostrar la tarjeta de bienvenida
  if (userName && storeType) {
    return (
      <Card className="border-green5 bg-green6">
        <CardHeader>
          <CardTitle className="text-green font-title">
            ¡Bienvenido, {userName}!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray2 font-body">
            Estás gestionando tu {storeType}. Aquí tienes un resumen de tu negocio.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Tarjeta de acción rápida (comportamiento original)
  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-shadow border-green5 ${onClick ? 'hover:scale-105' : ''}`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center space-x-2">
          {Icon && (
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          )}
          <CardTitle className="text-lg text-green font-title">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray2 font-body">{description}</p>
      </CardContent>
    </Card>
  );
} 