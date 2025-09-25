"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabase/client";
import { sendVerificationEmail } from "@/services/emailService";
import toast from "react-hot-toast";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/ui/Section";
import { Check, User, Mail, Lock, Eye, EyeOff, Phone, Globe, Shield, Zap, Users } from "lucide-react";
import countries from "world-countries";

// Registro limpio: Paso único (form) -> éxito con instrucciones de verificación.
export default function Register() {
// Custom CountryDropdown component
type Country = {
  code: string;
  callingCode: string;
  name: string;
  flag: string;
  currency: string;
};

interface CountryDropdownProps {
  countriesList: Country[];
  selectedCode: string;
  onSelect: (code: string) => void;
}

function CountryDropdown({ countriesList, selectedCode, onSelect }: CountryDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = countriesList.find((c: Country) => c.code === selectedCode);
  const filteredCountries = search.length > 0
    ? countriesList.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : countriesList;
  // Calcular el país con el nombre más largo
  const maxCountry = countriesList.reduce((a, b) => (a.name.length > b.name.length ? a : b));

  // Cerrar el menú solo si se hace clic fuera
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        className="flex items-center w-full justify-center bg-transparent py-2 rounded focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        style={{ minHeight: '44px', height: '44px' }}
      >
        <span style={{ fontSize: '1.7rem', marginRight: open ? 8 : 0 }}>{selected?.flag}</span>
        <span className="ml-1 text-sm" style={{ display: open ? 'inline' : 'none' }}>{open ? selected?.name : ''}</span>
        <svg className="ml-1 w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5.25 7.5L10 12.25L14.75 7.5" /></svg>
      </button>
      {open && (
        <div
          className="absolute left-1/2 bg-white border border-gray-300 rounded shadow-lg z-50 overflow-y-auto"
          style={{
            top: '50%',
            transform: 'translate(-50%, -50%)',
            minWidth: '180px',
            width: 'max-content',
            maxWidth: '240px',
            maxHeight: '940px',
            background: 'rgba(255,255,255,0.70)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar país..."
            className="w-full px-3 py-2 mb-2 border-b border-gray-200 bg-transparent outline-none text-base"
            autoFocus
          />
          {filteredCountries.length === 0 && (
            <div className="px-4 py-3 text-gray-400 text-center">No se encontró país</div>
          )}
          {filteredCountries.map(c => (
            <button
              key={c.code}
              type="button"
              className={`flex items-center w-full px-4 py-3 text-left hover:bg-blue-50 ${c.code === selectedCode ? 'bg-blue-100' : ''}`}
              style={{ minWidth: '220px', fontSize: '1rem' }}
              onClick={() => { onSelect(c.code); setOpen(false); setSearch(""); }}
            >
              <span style={{ fontSize: '1.3rem', marginRight: 14 }}>{c.flag}</span>
              <span className="text-base" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
  const router = useRouter();
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    countryCode: "CL",
    country: "Chile",
    currencyCode: "CLP"
  });
  const [valid, setValid] = useState({
    name: false,
    email: false,
    password: false,
    match: false,
    phone: false
  });
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const countriesList = countries
    .filter(c => c.idd && c.idd.suffixes && c.idd.suffixes.length > 0)
    .map(c => ({
      code: c.cca2,
      callingCode: `${c.idd.root}${c.idd.suffixes[0]}`,
      name: c.name.common,
      flag: c.flag,
      currency: c.currencies ? Object.keys(c.currencies)[0] : "USD"
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const isValidName = (name: string) => {
    const words = name.trim().split(/\s+/);
    return words.length >= 2 && words.every(w => w.length > 0);
  };
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Email availability check
  const checkEmailAvailability = async (email: string) => {
    setEmailStatus('checking');
    const { data, error } = await supabase
      .from('ws_users')
      .select('email')
      .eq('email', email.toLowerCase());
    if (error) {
      setEmailStatus('idle');
      return;
    }
    if (data && data.length > 0) {
      setEmailStatus('taken');
    } else {
      setEmailStatus('available');
    }
  };
  const fullPhone = () => {
    const callingCode = countriesList.find(c => c.code === formData.countryCode)?.callingCode || "+56";
    return callingCode.replace("+", "") + formData.phone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Object.values(valid).every(Boolean)) return;
    setLoading(true);
    try {
      // 1. SignUp
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase(),
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: fullPhone(),
            country: formData.country,
            countryCode: formData.countryCode,
            currencyCode: formData.currencyCode
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (signUpError) {
        if (signUpError.message?.includes("registered")) {
          toast.error("El email ya está registrado. Inicia sesión.");
        } else {
          toast.error("Error creando cuenta: " + signUpError.message);
        }
        return;
      }

      if (!signUpData.user) {
        toast.error("No se pudieron obtener datos del usuario");
        return;
      }

      const user = signUpData.user;

      // 2. Insert profile in ws_users (idempotente si accidentalmente se reenvía)
      const profile = {
        user_id: user.id,
        email: formData.email.toLowerCase(),
        name: formData.name,
        phone: fullPhone(),
        country_code: formData.countryCode,
        country: formData.country,
        currency_code: formData.currencyCode,
        role: "user",
        email_verified: false,
        app_id: "550e8400-e29b-41d4-a716-446655440000",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as const;

      const { error: profileError } = await supabase.from("ws_users").insert(profile);
      if (profileError && !profileError.message.includes("duplicate")) {
        toast.error("Error creando perfil: " + profileError.message);
        return;
      }

      // 3. Create verification token only if not exists
      const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const { error: verifError } = await supabase
        .from("ws_email_verifications")
        .insert({
          user_id: user.id,
          email: formData.email.toLowerCase(),
          verified: false,
          verification_token: token,
          created_at: new Date().toISOString()
        });
      if (verifError && !verifError.message.includes("duplicate")) {
        toast.error("Error preparando verificación: " + verifError.message);
        return;
      }

      // 4. Send verification email (best-effort)
      try {
        console.log('📧 Intentando enviar email de verificación a:', formData.email);
        console.log('🔑 Token generado:', token);
        const res = await sendVerificationEmail(formData.email, formData.name, token);
        console.log('📬 Resultado del envío:', res);
        if (res.success) {
          toast.success("Cuenta creada. Verifica tu correo.");
          console.log('✅ Email enviado exitosamente');
        } else {
          console.error('❌ Error al enviar email:', res.error);
          toast.error("Cuenta creada pero error enviando email: " + (res.error || "Error desconocido"));
        }
      } catch (emailError) {
        console.error('❌ Error inesperado enviando email:', emailError);
        toast.error("Cuenta creada pero error enviando email: " + (emailError instanceof Error ? emailError.message : "Error desconocido"));
      }

      setStep("success");
    } catch (err: any) {
      toast.error("Error inesperado: " + (err?.message || "Desconocido"));
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <PageLayout>
        <Section className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">¡Registro Exitoso!</h2>
            <p className="text-gray-700 mb-4">
              Hemos enviado un enlace de verificación a <strong>{formData.email}</strong>.<br />
              Debes verificar tu correo antes de iniciar sesión.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Si no lo ves en tu bandeja principal, revisa Spam o Promociones.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
              >Ir al Login</button>
            </div>
          </div>
        </Section>
      </PageLayout>
    );
  }
  return (
    <PageLayout>
      <Section className="py-6 sm:py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Register Form */}
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Crea tu Cuenta</h1>
                <p className="text-base sm:text-lg text-gray-600">Regístrate para comenzar a gestionar tu negocio.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-900 mb-1">Nombre completo</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => {
                          const val = e.target.value
                            .toLowerCase()
                            .split(" ")
                            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ");
                          setFormData({ ...formData, name: val });
                          setValid(v => ({ ...v, name: isValidName(val) }));
                        }}
                        className={`w-full pl-11 pr-3 py-3 rounded-lg border ${valid.name ? "border-green-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Tu nombre completo"
                      />
                      {valid.name && <Check className="h-4 w-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />}
                    </div>
                  </div>
                  {/* Email */}
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-900 mb-1">Correo Electrónico</label>
                    <div className="mt-1 relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={async (e) => {
                          const email = e.target.value.toLowerCase();
                          setFormData({ ...formData, email });
                          setValid(v => ({ ...v, email: isValidEmail(email) }));
                          if (isValidEmail(email)) {
                            await checkEmailAvailability(email);
                          } else {
                            setEmailStatus('idle');
                          }
                        }}
                        className={`appearance-none relative block w-full px-3 py-2 sm:py-3 pl-4 sm:pl-4 border ${emailStatus === 'taken' ? 'border-red-500' : valid.email ? 'border-green-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-sm sm:text-base`}
                        placeholder="correo@ejemplo.com"
                      />
                      {valid.email && emailStatus === 'available' && <Check className="h-4 w-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />}
                      {emailStatus === 'taken' && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-xs">Ocupado</span>
                      )}
                      {emailStatus === 'available' && (
                        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-green-500 text-xs">Disponible</span>
                      )}
                      {emailStatus === 'checking' && (
                        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-blue-500 text-xs">Verificando...</span>
                      )}
                    </div>
                  </div>
                  {/* Password */}
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-900 mb-1">Contraseña</label>
                    <div className="mt-1 relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={(e) => {
                          const pwd = e.target.value;
                          setFormData({ ...formData, password: pwd });
                          setValid(v => ({ ...v, password: pwd.length >= 6, match: pwd === formData.confirmPassword && pwd.length >= 6 }));
                        }}
                        className={`appearance-none relative block w-full px-3 py-2 sm:py-3 pl-4 sm:pl-4 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-sm sm:text-base ${valid.password ? "border-green-500" : "border-gray-300"}`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </button>
                      {valid.password && <Check className="h-4 w-4 text-green-500 absolute right-10 top-1/2 -translate-y-1/2" />}
                    </div>
                  </div>
                  {/* Confirm */}
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-900 mb-1">Confirmar contraseña</label>
                    <div className="mt-1 relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ ...formData, confirmPassword: val });
                          setValid(v => ({ ...v, match: val === formData.password && val.length >= 6 }));
                        }}
                        className={`appearance-none relative block w-full px-3 py-2 sm:py-3 pl-4 sm:pl-4 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-sm sm:text-base ${valid.match ? "border-green-500" : "border-gray-300"}`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </button>
                      {valid.match && <Check className="h-4 w-4 text-green-500 absolute right-10 top-1/2 -translate-y-1/2" />}
                    </div>
                  </div>
                  {/* Phone */}
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-900 mb-1">Teléfono</label>
                    <div className={`flex items-center border rounded-lg px-3 py-2 ${valid.phone ? "border-green-500" : "border-gray-300"} focus-within:ring-2 focus-within:ring-blue-500`}>
                      <Phone className="h-5 w-5 text-gray-400" />
              <div className="relative border-r border-gray-300 pr-1 mr-2 min-w-[70px] max-w-[90px]" style={{ height: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', padding: 0 }}>
                        <CountryDropdown
                          countriesList={countriesList}
                          selectedCode={formData.countryCode}
                          onSelect={(code) => {
                            const sel = countriesList.find(c => c.code === code);
                            setFormData(f => ({
                              ...f,
                              countryCode: code,
                              country: sel?.name || f.country,
                              currencyCode: sel?.currency || f.currencyCode,
                              phone: ""
                            }));
                            setValid(v => ({ ...v, phone: false }));
                          }}
                        />
                      </div>
                      {/* El div de cierre extra fue eliminado */}
                      <span className="text-gray-900 font-medium mr-2 text-sm">
                        {countriesList.find(c => c.code === formData.countryCode)?.callingCode || "+56"}
                      </span>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => {
                          const phone = e.target.value.replace(/\D/g, "");
                          setFormData({ ...formData, phone });
                          setValid(v => ({ ...v, phone: phone.length >= 8 }));
                        }}
                        placeholder="123456789"
                        className="flex-1 bg-transparent outline-none text-sm py-3"
                      />
                      {valid.phone && <Check className="h-4 w-4 text-green-500 ml-2" />}
                    </div>
                  </div>
                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || !Object.values(valid).every(Boolean)}
                    className="w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creando cuenta..." : "Crear Cuenta"}
                  </button>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      ¿Ya tienes una cuenta?{" "}
                      <button type="button" onClick={() => router.push("/login")} className="font-medium text-blue-600 hover:text-blue-700">Inicia sesión</button>
                    </p>
                  </div>
                </form>
              </div>
            </div>
            {/* Panel de Bienvenida / Beneficios */}
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">¿Por qué Ingenit?</h2>
                <p className="text-base sm:text-lg text-gray-600">Gestiona tu negocio de manera inteligente y eficiente con nuestras herramientas profesionales.</p>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Seguridad Garantizada</h3>
                    <p className="text-sm sm:text-base text-gray-600">Tus datos están protegidos con encriptación de nivel bancario.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Acceso Rápido</h3>
                    <p className="text-sm sm:text-base text-gray-600">Interfaz intuitiva y eficiente para una gestión ágil.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Soporte 24/7</h3>
                    <p className="text-sm sm:text-base text-gray-600">Nuestro equipo está disponible para ayudarte en cualquier momento.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </PageLayout>
  );
}