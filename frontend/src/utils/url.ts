export const getBackendUrl = (type: 'http' | 'ws' = 'http'): string => {
  // FORCE AWS IP for debugging
  const AWS_IP = 'http://18.118.47.248:3000';
  
  if (type === 'ws') {
    return AWS_IP.replace(/^http/, 'ws').replace(/^https/, 'wss');
  }
  
  console.log('🔗 BoardWave Backend URL:', AWS_IP);
  return AWS_IP;
};
