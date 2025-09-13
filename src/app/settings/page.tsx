'use client';
import { useState } from 'react';
import { Settings, Building, FileText, CreditCard, User, Bell, Shield, Database, Globe, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
// Removido: import no usado
import Button from '@/components/ui/Button';
import SecurityGuard from '@/components/SecurityGuard';
// Removido: import no usado
interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
}

const settingsSections: SettingsSection[] = [
  {
    id: 'company',
    title: 'Datos de la Empresa',
    description: 'Configura la información básica de tu empresa',
    icon: Building,
    path: '/settings/company',
    color: 'bg-blue-500'
  },
  {
    id: 'sii',
    title: 'Configuración SII',
    description: 'Configuración para emisión de boletas electrónicas',
    icon: FileText,
    path: '/settings/sii',
    color: 'bg-green-500'
  },
  {
    id: 'transbank',
    title: 'Configuración Transbank',
    description: 'Credenciales para procesamiento de pagos',
    icon: CreditCard,
    path: '/settings/transbank',
    color: 'bg-purple-500'
  },
  {
    id: 'profile',
    title: 'Perfil de Usuario',
    description: 'Información personal y preferencias',
    icon: User,
    path: '/settings/profile',
    color: 'bg-orange-500'
  },
  {
    id: 'notifications',
    title: 'Notificaciones',
    description: 'Configuración de alertas y notificaciones',
    icon: Bell,
    path: '/settings/notifications',
    color: 'bg-red-500'
  },
  {
    id: 'security',
    title: 'Seguridad',
    description: 'Contraseñas y autenticación',
    icon: Shield,
    path: '/settings/security',
    color: 'bg-gray-500'
  },
  {
    id: 'database',
    title: 'Base de Datos',
    description: 'Configuración y respaldos',
    icon: Database,
    path: '/settings/database',
    color: 'bg-indigo-500'
  },
  {
    id: 'regional',
    title: 'Configuración Regional',
    description: 'Idioma, moneda y zona horaria',
    icon: Globe,
    path: '/settings/regional',
    color: 'bg-teal-500'
  },
  {
    id: 'appearance',
    title: 'Apariencia',
    description: 'Tema y personalización visual',
    icon: Palette,
    path: '/settings/appearance',
    color: 'bg-pink-500'
  }
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleSectionClick = (section: SettingsSection) => {
    setActiveSection(section.id);
    // Navegar a la sección específica
    window.location.href = section.path;
  };

  return (
    <SecurityGuard>
        <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600">Gestiona todas las configuraciones de tu sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsSections.map((section) => (
            <Card 
              key={section.id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => handleSectionClick(section)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${section.color}`}>
                    <section.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {section.description}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  Configurar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sección de Configuración Rápida */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Configuración Rápida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Estado del Sistema</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>SII:</span>
                      <span className="text-green-600">✓ Configurado</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transbank:</span>
                      <span className="text-yellow-600">⚠ Pendiente</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base de Datos:</span>
                      <span className="text-green-600">✓ Activa</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Estadísticas</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Ventas Hoy:</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Productos:</span>
                      <span className="font-medium">156</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clientes:</span>
                      <span className="font-medium">89</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Acciones Rápidas</h4>
                  <div className="space-y-2">
                    <Button size="sm" variant="outline" className="w-full">
                      Respaldar Datos
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      Ver Logs
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      Actualizar Sistema
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  
      </SecurityGuard>);
}
