'use client';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from 'lucide-react';
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-blue1 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/assets/logo_transparent_ingenIT_white.png"
                alt="Ingenit Store Manager"
                width={120}
                height={48}
                className="h-10 w-auto"
              />
            </div>
            <p className="text-gray6 font-body text-sm">
              La solución completa para gestionar tu negocio. Control de inventario, 
              ventas, clientes y reportes en una sola plataforma.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray6 hover:text-blue8 transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray6 hover:text-blue8 transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray6 hover:text-blue8 transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray6 hover:text-blue8 transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-title font-semibold text-white">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#features" className="text-gray6 hover:text-blue8 transition-colors font-body text-sm">
                  Características
                </Link>
              </li>
              <li>
                <Link href="/#plans" className="text-gray6 hover:text-blue8 transition-colors font-body text-sm">
                  Planes
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-gray6 hover:text-blue8 transition-colors font-body text-sm">
                  Precios
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray6 hover:text-blue8 transition-colors font-body text-sm">
                  Crear Cuenta
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray6 hover:text-blue8 transition-colors font-body text-sm">
                  Iniciar Sesión
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-title font-semibold text-white">Soporte</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray6 hover:text-blue8 transition-colors font-body text-sm">
                  Centro de Ayuda
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-gray6 hover:text-blue8 transition-colors font-body text-sm">
                  Documentación
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-gray6 hover:text-blue8 transition-colors font-body text-sm">
                  API
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-gray6 hover:text-blue8 transition-colors font-body text-sm">
                  Estado del Servicio
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-title font-semibold text-white">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-blue8" />
                <div>
                  <p className="text-gray6 font-body text-sm">Soporte Técnico</p>
                  <p className="text-blue8 font-body text-sm">soporte@ingenit.cl</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-blue8" />
                <div>
                  <p className="text-gray6 font-body text-sm">Ventas</p>
                  <p className="text-blue8 font-body text-sm">ventas@ingenit.cl</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-blue8" />
                <div>
                  <p className="text-gray6 font-body text-sm">WhatsApp</p>
                  <p className="text-blue8 font-body text-sm">+56 9 3757 0007</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-blue8" />
                <div>
                  <p className="text-gray6 font-body text-sm">Antofagasta, Chile</p>
                  <p className="text-blue8 font-body text-sm">Antofagasta</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-blue3 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray6 font-body text-sm">
                © 2025 Ingenit Store Manager. Todos los derechos reservados.
              </p>
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray6 hover:text-blue8 transition-colors font-body text-sm">
                Privacidad
              </Link>
              <Link href="/terms" className="text-gray6 hover:text-blue8 transition-colors font-body text-sm">
                Términos
              </Link>
              <Link href="/cookies" className="text-gray6 hover:text-blue8 transition-colors font-body text-sm">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 