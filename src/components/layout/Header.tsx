'use client';
import { Crown, LogIn, Menu, X, User } from 'lucide-react';
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { useState } from "react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-blue13 fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/assets/icon_ingenIT.png"
              alt="Ingenit Store Manager"
              width={120}
              height={48}
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation Menu */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link 
              href="/#features" 
              className="text-gray2 hover:text-blue8 transition-colors font-medium text-sm"
            >
              Características
            </Link>
            <Link 
              href="/#plans" 
              className="text-gray2 hover:text-blue8 transition-colors font-medium text-sm"
            >
              Planes
            </Link>
            <Link 
              href="/#pricing" 
              className="text-gray2 hover:text-blue8 transition-colors font-medium text-sm"
            >
              Precios
            </Link>
            <Link 
              href="/#contact" 
              className="text-gray2 hover:text-blue8 transition-colors font-medium text-sm"
            >
              Contacto
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login">
              <Button 
                variant="ghost" 
                className="flex items-center text-gray2 hover:text-blue8 text-sm font-medium px-4 py-2"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button 
                className="flex items-center bg-blue8 hover:bg-blue6 text-white text-sm font-medium px-6 py-2 rounded-lg"
              >
                <User className="mr-2 h-4 w-4" />
                Crear Cuenta Gratuita
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray2" />
              ) : (
                <Menu className="h-6 w-6 text-gray2" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-blue13 bg-white/95 backdrop-blur-sm">
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Navigation Links */}
              <nav className="space-y-4">
                <Link 
                  href="/#features" 
                  className="block text-gray2 hover:text-blue8 transition-colors font-body text-sm py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Características
                </Link>
                <Link 
                  href="/#plans" 
                  className="block text-gray2 hover:text-blue8 transition-colors font-body text-sm py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Planes
                </Link>
                <Link 
                  href="/#pricing" 
                  className="block text-gray2 hover:text-blue8 transition-colors font-body text-sm py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Precios
                </Link>
              </nav>

              {/* Mobile Auth Buttons */}
              <div className="space-y-3 pt-4 border-t border-blue13">
                <Link href="/plans" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center text-blue8 border-blue8 hover:bg-blue15 text-sm py-2 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Ver Planes
                  </Button>
                </Link>
                <Link href="/register" className="block">
                  <Button 
                    className="w-full flex items-center justify-center bg-blue8 hover:bg-blue6 text-white text-sm py-2 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Crear Cuenta
                  </Button>
                </Link>
                <Link href="/login" className="block">
                  <Button 
                    variant="ghost" 
                    className="w-full flex items-center justify-center text-gray2 hover:text-blue8 text-sm py-2 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 