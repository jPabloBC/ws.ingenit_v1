'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Building, MapPin, FileText, Upload, AlertCircle, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
// Removido: import no usado
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { siiConfigService } from '@/services/supabase/sii';
import toast from 'react-hot-toast';
// Removido: import no usado
interface SiiConfigForm {
  rut_empresa: string;
  razon_social: string;
  giro_comercial: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  telefono: string;
  email: string;
  certificado_digital: string;
  password_certificado: string;
  ambiente_sii: 'certificacion' | 'produccion';
  folio_inicial: number;
}

export default function SiiSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SiiConfigForm>({
    rut_empresa: '',
    razon_social: '',
    giro_comercial: '',
    direccion: '',
    comuna: '',
    ciudad: '',
    telefono: '',
    email: '',
    certificado_digital: '',
    password_certificado: '',
    ambiente_sii: 'certificacion',
    folio_inicial: 1
  });

  useEffect(() => {
    if (user) {
      loadConfig();
    }
  }, [user?.id]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      // Cargar configuración desde la base de datos
      if (user) {
        const result = await siiConfigService.getConfig(user.id);
        if (result) {
          setConfig({
            rut_empresa: result.rut_empresa || '',
            razon_social: result.razon_social || '',
            giro_comercial: result.giro_comercial || '',
            direccion: result.direccion || '',
            comuna: result.comuna || '',
            ciudad: result.ciudad || '',
            telefono: result.telefono || '',
            email: result.email || '',
            certificado_digital: result.certificado_digital || '',
            password_certificado: result.password_certificado || '',
            ambiente_sii: result.ambiente_sii || 'certificacion',
            folio_inicial: result.folio_inicial || 1
          });
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };






























  const handleInputChange = (field: keyof SiiConfigForm, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      
      const requiredFields = ['rut_empresa', 'razon_social', 'giro_comercial', 'direccion', 'comuna', 'ciudad'];
      const missingFields = requiredFields.filter(field => !config[field as keyof SiiConfigForm]);
      
      if (missingFields.length > 0) {
        toast.error(`Campos requeridos: ${missingFields.join(', ')}`);
        return;
      }

      const result = await siiConfigService.upsertConfig(config);
      
      if (result) {
        toast.success('Configuración SII guardada exitosamente');
      } else {
        toast.error('Error al guardar la configuración');
      }
    } catch (error: any) {
      console.error('Error saving SII config:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        handleInputChange('certificado_digital', content);
      };
      reader.readAsText(file);
    }
  };

  const validateRut = (rut: string) => {
    const rutClean = rut.replace(/[.-]/g, '');
    if (rutClean.length < 2) return false;
    
    const dv = rutClean.slice(-1).toUpperCase();
    const rutNumber = rutClean.slice(0, -1);
    
    if (!/^\d+$/.test(rutNumber)) return false;
    
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = rutNumber.length - 1; i >= 0; i--) {
      suma += parseInt(rutNumber[i]) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const dvCalculado = 11 - (suma % 11);
    const dvEsperado = dvCalculado === 11 ? '0' : dvCalculado === 10 ? 'K' : dvCalculado.toString();
    
    return dv === dvEsperado;
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/settings')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración SII</h1>
            <p className="text-gray-600">Configura los datos de tu empresa para emisión de boletas electrónicas</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información de la Empresa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Información de la Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RUT de la Empresa *
                    </label>
                    <input
                      type="text"
                      value={config.rut_empresa}
                      onChange={(e) => handleInputChange('rut_empresa', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        config.rut_empresa && !validateRut(config.rut_empresa) 
                          ? 'border-red-500' 
                          : 'border-gray-300'
                      }`}
                      placeholder="12.345.678-9"
                    />
                    {config.rut_empresa && !validateRut(config.rut_empresa) && (
                      <p className="text-sm text-red-600 mt-1">RUT no válido</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Razón Social *
                    </label>
                    <input
                      type="text"
                      value={config.razon_social}
                      onChange={(e) => handleInputChange('razon_social', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre de la empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giro Comercial *
                    </label>
                    <input
                      type="text"
                      value={config.giro_comercial}
                      onChange={(e) => handleInputChange('giro_comercial', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Actividad económica"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Dirección */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Dirección
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      value={config.direccion}
                      onChange={(e) => handleInputChange('direccion', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Calle y número"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comuna *
                      </label>
                      <input
                        type="text"
                        value={config.comuna}
                        onChange={(e) => handleInputChange('comuna', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Comuna"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        value={config.ciudad}
                        onChange={(e) => handleInputChange('ciudad', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ciudad"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={config.telefono}
                        onChange={(e) => handleInputChange('telefono', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+56 9 1234 5678"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={config.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="empresa@ejemplo.cl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configuración SII */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Configuración SII
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ambiente SII
                    </label>
                    <select
                      value={config.ambiente_sii}
                      onChange={(e) => handleInputChange('ambiente_sii', e.target.value as 'certificacion' | 'produccion')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="certificacion">Certificación (Pruebas)</option>
                      <option value="produccion">Producción (Real)</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      {config.ambiente_sii === 'certificacion' 
                        ? 'Para pruebas y desarrollo' 
                        : 'Para emisión real de boletas'
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Folio Inicial
                    </label>
                    <input
                      type="number"
                      value={config.folio_inicial}
                      onChange={(e) => handleInputChange('folio_inicial', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Número desde el cual comenzarán las boletas
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Certificado Digital */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Certificado Digital
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Archivo del Certificado (.p12)
                    </label>
                    <input
                      type="file"
                      accept=".p12"
                      onChange={handleCertificateUpload}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Certificado digital emitido por el SII
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña del Certificado
                    </label>
                    <input
                      type="password"
                      value={config.password_certificado}
                      onChange={(e) => handleInputChange('password_certificado', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Contraseña del certificado"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-800">Información Importante</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          El certificado digital es necesario para firmar electrónicamente las boletas. 
                          Debes solicitarlo en el SII antes de poder emitir boletas en producción.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Botones de Acción */}
            <div className="mt-6 flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/settings')}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <LoadingSpinner />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Configuración
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
