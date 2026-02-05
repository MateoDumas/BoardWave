import * as mediasoup from 'mediasoup';

// Configuración básica de Mediasoup
const mediaCodecs: mediasoup.types.RtpCodecCapability[] = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
    preferredPayloadType: 100
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000
    },
    preferredPayloadType: 101
  }
];

let worker: mediasoup.types.Worker;

export const initMediasoup = async () => {
  worker = await mediasoup.createWorker({
    logLevel: 'warn',
    rtcMinPort: Number(process.env.MEDIASOUP_MIN_PORT) || 2000,
    rtcMaxPort: Number(process.env.MEDIASOUP_MAX_PORT) || 2020,
  });

  worker.on('died', () => {
    console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
    setTimeout(() => process.exit(1), 2000);
  });

  console.log('Mediasoup Worker created [pid:%d]', worker.pid);
  return worker;
};

export const createRouter = async () => {
  if (!worker) throw new Error('Mediasoup worker not initialized');
  return await worker.createRouter({ mediaCodecs });
};

export const createWebRtcTransport = async (router: mediasoup.types.Router) => {
  const transport = await router.createWebRtcTransport({
    listenIps: [
      {
        ip: '0.0.0.0',
        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || process.env.FLY_PUBLIC_IP || '127.0.0.1' // Soporte automático para Fly.io
      }
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });

  return transport;
};
