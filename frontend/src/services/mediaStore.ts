import { create } from 'zustand';
import * as mediasoupClient from 'mediasoup-client';
import { Socket } from 'socket.io-client';

interface MediaState {
  device: mediasoupClient.types.Device | null;
  producerTransport: mediasoupClient.types.Transport | null;
  consumerTransport: mediasoupClient.types.Transport | null;
  producers: Map<string, mediasoupClient.types.Producer>;
  consumers: Map<string, mediasoupClient.types.Consumer>;
  localStream: MediaStream | null;
  localScreenStream: MediaStream | null;
  
  initDevice: (socket: Socket, roomId: string) => Promise<void>;
  produce: (type: 'audio' | 'video' | 'screen') => Promise<void>;
  consume: (socket: Socket, roomId: string, producerId: string, socketId: string) => Promise<void>;
  toggleProducer: (type: 'audio' | 'video' | 'screen') => void;
  close: () => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  device: null,
  producerTransport: null,
  consumerTransport: null,
  producers: new Map(),
  consumers: new Map(),
  localStream: null,
  localScreenStream: null,

  initDevice: async (socket: Socket, roomId: string) => {
    if (get().device) return;

    // 1. Get Capabilities
    const { rtpCapabilities } = await new Promise<any>((resolve) => {
      socket.emit('getRouterRtpCapabilities', { roomId }, resolve);
    });

    if (!rtpCapabilities) {
        console.error('No rtpCapabilities');
        return;
    }

    // 2. Load Device
    const device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });

    set({ device });

    // 3. Create Transports
    // Send Transport
    const sendParams = await new Promise<any>((resolve) => {
      socket.emit('createWebRtcTransport', { roomId }, resolve);
    });
    
    if (sendParams.error) {
        console.error(sendParams.error);
        return;
    }

    const producerTransport = device.createSendTransport(sendParams.params);
    
    producerTransport.on('connect', ({ dtlsParameters }, callback) => {
      socket.emit('connectTransport', { 
        transportId: producerTransport.id, 
        dtlsParameters 
      }, () => callback());
    });

    producerTransport.on('produce', ({ kind, rtpParameters, appData }, callback) => {
      socket.emit('produce', { 
        transportId: producerTransport.id, 
        kind, 
        rtpParameters, 
        appData 
      }, ({ id }: { id: string }) => callback({ id }));
    });

    // Recv Transport
    const recvParams = await new Promise<any>((resolve) => {
        socket.emit('createWebRtcTransport', { roomId }, resolve);
    });

    if (recvParams.error) {
        console.error(recvParams.error);
        return;
    }

    const consumerTransport = device.createRecvTransport(recvParams.params);

    consumerTransport.on('connect', ({ dtlsParameters }, callback) => {
        socket.emit('connectTransport', { 
          transportId: consumerTransport.id, 
          dtlsParameters 
        }, () => callback());
    });

    set({ producerTransport, consumerTransport });
  },

  produce: async (type: 'audio' | 'video' | 'screen') => {
    const { device, producerTransport, producers, localStream } = get();
    if (!device || !producerTransport) return;

    try {
      let stream: MediaStream | null = null;
      let track: MediaStreamTrack;

      if (type === 'screen') {
        try {
            stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            track = stream.getVideoTracks()[0];
            set({ localScreenStream: stream });
        } catch (err) {
            console.error('Screen share cancelled', err);
            return;
        }
      } else {
          stream = localStream;
          if (!stream) {
            stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: true 
            });
            set({ localStream: stream });
          }
          track = type === 'video' ? stream.getVideoTracks()[0] : stream.getAudioTracks()[0];
      }

      const params = { 
          track,
          appData: { source: type === 'screen' ? 'screen' : (type === 'video' ? 'webcam' : 'mic') }
      };

      const producer = await producerTransport.produce(params);
      
      const newProducers = new Map(producers);
      newProducers.set(type, producer);
      set({ producers: newProducers });

      if (type === 'screen') {
          track.onended = () => {
              producer.close();
              const currentProducers = new Map(get().producers);
              currentProducers.delete('screen');
              set({ producers: currentProducers, localScreenStream: null });
          };
      }

    } catch (err) {
      console.error('Produce error:', err);
    }
  },

  consume: async (socket: Socket, roomId: string, producerId: string, socketId: string) => {
    const { device, consumerTransport, consumers } = get();
    if (!device || !consumerTransport) return;

    const { rtpCapabilities } = device;

    // Pedir al server que cree un consumidor
    const data = await new Promise<any>((resolve) => {
        // Enviar transportId para que el server sepa dónde conectar
        socket.emit('consume-transport', { 
            roomId,
            transportId: consumerTransport.id,
            producerId, 
            rtpCapabilities 
        }, resolve);
    });

    if (data.error) {
        console.error('Consume error:', data.error);
        return;
    }

    const { params } = data;
    const consumer = await consumerTransport.consume({
        id: params.id,
        producerId: params.producerId,
        kind: params.kind,
        rtpParameters: params.rtpParameters,
        appData: { ...params.appData, peerId: socketId }, // Store peerId for mapping
    });

    // Resume consumer on server (optional if handled by server immediately, but explicit is safer)
    // En server.ts ya hacemos resume()

    const newConsumers = new Map(consumers);
    // Usamos producerId o socketId como key? Mejor un ID único combinando
    newConsumers.set(producerId, consumer); 
    set({ consumers: newConsumers });
  },

  toggleProducer: (type: 'audio' | 'video' | 'screen') => {
    const { producers } = get();
    const producer = producers.get(type);
    if (producer) {
        if (producer.paused) {
            producer.resume();
        } else {
            producer.pause();
        }
        // Force update? Producer state changes internally, but we might need to trigger UI update.
        // Zustand shallowly compares, so maybe set new map
        set({ producers: new Map(producers) });
    }
  },

  close: () => {
    const { producerTransport, consumerTransport, localStream } = get();
    producerTransport?.close();
    consumerTransport?.close();
    localStream?.getTracks().forEach(t => t.stop());
    set({ 
        device: null, 
        producerTransport: null, 
        consumerTransport: null, 
        producers: new Map(), 
        consumers: new Map(),
        localStream: null
    });
  }
}));
