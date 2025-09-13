export interface CompanyInfo {
  rut: string;
  razon_social: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  telefono?: string;
  email?: string;
  giro?: string;
}

export const getCompanyInfo = async (): Promise<CompanyInfo> => {
  try {
    // Por ahora, devolver datos por defecto
    // En el futuro, esto podría venir de una tabla ws_company_info
    return {
      rut: '76.123.456-7',
      razon_social: 'Mi Empresa Ltda.',
      direccion: 'Av. Principal 123',
      comuna: 'Santiago',
      ciudad: 'Santiago',
      telefono: '+56 2 2345 6789',
      email: 'contacto@miempresa.cl',
      giro: 'Comercio al por menor'
    };
  } catch (error) {
    console.error('Error getting company info:', error);
    // Datos por defecto en caso de error
    return {
      rut: '76.123.456-7',
      razon_social: 'Mi Empresa Ltda.',
      direccion: 'Av. Principal 123',
      comuna: 'Santiago',
      ciudad: 'Santiago'
    };
  }
};
