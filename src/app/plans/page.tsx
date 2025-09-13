'use client';
import { CheckCircle, Infinity, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue15 to-blue13">
      <Header />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 sm:py-20 lg:py-24 pt-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-title font-bold text-blue1 mb-6">
            Elige el Plan Perfecto
          </h1>
          <p className="text-xl sm:text-2xl text-gray2 mb-8 font-body leading-relaxed">
            Desde emprendedores hasta grandes empresas, tenemos la solución ideal para hacer crecer tu negocio.
          </p>
        </div>
      </section>

      {/* Plans Section */}
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Free Plan */}
          <Card className="border-2 border-gray8 bg-white relative">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-title text-blue1 mb-2">Plan Gratuito</CardTitle>
              <div className="text-center">
                <span className="text-4xl font-title font-bold text-blue1">Gratis</span>
                <p className="text-gray3 font-body mt-2">Para empezar</p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 text-gray2 font-body mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue8 mr-3 flex-shrink-0" />
                  <span>Sin límite de días de uso</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue8 mr-3 flex-shrink-0" />
                  <span>Máximo 5 productos</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue8 mr-3 flex-shrink-0" />
                  <span>Máximo 5 en stock por producto</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue8 mr-3 flex-shrink-0" />
                  <span>Funcionalidades básicas</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue8 mr-3 flex-shrink-0" />
                  <span>Soporte por email</span>
                </li>
              </ul>
              <div className="space-y-3">
                <Link
                  href="/register"
                  className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg text-blue8 bg-blue15 hover:bg-blue8 hover:text-white transition-all duration-200"
                >
                  Comenzar Gratis
                </Link>
                <p className="text-xs text-gray3 text-center">
                  Sin tarjeta de crédito requerida
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Plan */}
          <Card className="border-2 border-blue8 bg-blue15 relative transform scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue8 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Más Popular
              </span>
            </div>
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-title text-blue1 mb-2">Plan Mensual</CardTitle>
              <div className="text-center">
                <span className="text-4xl font-title font-bold text-blue1">$15.000</span>
                <span className="text-gray2 font-body">/mes</span>
                <p className="text-gray3 font-body mt-2">Sin límites</p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 text-gray2 font-body mb-8">
                <li className="flex items-center">
                  <Infinity className="h-5 w-5 text-blue8 mr-3 flex-shrink-0" />
                  <span>Productos ilimitados</span>
                </li>
                <li className="flex items-center">
                  <Infinity className="h-5 w-5 text-blue8 mr-3 flex-shrink-0" />
                  <span>Stock ilimitado</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue8 mr-3 flex-shrink-0" />
                  <span>Todas las funcionalidades</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue8 mr-3 flex-shrink-0" />
                  <span>Reportes avanzados</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue8 mr-3 flex-shrink-0" />
                  <span>Soporte prioritario</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue8 mr-3 flex-shrink-0" />
                  <span>Integración WebPay</span>
                </li>
              </ul>
              <div className="space-y-3">
                <Link
                  href="/register?plan=monthly"
                  className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg text-white bg-blue8 hover:bg-blue6 transition-all duration-200"
                >
                  Elegir Plan Mensual
                </Link>
                <p className="text-xs text-gray3 text-center">
                  Facturación mensual automática
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Annual Plan */}
          <Card className="border-2 border-blue8 bg-white relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                20% Descuento
              </span>
            </div>
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-title text-blue1 mb-2">Plan Anual</CardTitle>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl font-title line-through text-gray4">$180.000</span>
                  <span className="text-4xl font-title font-bold text-blue1">$144.000</span>
                </div>
                <span className="text-gray2 font-body">/año</span>
                <p className="text-gray3 font-body mt-2">Ahorra $36.000</p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 text-gray2 font-body mb-8">
                <li className="flex items-center">
                  <Infinity className="h-5 w-5 text-blue8 mr-3 flex-shrink-0" />
                  <span>Productos ilimitados</span>
                </li>
                <li className="flex items-center">
                  <Infinity className="h-5 w-5 text-blue8 mr-3 flex-shrink-0" />
                  <span>Stock ilimitado</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue8 mr-3 flex-shrink-0" />
                  <span>Todas las funcionalidades</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue8 mr-3 flex-shrink-0" />
                  <span>Reportes avanzados</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue8 mr-3 flex-shrink-0" />
                  <span>Soporte VIP 24/7</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue8 mr-3 flex-shrink-0" />
                  <span>API personalizada</span>
                </li>
              </ul>
              <div className="space-y-3">
                <Link
                  href="/register?plan=annual"
                  className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg text-blue8 bg-blue15 hover:bg-blue8 hover:text-white transition-all duration-200"
                >
                  Elegir Plan Anual
                </Link>
                <p className="text-xs text-gray3 text-center">
                  Facturación anual con descuento
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-title font-bold text-blue1 mb-4">
            Comparación de Funcionalidades
          </h2>
          <p className="text-lg text-gray2 max-w-2xl mx-auto font-body">
            Descubre qué incluye cada plan para tu negocio.
          </p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 lg:p-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <h3 className="font-title font-semibold text-blue1 mb-4">Funcionalidad</h3>
            </div>
            <div className="text-center">
              <h3 className="font-title font-semibold text-gray2 mb-4">Gratuito</h3>
            </div>
            <div className="text-center">
              <h3 className="font-title font-semibold text-blue8 mb-4">Mensual</h3>
            </div>
            <div className="text-center">
              <h3 className="font-title font-semibold text-blue8 mb-4">Anual</h3>
            </div>
            
            {/* Productos */}
            <div className="text-left">
              <span className="font-body text-gray2">Productos</span>
            </div>
            <div className="text-center">
              <span className="font-body text-gray2">5 máximo</span>
            </div>
            <div className="text-center">
              <Infinity className="h-5 w-5 text-blue8 mx-auto" />
            </div>
            <div className="text-center">
              <Infinity className="h-5 w-5 text-blue8 mx-auto" />
            </div>
            
            {/* Stock */}
            <div className="text-left">
              <span className="font-body text-gray2">Stock por producto</span>
            </div>
            <div className="text-center">
              <span className="font-body text-gray2">5 máximo</span>
            </div>
            <div className="text-center">
              <Infinity className="h-5 w-5 text-blue8 mx-auto" />
            </div>
            <div className="text-center">
              <Infinity className="h-5 w-5 text-blue8 mx-auto" />
            </div>
            
            {/* Reportes */}
            <div className="text-left">
              <span className="font-body text-gray2">Reportes</span>
            </div>
            <div className="text-center">
              <span className="font-body text-gray2">Básicos</span>
            </div>
            <div className="text-center">
              <CheckCircle className="h-5 w-5 text-blue8 mx-auto" />
            </div>
            <div className="text-center">
              <CheckCircle className="h-5 w-5 text-blue8 mx-auto" />
            </div>
            
            {/* WebPay */}
            <div className="text-left">
              <span className="font-body text-gray2">WebPay</span>
            </div>
            <div className="text-center">
              <span className="font-body text-gray2">-</span>
            </div>
            <div className="text-center">
              <CheckCircle className="h-5 w-5 text-blue8 mx-auto" />
            </div>
            <div className="text-center">
              <CheckCircle className="h-5 w-5 text-blue8 mx-auto" />
            </div>
            
            {/* API */}
            <div className="text-left">
              <span className="font-body text-gray2">API</span>
            </div>
            <div className="text-center">
              <span className="font-body text-gray2">-</span>
            </div>
            <div className="text-center">
              <span className="font-body text-gray2">-</span>
            </div>
            <div className="text-center">
              <CheckCircle className="h-5 w-5 text-blue8 mx-auto" />
            </div>
            
            {/* Soporte */}
            <div className="text-left">
              <span className="font-body text-gray2">Soporte</span>
            </div>
            <div className="text-center">
              <span className="font-body text-gray2">Email</span>
            </div>
            <div className="text-center">
              <span className="font-body text-gray2">Prioritario</span>
            </div>
            <div className="text-center">
              <span className="font-body text-gray2">VIP 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-title font-bold text-blue1 mb-4">
            Preguntas Frecuentes
          </h2>
          <p className="text-lg text-gray2 max-w-2xl mx-auto font-body">
            Resolvemos tus dudas sobre nuestros planes y servicios.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-title text-blue1">¿Cómo funciona la compra de paquetes?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray2 font-body">
                Los planes se configuran directamente dentro de tu plataforma. Una vez que elijas tu plan, 
                podrás configurar el método de pago y gestionar tu suscripción desde el panel de administración.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-title text-blue1">¿Puedo cambiar de plan en cualquier momento?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray2 font-body">
                Sí, puedes cambiar tu plan en cualquier momento desde tu panel de administración. 
                Los cambios se aplicarán en el próximo ciclo de facturación.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-title text-blue1">¿Qué pasa si excedo los límites del plan gratuito?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray2 font-body">
                Recibirás notificaciones cuando te acerques a los límites. Para continuar creciendo, 
                simplemente actualiza a un plan de pago desde tu panel de administración.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-title text-blue1">¿El descuento anual es permanente?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray2 font-body">
                Sí, el 20% de descuento se aplica automáticamente al elegir el plan anual. 
                Este descuento se mantiene mientras tengas una suscripción anual activa.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 lg:p-12 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-title font-bold text-blue1 mb-6">
            ¿Listo para elegir tu plan?
          </h2>
          <p className="text-xl text-gray2 mb-8 font-body max-w-2xl mx-auto">
            Comienza gratis y actualiza cuando tu negocio crezca. Sin compromisos, sin sorpresas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg text-white bg-blue8 hover:bg-blue6 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Zap className="mr-3 h-6 w-6" />
              Comenzar Gratis
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg text-blue8 bg-transparent hover:bg-blue15 transition-all duration-200 border-2 border-blue8"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 