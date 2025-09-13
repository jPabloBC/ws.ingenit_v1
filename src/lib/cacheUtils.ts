// Utilidades para manejar caché y recargas
export const clearPageCache = () => {
  // Limpiar localStorage si es necesario
  const keysToKeep = ['user', 'storeConfig', 'cart'];
  const keysToRemove = Object.keys(localStorage).filter(key => 
    !keysToKeep.includes(key) && key.startsWith('supabase')
  );
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('Caché limpiado, claves removidas:', keysToRemove);
};

export const forceReload = () => {
  // Limpiar caché
  clearPageCache();
  
  // Forzar recarga sin caché
  window.location.reload();
};

export const reloadWithCacheBuster = () => {
  // Agregar timestamp para evitar caché
  const timestamp = Date.now();
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('_t', timestamp.toString());
  
  window.location.href = currentUrl.toString();
};
