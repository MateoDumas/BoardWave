export const getBackendUrl = (type: 'http' | 'ws' = 'http'): string => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const backendParam = params.get('backend');
    
    if (backendParam) {
      // Remove trailing slash if present
      const cleanUrl = backendParam.replace(/\/$/, '');
      localStorage.setItem('boardwave_backend_url', cleanUrl);
      url = cleanUrl;
    } else {
      const storedUrl = localStorage.getItem('boardwave_backend_url');
      if (storedUrl) {
        url = storedUrl;
      }
    }
  }

  if (type === 'ws') {
    return url.replace(/^http/, 'ws').replace(/^https/, 'wss');
  }
  
  return url;
};
