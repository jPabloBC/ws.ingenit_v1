"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabase/client";
import { sendVerificationEmail } from "@/services/emailService";
import toast from "react-hot-toast";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/ui/Section";
import { Check, User, Mail, Lock, Phone, Globe } from "lucide-react";
import countries from "world-countries";

// Registro limpio: Paso único (form) -> éxito con instrucciones de verificación.
export default function Register() {
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
        <Section className="py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">¡Registro Exitoso!</h2>
            <p className="text-gray-700 mb-4">
              Hemos enviado un enlace de verificación a <strong>{formData.email}</strong>.
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
      <Section className="py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Crea tu Cuenta</h1>
              <p className="text-gray-600">Regístrate para comenzar a gestionar tu negocio.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Nombre completo</label>
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
                  <label className="block text-sm font-medium text-gray-900 mb-1">Correo electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        const email = e.target.value.toLowerCase();
                        setFormData({ ...formData, email });
                        setValid(v => ({ ...v, email: isValidEmail(email) }));
                      }}
                      className={`w-full pl-11 pr-3 py-3 rounded-lg border ${valid.email ? "border-green-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="correo@ejemplo.com"
                    />
                    {valid.email && <Check className="h-4 w-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />}
                  </div>
                </div>
                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => {
                        const pwd = e.target.value;
                        setFormData({ ...formData, password: pwd });
                        setValid(v => ({ ...v, password: pwd.length >= 6, match: pwd === formData.confirmPassword && pwd.length >= 6 }));
                      }}
                      className={`w-full pl-11 pr-3 py-3 rounded-lg border ${valid.password ? "border-green-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="••••••••"
                    />
                    {valid.password && <Check className="h-4 w-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />}
                  </div>
                </div>
                {/* Confirm */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Confirmar contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, confirmPassword: val });
                        setValid(v => ({ ...v, match: val === formData.password && val.length >= 6 }));
                      }}
                      className={`w-full pl-11 pr-3 py-3 rounded-lg border ${valid.match ? "border-green-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="••••••••"
                    />
                    {valid.match && <Check className="h-4 w-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />}
                  </div>
                </div>
                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Teléfono</label>
                  <div className={`flex items-center border rounded-lg px-3 py-2 ${valid.phone ? "border-green-500" : "border-gray-300"} focus-within:ring-2 focus-within:ring-blue-500`}>                    
                    <Phone className="h-5 w-5 text-gray-400 mr-2" />
                    <div className="relative flex items-center border-r border-gray-300 pr-3 mr-3">
                      <select
                        value={formData.countryCode}
                        onChange={(e) => {
                          const sel = countriesList.find(c => c.code === e.target.value);
                          setFormData(f => ({
                            ...f,
                            countryCode: e.target.value,
                            country: sel?.name || f.country,
                            currencyCode: sel?.currency || f.currencyCode,
                            phone: ""
                          }));
                          setValid(v => ({ ...v, phone: false }));
                        }}
                        className="appearance-none bg-transparent text-sm cursor-pointer focus:outline-none"
                      >
                        {countriesList.map(c => (
                          <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                        ))}
                      </select>
                    </div>
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
                      className="flex-1 bg-transparent outline-none text-sm"
                    />
                    {valid.phone && <Check className="h-4 w-4 text-green-500 ml-2" />}
                  </div>
                </div>
                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !Object.values(valid).every(Boolean)}
                  className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                >
                  {loading ? "Creando cuenta..." : "Crear Cuenta"}
                </button>
                <p className="text-sm text-gray-600 text-center">
                  ¿Ya tienes una cuenta? {" "}
                  <button type="button" onClick={() => router.push("/login")} className="text-blue-600 hover:underline">Inicia sesión</button>
                </p>
              </form>
            </div>
          </div>
          {/* Beneficios */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">¿Por qué Ingenit?</h2>
            <ul className="space-y-4 text-gray-700 text-sm">
              <li className="flex items-start gap-3"><Check className="h-5 w-5 text-blue-600 mt-0.5" /> Seguridad y cifrado.</li>
              <li className="flex items-start gap-3"><Check className="h-5 w-5 text-blue-600 mt-0.5" /> Configuración en minutos.</li>
              <li className="flex items-start gap-3"><Check className="h-5 w-5 text-blue-600 mt-0.5" /> Herramientas avanzadas para tu negocio.</li>
              <li className="flex items-start gap-3"><Check className="h-5 w-5 text-blue-600 mt-0.5" /> Soporte dedicado.</li>
            </ul>
          </div>
        </div>
      </Section>
    </PageLayout>
  );
}