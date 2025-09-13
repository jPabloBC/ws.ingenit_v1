// Configuración de Transbank para múltiples comercios
// Removido: variables no usadas

export interface TransbankTransaction {
  amount: number;
  buyOrder: string;
  sessionId: string;
  returnUrl: string;
}

export interface TransbankCommitResponse {
  vci: string;
  amount: number;
  status: string;
  buyOrder: string;
  sessionId: string;
  cardDetail: {
    cardNumber: string;
  };
  accountingDate: string;
  transactionDate: string;
  authorizationCode: string;
  paymentTypeCode: string;
  responseCode: number;
  installmentsNumber: number;
}

export class TransbankService {
  /**
   * Crear una nueva transacción de WebPay Plus (SIMULADO)
   */
  static async createTransaction(
    amount: number,
    buyOrder: string,
    sessionId: string,
    returnUrl: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('Creando transacción Transbank (SIMULADO):', {
        amount,
        buyOrder,
        sessionId,
        returnUrl
      });

      // Simulación para desarrollo - NO redirige a URL externa
      const mockResponse = {
        token: `TOKEN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: returnUrl // Usar la URL de retorno en lugar de Transbank
      };

      console.log('Respuesta de creación Transbank (SIMULADO):', mockResponse);

      return {
        success: true,
        data: mockResponse
      };
    } catch (error: any) {
      console.error('Error creando transacción Transbank:', error);
      return {
        success: false,
        error: error.message || 'Error al crear transacción'
      };
    }
  }

  /**
   * Confirmar una transacción de WebPay Plus (SIMULADO)
   */
  static async commitTransaction(
    token: string
  ): Promise<{ success: boolean; data?: TransbankCommitResponse; error?: string }> {
    try {
      console.log('Confirmando transacción Transbank (SIMULADO) con token:', token);

      // Simulación para desarrollo - siempre exitosa
      const mockResponse: TransbankCommitResponse = {
        vci: 'TSY',
        amount: 1000,
        status: 'AUTHORIZED',
        buyOrder: `ORDER_${Date.now()}`,
        sessionId: `SESSION_${Date.now()}`,
        cardDetail: {
          cardNumber: 'XXXX-XXXX-XXXX-1234'
        },
        accountingDate: new Date().toISOString(),
        transactionDate: new Date().toISOString(),
        authorizationCode: `AUTH_${Date.now()}`,
        paymentTypeCode: 'VD',
        responseCode: 0,
        installmentsNumber: 0
      };

      console.log('Respuesta de confirmación Transbank (SIMULADO):', mockResponse);

      return {
        success: true,
        data: mockResponse
      };
    } catch (error: any) {
      console.error('Error confirmando transacción Transbank:', error);
      return {
        success: false,
        error: error.message || 'Error al confirmar transacción'
      };
    }
  }

  /**
   * Obtener el estado de una transacción (SIMULADO)
   */
  static async getTransactionStatus(
    token: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('Consultando estado de transacción Transbank (SIMULADO):', token);

      // Simulación para desarrollo
      const mockStatus = {
        status: 'AUTHORIZED',
        responseCode: 0
      };

      console.log('Estado de transacción Transbank (SIMULADO):', mockStatus);

      return {
        success: true,
        data: mockStatus
      };
    } catch (error: any) {
      console.error('Error consultando estado de transacción Transbank:', error);
      return {
        success: false,
        error: error.message || 'Error al consultar estado'
      };
    }
  }

  /**
   * Generar un buyOrder único
   */
  static generateBuyOrder(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORDER_${timestamp}_${random}`;
  }

  /**
   * Generar un sessionId único
   */
  static generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `SESSION_${timestamp}_${random}`;
  }

  /**
   * Verificar si una transacción fue exitosa
   */
  static isTransactionSuccessful(response: TransbankCommitResponse): boolean {
    return response.status === 'AUTHORIZED' && response.responseCode === 0;
  }

  /**
   * Obtener mensaje de error basado en el código de respuesta
   */
  static getErrorMessage(responseCode: number): string {
    const errorMessages: { [key: string]: string } = {
      '0': 'Transacción aprobada',
      '-1': 'Rechazo de transacción',
      '-2': 'Transacción debe reintentarse',
      '-3': 'Error en transacción',
      '-4': 'Rechazo de transacción',
      '-5': 'Rechazo por error de tasa',
      '-6': 'Excede cupo máximo mensual',
      '-7': 'Excede límite diario por transacción',
      '-8': 'Rubro no autorizado',
      '-97': 'Límite de transacciones excedido',
      '-98': 'Error en comunicación con Transbank',
      '-99': 'Error interno de Transbank'
    };

    return errorMessages[responseCode.toString()] || `Error desconocido (código: ${responseCode})`;
  }
}

export default TransbankService;
