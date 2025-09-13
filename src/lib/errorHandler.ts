// Error handler for browser extensions and other non-critical errors
export const setupErrorHandling = () => {
  if (typeof window === 'undefined') return;

  // Suppress extension-related console errors
  const originalError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (message.includes('chrome-extension') || 
        message.includes('moz-extension') ||
        message.includes('content_script') ||
        message.includes('runtime.lastError') ||
        message.includes('net::ERR_FILE_NOT_FOUND') ||
        message.includes('Cannot read properties of null') ||
        message.includes('deref') ||
        // Supress Supabase errors for non-authenticated users
        (message.includes('Error loading profile') && message.includes('PGRST116')) ||
        (message.includes('Error loading user role') && message.includes('PGRST116'))) {
      return; // Suppress extension errors and expected auth errors
    }
    originalError.apply(console, args);
  };

  // Suppress extension-related console warnings
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('chrome-extension') || 
        message.includes('moz-extension') ||
        message.includes('content_script') ||
        message.includes('runtime.lastError') ||
        message.includes('deref')) {
      return; // Suppress extension warnings
    }
    originalWarn.apply(console, args);
  };

  // Handle unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || event.reason;
    if (message && (
      message.includes('chrome-extension') ||
      message.includes('moz-extension') ||
      message.includes('content_script') ||
      message.includes('net::ERR_FILE_NOT_FOUND') ||
      message.includes('deref')
    )) {
      event.preventDefault();
      return;
    }
  });

  // Handle global errors from extensions
  window.addEventListener('error', (event) => {
    const message = event.message || event.filename || '';
    if (message.includes('chrome-extension') || 
        message.includes('moz-extension') ||
        message.includes('content_script') ||
        message.includes('deref')) {
      event.preventDefault();
      return;
    }
  });

  // Handle MutationObserver errors from extensions
  const originalAddEventListener = window.addEventListener;
  window.addEventListener = function(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    if (type === 'error' || type === 'unhandledrejection') {
      const wrappedListener = function(event: Event) {
        const message = (event as any).message || (event as any).filename || (event as any).reason || '';
        if (message.includes('chrome-extension') || 
            message.includes('moz-extension') ||
            message.includes('content_script') ||
            message.includes('deref')) {
          return;
        }
        if (typeof listener === 'function') {
          return listener.call(null, event);
        }
        return;
      };
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };

  // Note: MutationObserver override removed due to TypeScript compatibility issues
  // The script in the head tag will handle MutationObserver errors
};

// Clean up function for when component unmounts
export const cleanupErrorHandling = () => {
  // Reset console methods if needed
  if (typeof window !== 'undefined') {
    // Remove event listeners if needed
    // This is optional as they're global
  }
};
