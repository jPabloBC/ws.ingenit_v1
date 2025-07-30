'use client';

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, BarChart3, Users, Shield, Zap, Crown } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Ingenit Store Manager
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            La solución completa para gestionar tu negocio. Control de inventario, 
            ventas, clientes y reportes en una sola plataforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Zap className="mr-2 h-5 w-5" />
              Comenzar Gratis
            </Link>
            <Link
              href="/plans"
              className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Crown className="mr-2 h-5 w-5" />
              Ver Planes
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <Store className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-center">Gestión de Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600">
                Control total de stock, productos y categorías con alertas automáticas.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-green-100">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-center">Reportes Avanzados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600">
                Análisis detallado de ventas, productos más vendidos y tendencias.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-purple-100">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <CardTitle className="text-center">Gestión de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600">
                Base de datos de clientes con historial de compras y preferencias.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-orange-100">
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <CardTitle className="text-center">Seguridad Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600">
                Datos protegidos con encriptación y respaldos automáticos.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Plans Preview */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Planes Flexibles para tu Negocio
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Desde pequeños negocios hasta grandes empresas, tenemos el plan perfecto para ti.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-center">Plan Gratuito</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold text-gray-900">Gratis</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• 1 tipo de negocio</li>
                  <li>• Máximo 5 productos</li>
                  <li>• 10 días de prueba</li>
                  <li>• Soporte básico</li>
                </ul>
                <div className="mt-4">
                  <Link
                    href="/register"
                    className="block w-full text-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Comenzar Gratis
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-center">Single Store</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold text-gray-900">$10.000/mes</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• 1 tipo de negocio</li>
                  <li>• Productos ilimitados</li>
                  <li>• Stock ilimitado</li>
                  <li>• Integración WebPay</li>
                </ul>
                <div className="mt-4">
                  <Link
                    href="/plans"
                    className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Ver Detalles
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-center">Full Access</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold text-gray-900">$25.000/mes</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Negocios ilimitados</li>
                  <li>• Productos ilimitados</li>
                  <li>• Soporte VIP 24/7</li>
                  <li>• API personalizada</li>
                </ul>
                <div className="mt-4">
                  <Link
                    href="/plans"
                    className="block w-full text-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    Ver Detalles
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¿Listo para optimizar tu negocio?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Únete a miles de negocios que ya confían en Ingenit Store Manager.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Crear Cuenta Gratuita
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
