'use client';
import { BarChart3, Database, Shield, Users, Briefcase, Target, User, LogIn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";

export default function Home() {
  return (
    <PageLayout>
      {/* Hero Section */}
      <Section className="bg-white pt-16">
        <div className="text-center max-w-5xl mx-auto py-8 lg:py-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Plataforma de Gestión
              <span className="text-blue-600 block">Comercial</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Plataforma integral para la gestión profesional de inventarios, ventas, 
              clientes y análisis de rendimiento empresarial.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                <Briefcase className="mr-3 h-5 w-5" />
                Crear Cuenta Gratuita
              </Link>
              <Link
                href="/plans"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg text-blue-600 bg-white hover:bg-gray-50 transition-colors duration-200 border-2 border-blue-600"
              >
                <Target className="mr-3 h-5 w-5" />
                Ver Soluciones
              </Link>
            </div>
        </div>
      </Section>

      {/* Features Section */}
      <Section id="features" className="bg-gray-50">
        <SectionTitle 
          title="Funcionalidades Principales"
          subtitle="Herramientas integradas para gestionar tu negocio de manera eficiente."
        />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 rounded-lg bg-blue-50">
                  <Database className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Gestión de Inventarios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm leading-relaxed">
                  Control completo de stock, productos y movimientos de inventario.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 rounded-lg bg-blue-50">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Reportes y Análisis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm leading-relaxed">
                  Dashboard con métricas, reportes y análisis de ventas.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 rounded-lg bg-blue-50">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Gestión de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm leading-relaxed">
                  Administración de clientes, contactos y historial de ventas.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 rounded-lg bg-blue-50">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Seguridad y Confiabilidad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm leading-relaxed">
                  Protección de datos y respaldo automático de información.
                </p>
              </CardContent>
            </Card>
          </div>
      </Section>

      {/* Simple CTA Section */}
      <Section id="plans" className="bg-gray-50">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Comienza Ahora
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Accede a todas las funcionalidades básicas de forma gratuita. 
            Actualiza cuando necesites funcionalidades avanzadas.
          </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                <User className="mr-3 h-5 w-5" />
                Crear Cuenta Gratuita
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg text-blue-600 bg-white hover:bg-gray-50 transition-colors duration-200 border-2 border-blue-600"
              >
                <LogIn className="mr-3 h-5 w-5" />
                Iniciar Sesión
              </Link>
            </div>
        </div>
      </Section>
    </PageLayout>
  );
}
