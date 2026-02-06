export const getBackendUrl = (type: 'http' | 'ws' = 'http'): string => {
  // FORCE AWS IP for debugging
  const AWS_IP = 'https://3.14.67.217.sslip.io';
  
  if (type === 'ws') {
    return AWS_IP.replace(/^https?/, (match) => match === 'https' ? 'wss' : 'ws');
  }
  return AWS_IP;
};
