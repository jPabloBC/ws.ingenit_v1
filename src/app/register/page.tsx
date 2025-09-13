'use client';
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle, CheckCircle2, Clock, Crown, Eye, EyeOff, Globe, Info, Lock, Mail, RefreshCw, Shield, Star, Store, User, Users, Wrench, Zap, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/services/supabase/client';
import { sendVerificationEmail } from '@/services/emailService';
import toast from "react-hot-toast";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/ui/Section";

interface StoreType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  maxStores: number;
  maxProducts: number;
  maxStockPerProduct: number;
  features: string[];
  color: string;
  popular?: boolean;
}

type RegistrationStep = 'basic' | 'verification' | 'business' | 'platform';

export default function Register() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('basic');
  const [checkingUserStatus, setCheckingUserStatus] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    countryCode: "+56",
    country: "Chile",
    currencyCode: "CLP",
    password: "",
    confirmPassword: ""
  });
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<'checking' | 'available' | 'taken' | null>(null);
  const [nameValid, setNameValid] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, createProfile } = useAuth();

  // Verificar estado del usuario al cargar la página
  const checkUserRegistrationStatus = async () => {
    setCheckingUserStatus(true);
    
    try {
      // Delay mínimo para mostrar el loader
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Verificar si hay parámetros de email en la URL
      const emailFromParams = searchParams.get('email');
      
      if (emailFromParams) {
        // Si hay email en parámetros, verificar su estado directamente
        setUserEmail(emailFromParams);
        
        const { data: userData } = await supabase
          .from('ws_users')
          .select('store_types, email_verified')
          .eq('email', emailFromParams)
          .single();

        if (userData?.store_types && userData.store_types.length > 0) {
          // Ya completó todo, redirigir al dashboard
          toast.success("¡Bienvenido de vuelta! Redirigiendo al dashboard...");
          router.push('/dashboard');
        } else if (userData?.email_verified) {
          // Email verificado pero sin negocio, ir al paso 3
          setCurrentStep('business');
        } else {
          // Email no verificado, ir al paso 2
          setCurrentStep('verification');
        }
      } else {
        // Si no hay email en parámetros, verificar usuario logueado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setCurrentStep('basic');
          setCheckingUserStatus(false);
          return;
        }

        // Usuario existe, verificar su estado básico
        const { data: userData } = await supabase
          .from('ws_users')
          .select('store_types, email_verified')
          .eq('email', user.email)
          .single();

        if (userData?.store_types && userData.store_types.length > 0) {
          // Ya completó todo, redirigir al dashboard
          toast.success("¡Bienvenido de vuelta! Redirigiendo al dashboard...");
          router.push('/dashboard');
        } else if (userData?.email_verified) {
          // Email verificado pero sin negocio, ir al paso 3
          setCurrentStep('business');
          setUserEmail(user.email || '');
        } else {
          // Email no verificado, ir al paso 2
          setCurrentStep('verification');
          setUserEmail(user.email || '');
        }
      }
    } catch (error) {
      console.error('Error verificando estado del usuario:', error);
      setCurrentStep('basic');
    } finally {
      setCheckingUserStatus(false);
    }
  };

  // Verificar estado al cargar la página
  useEffect(() => {
    const initializeRegistration = async () => {
      try {
        // Verificar si hay un step específico en la URL primero
        const stepParam = searchParams?.get('step');
        if (stepParam && ['verification', 'business', 'platform'].includes(stepParam)) {
          // Pequeño delay para mostrar el loader
          await new Promise(resolve => setTimeout(resolve, 1200));
          setCurrentStep(stepParam as RegistrationStep);
          setCheckingUserStatus(false);
          return;
        }

        // Solo verificar estado del usuario si no hay step específico
        await checkUserRegistrationStatus();
      } catch (error) {
        console.error('Error inicializando registro:', error);
        setCheckingUserStatus(false);
        // En caso de error, ir al paso básico
        setCurrentStep('basic');
      }
    };
    
    initializeRegistration();
  }, [searchParams]);

  // Escuchar cuando se verifica el email en otra pestaña
  useEffect(() => {
    if (currentStep === 'verification' && userEmail) {
      const checkVerificationStatus = async () => {
        try {
          console.log('Verificando estado del email:', userEmail);
          
          // Verificar directamente por email (no por usuario logueado)
          const { data: userData, error } = await supabase
            .from('ws_users')
            .select('store_types, email_verified')
            .eq('email', userEmail)
            .single();

          if (error) {
            console.log('Usuario aún no tiene perfil:', error.message);
          return;
        }

          console.log('Estado del usuario:', userData);

          if (userData?.email_verified && userData?.store_types && userData.store_types.length > 0) {
            // Email verificado y negocio seleccionado, ir al dashboard
            console.log('Usuario completo, redirigiendo al dashboard');
            toast.success("¡Email verificado y configuración completada!");
            router.push('/dashboard');
          } else if (userData?.email_verified) {
            // Email verificado pero sin negocio, ir al paso 3
            console.log('Email verificado, pasando al paso 3');
            toast.success("¡Email verificado! Completa tu configuración...");
            setCurrentStep('business');
          }
        } catch (error) {
          console.log('Error verificando estado:', error);
        }
      };

      // Verificar inmediatamente y luego cada 2 segundos
      checkVerificationStatus();
      const interval = setInterval(checkVerificationStatus, 2000);
      
      return () => clearInterval(interval);
    }
  }, [currentStep, router, userEmail]);

  // Escuchar cuando se selecciona negocio en otra pestaña
  useEffect(() => {
    if (currentStep === 'business' && userEmail) {
      const checkBusinessStatus = async () => {
        try {
          console.log('Verificando estado del negocio para:', userEmail);
          
          // Verificar si ya se seleccionó negocio
          const { data: userData, error } = await supabase
            .from('ws_users')
            .select('store_types, email_verified')
            .eq('email', userEmail)
            .single();

          if (error) {
            console.log('Error verificando negocio:', error.message);
          return;
        }

          console.log('Estado del negocio:', userData);

          if (userData?.email_verified && userData?.store_types && userData.store_types.length > 0) {
            // Negocio ya seleccionado, ir al dashboard
            console.log('Negocio ya seleccionado, redirigiendo al dashboard');
            toast.success("¡Negocio ya seleccionado! Redirigiendo al dashboard...");
            router.push('/dashboard');
          }
        } catch (error) {
          console.log('Error verificando negocio:', error);
        }
      };

      // Verificar inmediatamente y luego cada 3 segundos
      checkBusinessStatus();
      const interval = setInterval(checkBusinessStatus, 3000);
      
      return () => clearInterval(interval);
    }
  }, [currentStep, router, userEmail]);

  const countries = [
    { code: "+56", name: "Chile", flag: "🇨🇱", currency: "CLP" },
    { code: "+54", name: "Argentina", flag: "🇦🇷", currency: "ARS" },
    { code: "+591", name: "Bolivia", flag: "🇧🇴", currency: "BOB" },
    { code: "+55", name: "Brasil", flag: "🇧🇷", currency: "BRL" },
    { code: "+57", name: "Colombia", flag: "🇨🇴", currency: "COP" },
    { code: "+506", name: "Costa Rica", flag: "🇨🇷", currency: "CRC" },
    { code: "+53", name: "Cuba", flag: "🇨🇺", currency: "CUP" },
    { code: "+593", name: "Ecuador", flag: "🇪🇨", currency: "USD" },
    { code: "+503", name: "El Salvador", flag: "🇸🇻", currency: "USD" },
    { code: "+502", name: "Guatemala", flag: "🇬🇹", currency: "GTQ" },
    { code: "+504", name: "Honduras", flag: "🇭🇳", currency: "HNL" },
    { code: "+52", name: "México", flag: "🇲🇽", currency: "MXN" },
    { code: "+505", name: "Nicaragua", flag: "🇳🇮", currency: "NIO" },
    { code: "+507", name: "Panamá", flag: "🇵🇦", currency: "USD" },
    { code: "+595", name: "Paraguay", flag: "🇵🇾", currency: "PYG" },
    { code: "+51", name: "Perú", flag: "🇵🇪", currency: "PEN" },
    { code: "+1", name: "Estados Unidos", flag: "🇺🇸", currency: "USD" },
    { code: "+598", name: "Uruguay", flag: "🇺🇾", currency: "UYU" },
    { code: "+58", name: "Venezuela", flag: "🇻🇪", currency: "VES" },
    { code: "+34", name: "España", flag: "🇪🇸", currency: "EUR" }
  ];

  const storeTypes: StoreType[] = [
    {
      id: "almacen",
      name: "Almacén General",
      description: "Ventas rápidas, control de stock y bodega. Sin registro de clientes.",
      icon: Store,
      color: "blue"
    },
    {
      id: "ferreteria",
      name: "Ferretería",
      description: "Productos variados, clientes registrados, servicios y reparaciones",
      icon: Wrench,
      color: "orange"
    },
    {
      id: "libreria",
      name: "Librería",
      description: "Libros, papelería, eventos y gestión de clientes",
      icon: BookOpen,
      color: "green"
    },
    {
      id: "botilleria",
      name: "Botillería",
      description: "Venta de licores, control de stock y ventas rápidas",
      icon: Store,
      color: "purple"
    },
    {
      id: "restaurante",
      name: "Restaurante",
      description: "Control de mesas, menús, órdenes y cocina",
      icon: Store,
      color: "red"
    }
  ];

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "free",
      name: "Plan Gratuito",
      price: "Gratis",
      maxStores: 1,
      maxProducts: 5,
      maxStockPerProduct: 5,
      features: [
        "Sin límite de días de uso",
        "Máximo 5 productos",
        "Máximo 5 en stock por producto",
        "Funcionalidades básicas",
        "Soporte por email"
      ],
      color: "gray"
    },
    {
      id: "monthly",
      name: "Plan Mensual",
      price: "$15.000/mes",
      maxStores: -1,
      maxProducts: -1,
      maxStockPerProduct: -1,
      features: [
        "Productos ilimitados",
        "Stock ilimitado",
        "Todas las funcionalidades",
        "Reportes avanzados",
        "Soporte prioritario",
        "Integración WebPay"
      ],
      color: "blue",
      popular: true
    },
    {
      id: "annual",
      name: "Plan Anual",
      price: "$144.000/año",
      maxStores: -1,
      maxProducts: -1,
      maxStockPerProduct: -1,
      features: [
        "Productos ilimitados",
        "Stock ilimitado",
        "Todas las funcionalidades",
        "Reportes avanzados",
        "Soporte VIP 24/7",
        "Integración WebPay",
        "API personalizada"
      ],
      color: "green"
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
        ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
      setFormData({
        ...formData,
      name: name
    });
    setNameValid(isValidName(name));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
      setFormData({
        ...formData,
      phone: phone
    });
    setPhoneValid(isValidPhone(phone, formData.countryCode));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
      setFormData({
        ...formData,
      password: password
    });
    // Verificar si las contraseñas coinciden
    setPasswordMatch(password === formData.confirmPassword && password.length >= 6);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const confirmPassword = e.target.value;
    setFormData({
      ...formData,
      confirmPassword: confirmPassword
    });
    // Verificar si las contraseñas coinciden
    setPasswordMatch(confirmPassword === formData.password && confirmPassword.length >= 6);
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidName = (name: string) => {
    const words = name.trim().split(/\s+/);
    return words.length >= 2 && words.every(word => word.length > 0);
  };

  const isValidPhone = (phone: string, countryCode: string) => {
    // Validaciones actualizadas por país (2024)
    const phoneRegex: { [key: string]: RegExp } = {
      '+56': /^[2-9]\d{8}$/, // Chile: 9 dígitos, móvil/fijo (2-9) + 8 dígitos
      '+54': /^[2-9]\d{7,8}$/, // Argentina: 8-9 dígitos, empieza con 2-9
      '+591': /^[67]\d{7}$/, // Bolivia: 8 dígitos, móvil empieza con 6 o 7
      '+55': /^[1-9]\d{8,9}$/, // Brasil: 9-10 dígitos, no empieza con 0
      '+57': /^[3]\d{9}$/, // Colombia: 10 dígitos, móvil empieza con 3
      '+506': /^[2-9]\d{7}$/, // Costa Rica: 8 dígitos, empieza con 2-9
      '+53': /^[5]\d{7}$/, // Cuba: 8 dígitos, móvil empieza con 5
      '+593': /^[2-9]\d{7}$/, // Ecuador: 8 dígitos, empieza con 2-9
      '+503': /^[2-7]\d{7}$/, // El Salvador: 8 dígitos, empieza con 2-7
      '+502': /^[2-9]\d{7}$/, // Guatemala: 8 dígitos, empieza con 2-9
      '+504': /^[2-9]\d{7}$/, // Honduras: 8 dígitos, empieza con 2-9
      '+52': /^[2-9]\d{9}$/, // México: 10 dígitos, empieza con 2-9
      '+505': /^[2-9]\d{7}$/, // Nicaragua: 8 dígitos, empieza con 2-9
      '+507': /^[2-9]\d{7}$/, // Panamá: 8 dígitos, empieza con 2-9
      '+595': /^[2-9]\d{7}$/, // Paraguay: 8 dígitos, empieza con 2-9
      '+51': /^[9]\d{8}$/, // Perú: 9 dígitos, móvil empieza con 9
      '+1': /^[2-9]\d{9}$/, // Puerto Rico: 10 dígitos, empieza con 2-9
      '+598': /^[2-9]\d{7}$/, // Uruguay: 8 dígitos, empieza con 2-9
      '+58': /^[2-9]\d{9}$/, // Venezuela: 10 dígitos, empieza con 2-9
    };
    
    const cleanPhone = phone.replace(/\D/g, '');
    const regex = phoneRegex[countryCode];
    return regex ? regex.test(cleanPhone) : false;
  };

  const checkEmailAvailability = async (email: string) => {
    if (!email || !isValidEmail(email)) {
      setEmailStatus(null);
      return;
    }

    setEmailStatus('checking');
    
    try {
      const { data: existingUser, error } = await supabase
        .from('ws_users')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        setEmailStatus('taken');
      } else if (error && error.code === 'PGRST116') {
    setEmailStatus('available');
      } else {
        setEmailStatus(null);
      }
    } catch (error) {
      setEmailStatus(null);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value.toLowerCase();
    setFormData({
      ...formData,
      email: email
    });
    
    // Debounce la verificación
    setTimeout(() => {
      checkEmailAvailability(email);
    }, 500);
  };

  const handleBasicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones básicas
      if (formData.password !== formData.confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }

      if (formData.password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres");
        return;
      }

      // Verificar si el email ya existe
      const { data: existingUser, error: checkError } = await supabase
        .from('ws_users')
        .select('email')
        .eq('email', formData.email)
        .single();

      if (existingUser) {
        toast.error("Este email ya está registrado. Usa un email diferente o inicia sesión.");
        return;
      }

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 es "no rows returned", que es lo que esperamos
        console.error("Error verificando email:", checkError);
        toast.error("Error verificando disponibilidad del email");
        return;
      }

      // Crear cuenta en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name
          }
        }
      });

      if (authError) {
          toast.error("Error al crear la cuenta: " + authError.message);
        return;
      }

      if (!authData.user) {
        toast.error("Error: No se pudo crear el usuario");
        return;
      }

      // Crear perfil básico en ws_users
      const { error: userError } = await supabase
        .from('ws_users')
        .insert({
          user_id: authData.user.id,
          name: formData.name,
          email: formData.email,
          country_code: formData.countryCode,
          currency_code: formData.currencyCode,
          role: 'user',
          app_id: authData.user.id,
          email_verified: false,
          created_at: new Date().toISOString()
        });

      if (userError) {
        console.error("Error creando perfil en ws_users:", userError);
        toast.error(`Error al crear perfil: ${userError.message}`);
          return;
      }

      // Crear registro de verificación en ws_email_verifications
      const verificationToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error: verificationError } = await supabase
        .from('ws_email_verifications')
        .insert({
          user_id: authData.user.id,
          email: formData.email,
          verified: false,
          verification_token: verificationToken,
          created_at: new Date().toISOString()
        });

      if (verificationError) {
        console.error("Error creando registro de verificación:", verificationError);
        toast.error(`Error al configurar verificación: ${verificationError.message}`);
        return;
      }

      // Enviar correo de verificación personalizado
      try {
        const emailResult = await sendVerificationEmail(
          formData.email,
          formData.name,
          verificationToken
        );

        if (emailResult.success) {
          toast.success("Cuenta creada exitosamente. Revisa tu correo para verificar tu cuenta.");
      } else {
          console.error("Error enviando email:", emailResult.error);
          toast.success("Cuenta creada exitosamente. Por favor, revisa tu correo o spam.");
        }
      } catch (emailError) {
        console.error("Error enviando email de verificación:", emailError);
        toast.success("Cuenta creada exitosamente. Por favor, revisa tu correo o spam.");
      }

      setUserEmail(formData.email);
      setCurrentStep('verification');
    } catch (error: any) {
      toast.error(error.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = async () => {
    try {
      if (!userEmail) {
        setCurrentStep('business');
      return;
    }

      // Verificar si ya tiene tipo de negocio seleccionado
      const { data: userData, error: userError } = await supabase
        .from('ws_users')
        .select('store_types')
        .eq('email', userEmail)
        .single();

      if (userError) {
        console.log('Error obteniendo datos del usuario:', userError);
        setCurrentStep('business');
        return;
      }

      if (userData?.store_types && userData.store_types.length > 0) {
        // Ya tiene tipo de negocio, ir al dashboard
        toast.success("¡Bienvenido! Redirigiendo al dashboard...");
        router.push('/dashboard');
    } else {
        // No tiene tipo de negocio, ir al paso 3
        setCurrentStep('business');
      }
    } catch (error) {
      console.error('Error en handleVerificationComplete:', error);
      setCurrentStep('business');
    }
  };

  const handleBusinessToggle = (businessId: string) => {
    if (selectedStores.includes(businessId)) {
      setSelectedStores(selectedStores.filter(id => id !== businessId));
    } else {
      setSelectedStores([...selectedStores, businessId]);
    }
  };

  const handleBusinessSubmit = async () => {
    if (selectedStores.length === 0) {
      toast.error("Debes seleccionar al menos un tipo de negocio");
      return;
    }

    setLoading(true);

    try {
      // Verificar estado actual del usuario antes de actualizar
      const { data: currentUserData, error: checkError } = await supabase
        .from('ws_users')
        .select('store_types, email_verified')
        .eq('email', userEmail)
        .single();

      if (checkError) {
        console.error("Error verificando usuario:", checkError);
        toast.error("Error verificando estado del usuario");
        return;
      }

      // Verificar si ya tiene negocio seleccionado (prevenir duplicación)
      if (currentUserData?.store_types && currentUserData.store_types.length > 0) {
        toast.success("¡Ya tienes negocio seleccionado! Redirigiendo al dashboard...");
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
        return;
      }

      // Verificar que el email esté verificado
      if (!currentUserData?.email_verified) {
        toast.error("Debes verificar tu email antes de continuar");
    setCurrentStep('verification');
        return;
      }

      // Actualizar perfil existente en ws_users con los tipos de negocio
      const { error: updateError } = await supabase
        .from('ws_users')
        .update({
          store_types: selectedStores,
          updated_at: new Date().toISOString()
        })
        .eq('email', userEmail);

      if (updateError) {
        console.error("Error actualizando perfil en ws_users:", updateError);
        toast.error(`Error al actualizar perfil: ${updateError.message}`);
        return;
      }

      toast.success("¡Configuración completada! Accediendo a la plataforma...");
      setCurrentStep('platform');
      
      // Redirigir al dashboard después de un momento
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Error al completar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async () => {
    setVerificationLoading(true);
    
    try {
      // Verificar si el usuario ya está verificado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email_confirmed_at) {
        toast.success("¡Email verificado! Redirigiendo al dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        // Reenviar email de verificación
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: userEmail
        });

        if (error) {
          toast.error("Error al reenviar el email: " + error.message);
        } else {
          toast.success("Email de verificación reenviado. Revisa tu bandeja de entrada.");
        }
      }
    } catch (error: any) {
      toast.error("Error al verificar el email: " + error.message);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setVerificationLoading(true);
    
    try {
      console.log('Verificando manualmente el estado del email:', userEmail);
      
      if (!userEmail) {
        toast.error("No se encontró el email");
        return;
      }

      // Verificar directamente por email (no por usuario logueado)
      const { data: userData, error: userError } = await supabase
        .from('ws_users')
        .select('store_types, email_verified')
        .eq('email', userEmail)
        .single();

      if (userError) {
        console.error('Error verificando usuario:', userError);
        toast.error("Error verificando el estado del usuario");
          return;
        }

      if (!userData?.email_verified) {
        toast.error("El email aún no ha sido verificado. Revisa tu bandeja de entrada.");
        return;
      }

      console.log('Email verificado, estado del usuario:', userData);
      toast.success("¡Email verificado! Continuando con la configuración...");
      handleVerificationComplete();
      
    } catch (error: any) {
      console.error('Error verificando estado:', error);
      toast.error("Error al verificar el estado: " + error.message);
    } finally {
      setVerificationLoading(false);
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "border-blue-600 hover:border-blue6 bg-blue-50 hover:bg-blue14";
      case "orange":
        return "border-orange-200 hover:border-orange-300 bg-orange-50 hover:bg-orange-100";
      case "green":
        return "border-blue-600 hover:border-blue6 bg-blue-50 hover:bg-blue14";
      case "purple":
        return "border-purple-200 hover:border-purple-300 bg-purple-50 hover:bg-purple-100";
      case "red":
        return "border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100";
      default:
        return "border-gray-300 hover:border-gray-400 bg-gray-100 hover:bg-gray-200";
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case "blue":
        return "text-blue-600";
      case "orange":
        return "text-orange-600";
      case "green":
        return "text-blue-600";
      case "purple":
        return "text-purple-600";
      case "red":
        return "text-red-600";
      default:
        return "text-gray-400";
    }
  };

  const getPlanColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "border-blue-600 bg-blue-50";
      case "orange":
        return "border-orange-200 bg-orange-50";
      case "green":
        return "border-blue-600 bg-blue-50";
      case "purple":
        return "border-purple-200 bg-purple-50";
      case "red":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-300 bg-gray-100";
    }
  };

  // Mostrar loading mientras verifica el estado del usuario
  if (checkingUserStatus) {
  return (
      <PageLayout>
        <Section className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue15 border-t-blue8 rounded-full animate-spin mx-auto"></div>
            </div>
            <div className="space-y-2">
              <p className="text-lg text-blue1 font-body">Cargando...</p>
            </div>
          </div>
        </Section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Section className="py-12">
        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep === 'basic' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep === 'basic' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray5 text-gray-400'
                }`}>
                  1
                </div>
                <span className="ml-2 font-medium">Cuenta</span>
              </div>
            <div className="w-16 h-1 bg-gray5 rounded"></div>
            <div className={`flex items-center ${currentStep === 'verification' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep === 'verification' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray5 text-gray-400'
                }`}>
                  2
                </div>
              <span className="ml-2 font-medium">Verificar</span>
              </div>
            <div className="w-16 h-1 bg-gray5 rounded"></div>
            <div className={`flex items-center ${currentStep === 'business' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep === 'business' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray5 text-gray-400'
                }`}>
                  3
                </div>
                <span className="ml-2 font-medium">Negocio</span>
              </div>
            <div className="w-16 h-1 bg-gray5 rounded"></div>
            <div className={`flex items-center ${currentStep === 'platform' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep === 'platform' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray5 text-gray-400'
                }`}>
                  4
                </div>
              <span className="ml-2 font-medium">Plataforma</span>
              </div>
            </div>
          </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto">
          {currentStep === 'basic' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Form */}
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Únete a Ingenit
                  </h1>
                  <p className="text-xl text-gray-600">
                    Comienza a gestionar tu negocio de manera profesional
                  </p>
                </div>

                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Información Personal</CardTitle>
                  </CardHeader>
                  <CardContent>
                  <form onSubmit={handleBasicSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-base font-medium text-gray-900">
                        Nombre Completo
                      </label>
                      <div className="mt-1 relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                            onChange={(e) => {
                              // Capitalizar primera letra de cada palabra
                              const capitalized = e.target.value
                                .toLowerCase()
                                .split(' ')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ');
                              handleNameChange({ ...e, target: { ...e.target, value: capitalized } });
                            }}
                            className={`appearance-none relative block w-full px-3 py-3 border placeholder-gray6 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-blue-600 focus:z-10 text-base font-body ${
                              nameValid ? 'border-green-500' : 'border-gray-300'
                            }`}
                          placeholder="Tu nombre completo"
                        />
                        {nameValid && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-6 h-6 rounded-full border border-green-500 flex items-center justify-center">
                              <Check className="h-4 w-4 text-green-500" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-base font-medium text-gray-900 font-body">
                        Correo Electrónico
                      </label>
                      <div className="mt-1 relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={formData.email}
                            onChange={handleEmailChange}
                            className={`appearance-none relative block w-full px-3 py-3 border placeholder-gray6 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-blue-600 focus:z-10 text-base font-body ${
                              emailStatus === 'available' ? 'border-green-500' : 
                              emailStatus === 'taken' ? 'border-red-500' : 
                              emailStatus === 'checking' ? 'border-yellow-500' : 
                              'border-gray-300'
                          }`}
                          placeholder="correo@ejemplo.com"
                        />
                          {emailStatus === 'checking' && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          </div>
                          )}
                          {emailStatus === 'available' && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-6 h-6 rounded-full border border-green-500 flex items-center justify-center">
                              <Check className="h-4 w-4 text-green-500" />
                            </div>
                          </div>
                          )}
                          {emailStatus === 'taken' && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-6 h-6 rounded-full border border-red-500 flex items-center justify-center">
                            <X className="h-4 w-4 text-red-500" />
                        </div>
                      </div>
                      )}
                        </div>
                      {emailStatus === 'available' && (
                          <p className="mt-1 text-sm text-green-600 font-body">✓ Email disponible</p>
                        )}
                        {emailStatus === 'taken' && (
                          <p className="mt-1 text-sm text-red-600 font-body">✗ Este email ya está registrado. <a href="/login" className="text-blue-600 hover:text-blue-700 underline">Inicia sesión</a></p>
                        )}
                        {emailStatus === 'checking' && (
                          <p className="mt-1 text-sm text-yellow-600 font-body">Verificando disponibilidad...</p>
                      )}
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-base font-medium text-gray-900 font-body">
                          Teléfono
                        </label>
                        <div className="mt-1 flex gap-2">
                          <div className="relative w-32">
                            <select
                              id="countryCode"
                              name="countryCode"
                              value={formData.countryCode}
                              onChange={(e) => {
                                const selectedCountry = countries.find(c => c.code === e.target.value);
                                setFormData({ 
                                  ...formData, 
                                  countryCode: e.target.value,
                                  country: selectedCountry?.name || "Chile",
                                  currencyCode: selectedCountry?.currency || "CLP"
                                });
                              }}
                              className="appearance-none relative block w-full px-3 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-blue-600 focus:z-10 text-base font-body"
                            >
                              {countries.map((country) => (
                                <option key={country.code} value={country.code}>
                                  {country.flag} {country.code}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1 relative">
                            <input
                              id="phone"
                              name="phone"
                              type="tel"
                              required
                              value={formData.phone}
                              onChange={(e) => {
                                // Solo permitir números
                                const phoneNumber = e.target.value.replace(/\D/g, '');
                                handlePhoneChange({ ...e, target: { ...e.target, value: phoneNumber } });
                              }}
                              className={`appearance-none relative block w-full px-3 py-3 border placeholder-gray6 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-blue-600 focus:z-10 text-base font-body ${
                                phoneValid ? 'border-green-500' : 'border-gray-300'
                              }`}
                              placeholder="123456789"
                            />
                            {phoneValid && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="w-6 h-6 rounded-full border border-green-500 flex items-center justify-center">
                                  <Check className="h-4 w-4 text-green-500" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="country" className="block text-base font-medium text-gray-900 font-body">
                          País
                        </label>
                        <div className="mt-1 relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <select
                            id="country"
                            name="country"
                            required
                            value={formData.country}
                            onChange={(e) => {
                              const selectedCountry = countries.find(c => c.name === e.target.value);
                              setFormData({ 
                                ...formData, 
                                country: e.target.value,
                                countryCode: selectedCountry?.code || "+56",
                                currencyCode: selectedCountry?.currency || "CLP"
                              });
                            }}
                            className="appearance-none relative block w-full px-3 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-blue-600 focus:z-10 text-base font-body"
                          >
                            {countries.map((country) => (
                              <option key={country.code} value={country.name}>
                                {country.flag} {country.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-base font-medium text-gray-900 font-body">
                        Contraseña
                      </label>
                      <div className="mt-1 relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          value={formData.password}
                          onChange={handleInputChange}
                            className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray6 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-blue-600 focus:z-10 text-base font-body"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-400"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                        <p className="mt-1 text-sm text-gray-500">Mínimo 6 caracteres</p>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-900 font-body">
                        Confirmar Contraseña
                      </label>
                      <div className="mt-1 relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                            className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray6 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-blue-600 focus:z-10 text-base font-body"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-400"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue8 disabled:opacity-50 disabled:cursor-not-allowed font-body transition-colors"
                      >
                        {loading ? "Creando cuenta..." : "Crear Cuenta"}
                    </button>
                  </form>
                  </CardContent>
                </Card>

                <div className="text-center">
                  <p className="text-sm text-gray-600 font-body">
                    ¿Ya tienes una cuenta?{" "}
                    <button
                      type="button"
                      onClick={() => router.push("/login")}
                      className="font-medium text-blue-600 hover:text-blue-700 font-body"
                    >
                      Inicia sesión
                    </button>
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-title font-bold text-gray-900 mb-6">
                    ¿Por qué elegir Ingenit?
                  </h2>
                </div>

                <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Shield className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Seguridad Garantizada</h3>
                      <p className="text-gray-600 font-body">
                          Tus datos están protegidos con encriptación de nivel bancario y respaldos automáticos.
                        </p>
                    </div>
                  </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Clock className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuración Rápida</h3>
                      <p className="text-gray-600 font-body">
                          Comienza a usar la plataforma en menos de 5 minutos. Sin complicaciones.
                        </p>
                    </div>
                  </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Soporte 24/7</h3>
                      <p className="text-gray-600 font-body">
                          Nuestro equipo está disponible para ayudarte en cualquier momento.
                        </p>
                    </div>
                  </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Star className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Funcionalidades Avanzadas</h3>
                      <p className="text-gray-600 font-body">
                          Control de stock, reportes detallados, gestión de clientes y mucho más.
                        </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}


          {currentStep === 'business' && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-4xl font-title font-bold text-gray-900 mb-4">
                  Selecciona tu Tipo de Negocio
                </h1>
                <p className="text-xl text-gray-600 font-body">
                  Elige el tipo de negocio que vas a gestionar
                </p>
                
                {/* Indicador de sincronización */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-blue-700 font-medium">
                      Sincronizando en tiempo real con otros dispositivos...
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {storeTypes.map((store) => (
                  <Card
                    key={store.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedStores.includes(store.id)
                        ? "ring-2 ring-blue8 scale-105"
                        : ""
                    } ${getColorClasses(store.color)}`}
                    onClick={() => handleBusinessToggle(store.id)}
                  >
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        <div className="p-4 rounded-full bg-white shadow-lg">
                          <store.icon className={`h-8 w-8 ${getIconColor(store.color)}`} />
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 font-title">
                        {store.name}
                      </CardTitle>
                      <p className="text-gray-600 mt-2 text-sm font-body">{store.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        {selectedStores.includes(store.id) ? (
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-body">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Seleccionado
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-body">
                            No seleccionado
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center space-y-4">
                <button
                  onClick={handleBusinessSubmit}
                  disabled={loading || selectedStores.length === 0}
                  className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-body text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Configurando..." : "Continuar a la Plataforma"}
                  </button>
                </div>
              </div>
          )}

          {currentStep === 'verification' && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="h-10 w-10 text-white" />
                  </div>
                <h1 className="text-3xl font-title font-bold text-gray-900 mb-4">
                    Verifica tu Correo Electrónico
                  </h1>
                <p className="text-lg text-gray-600 font-body">
                    Hemos enviado un enlace de verificación a:
                  </p>
                <p className="text-xl font-semibold text-gray-900 mt-2 font-body">
                  {userEmail}
                  </p>
                  
                  {/* Indicador de sincronización */}
                  <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <p className="text-sm text-blue-700 font-medium">
                        Monitoreando verificación en tiempo real...
                      </p>
                    </div>
                  </div>
                </div>

              <Card className="border-gray-200">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">¿Qué hacer ahora?</h3>
                      <ol className="space-y-3 text-gray-600 font-body">
                        <li className="flex items-start">
                          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">1</span>
                          <span>Revisa tu bandeja de entrada (y carpeta de spam)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">2</span>
                          <span>Haz clic en el enlace de verificación</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">3</span>
                          <span>Serás redirigido automáticamente al dashboard</span>
                        </li>
                      </ol>
                    </div>

                    <div className="bg-gray9 border border-gray8 rounded-lg p-6">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-gray5 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-gray5 mb-1">Importante</h4>
                          <p className="text-sm text-gray5">
                            No podrás acceder a la plataforma hasta verificar tu correo electrónico. 
                            Esta es una medida de seguridad para proteger tu cuenta.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={handleCheckVerification}
                        disabled={verificationLoading}
                        className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-body font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {verificationLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Ya verifiqué mi correo
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleEmailVerification}
                        disabled={verificationLoading}
                        className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors font-body font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {verificationLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Reenviar email
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600 font-body">
                        ¿No recibiste el email? Revisa tu carpeta de spam o{" "}
                        <button
                          onClick={handleEmailVerification}
                          className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          solicita un nuevo enlace
                        </button>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

                <div className="text-center mt-6">
                  <button
                    onClick={() => router.push("/login")}
                  className="text-blue-600 hover:text-blue-700 font-body"
                  >
                    ¿Ya tienes una cuenta? Inicia sesión
                  </button>
                </div>
              </div>
          )}

          {currentStep === 'platform' && (
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-8">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-white" />
        </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  ¡Bienvenido a la Plataforma!
                </h1>
                <p className="text-lg text-gray-600">
                  Tu cuenta ha sido configurada exitosamente. Estás siendo redirigido al dashboard.
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-600 font-medium">Redirigiendo al dashboard...</span>
    </div>
              </div>
            </div>
          )}
        </div>
      </Section>
    </PageLayout>
  );
} 