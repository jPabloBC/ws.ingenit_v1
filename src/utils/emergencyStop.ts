// MODO DE EMERGENCIA - PREVENCIÓN ABSOLUTA DE BUCLES INFINITOS
const globalExecutionMap = new Map<string, boolean>();
let globalUserIdCache: string | null = null;
const DEBUG_EMERGENCY = process.env.NEXT_PUBLIC_DEBUG_EMERGENCY === 'true';

export const emergencyStopInfiniteLoops = {
  // Prevenir cualquier ejecución duplicada
  canExecute: (key: string, userId?: string | null): boolean => {
    const executionKey = `${key}-${userId}`;
    
    if (globalExecutionMap.has(executionKey)) {
      if (DEBUG_EMERGENCY) console.log(`🚫 EMERGENCIA: Previniendo ejecución duplicada de ${key} para user ${userId}`);
      return false;
    }
    
    globalExecutionMap.set(executionKey, true);
    return true;
  },
  
  // Limpiar cuando el usuario realmente cambie
  clearForNewUser: (newUserId: string | null) => {
    if (globalUserIdCache !== newUserId) {
      if (DEBUG_EMERGENCY) console.log(`🔄 EMERGENCIA: Usuario cambió de ${globalUserIdCache} a ${newUserId}, limpiando cache`);
      globalExecutionMap.clear();
      globalUserIdCache = newUserId;
    }
  },
  
  // Reiniciar completamente
  reset: () => {
    globalExecutionMap.clear();
    globalUserIdCache = null;
    if (DEBUG_EMERGENCY) console.log('🔄 EMERGENCIA: Cache global reiniciado');
  }
};