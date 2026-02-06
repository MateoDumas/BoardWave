export const getBackendUrl = (type: 'http' | 'ws' = 'http'): string => {
  const AWS_IP = import.meta.env.VITE_BACKEND_URL || 'https://3.14.67.217.sslip.io';
  
  if (type === 'ws') {
    return AWS_IP.replace(/^https?/, (match: string) => match === 'https' ? 'wss' : 'ws');
  }
  return AWS_IP;
};
