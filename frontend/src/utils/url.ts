export const getBackendUrl = (type: 'http' | 'ws' = 'http'): string => {
  const AWS_IP = import.meta.env.VITE_API_URL || 'https://18.118.47.248.sslip.io'; // HTTPS Automático con sslip.io
  
  if (type === 'ws') {
    return AWS_IP.replace(/^http/, 'ws').replace(/^https/, 'wss');
  }
  
  console.log('🔗 BoardWave Backend URL:', AWS_IP);
  return AWS_IP;
};
