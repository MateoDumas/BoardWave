import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocketStore } from '../services/socketStore';
import { useMediaStore } from '../services/mediaStore';
import { useAuthStore } from '../services/authStore';
import { Avatar } from '../components/Avatar';
import VideoPlayer from '../components/VideoPlayer';
import Whiteboard from '../components/Whiteboard';
import { soundService } from '../services/sound';
import { 
  Mic, MicOff, Video, VideoOff, MonitorUp, 
  Users, PhoneOff, Grid3x3, Presentation, Monitor, 
  MessageSquare, Paperclip, FileText, Layout,
  Link as LinkIcon, Check, Send
} from 'lucide-react';

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { connect, joinRoom, peers, isConnected, socket, disconnect: disconnectSocket, messages, sendMessage } = useSocketStore();
  const { initDevice, produce, consume, localStream, localScreenStream, consumers, producers, close: closeMedia, toggleProducer } = useMediaStore();
  const { user } = useAuthStore();
  const username = user?.username || `Guest-${Math.floor(Math.random() * 1000)}`;
  const userColor = user?.color;
  const [hasChosenMode, setHasChosenMode] = useState(!!user);
  const [joined, setJoined] = useState(false);
  const [activeTab, setActiveTab] = useState<'participants' | 'chat'>('participants');
  const [viewMode, setViewMode] = useState<'grid' | 'whiteboard' | 'screen'>('grid');
  const [showSidebar, setShowSidebar] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevPeersLength = useRef(0);

  const screenConsumer = Array.from(consumers.values()).find(c => c.appData.source === 'screen');
  const activeScreenShare = localScreenStream 
      ? { stream: localScreenStream, username: 'Tú' } 
      : (screenConsumer ? { track: screenConsumer.track, username: 'Presentador' } : null);

  const hostId = peers.find(p => p.isHost)?.socketId || peers[0]?.socketId;
  const isHost = hostId && socket?.id ? hostId === socket.id : false;

  const handleCopyInvite = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (activeScreenShare) {
        setViewMode('screen');
    }
  }, [!!activeScreenShare]);

  useEffect(() => {
    if (peers.length > prevPeersLength.current) {
      soundService.playJoin();
    } else if (peers.length < prevPeersLength.current) {
      if (isConnected) {
        soundService.playLeave();
      }
    }
    prevPeersLength.current = peers.length;
  }, [peers.length, isConnected]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  useEffect(() => {
    if (hasChosenMode) {
      connect();
    }
  }, [connect, hasChosenMode]);

  useEffect(() => {
    if (isConnected && roomId && !joined) {
      joinRoom(roomId, username, userColor).then(() => {
        setJoined(true);
        // Inicializar Mediasoup
        if (socket) {
          initDevice(socket, roomId).then(() => {
             // Auto-producir video/audio al entrar (opcional, mejor con botón)
             // produce('video');
             // produce('audio');
          });

          // Escuchar nuevos producers
          socket.on('new-producer', ({ producerId, socketId }) => {
            console.log('New producer', producerId);
            consume(socket, roomId, producerId, socketId);
          });
        }
      });
    }
  }, [isConnected, roomId, joinRoom, username, joined, socket, initDevice, consume]);

  const handleToggleVideo = () => {
    if (producers.has('video')) {
       toggleProducer('video');
    } else {
       produce('video');
    }
  };

  const handleToggleAudio = () => {
    if (producers.has('audio')) {
       toggleProducer('audio');
    } else {
       produce('audio');
    }
  };

  const handleLeaveRoom = () => {
    soundService.playLeave();
    closeMedia();
    disconnectSocket();
    navigate('/');
  };

  const handleToggleScreen = () => {
    if (localScreenStream) {
        localScreenStream.getTracks().forEach(t => t.stop());
        // El evento onended en mediaStore limpiará el estado
    } else {
        produce('screen');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && roomId) {
        sendMessage(roomId, messageInput, username, userColor);
        setMessageInput('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && roomId) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('El archivo es demasiado grande (max 5MB)');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        sendMessage(roomId, '', username, userColor, {
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64
        });
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!roomId) return <div>Error: No Room ID</div>;

  if (!hasChosenMode) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#202124] text-gray-900 dark:text-white relative overflow-hidden transition-colors duration-500">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 animate-blob" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
        </div>

        <div className="z-10 bg-white/60 dark:bg-dark-surface/60 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/20 dark:border-white/10 max-w-md w-full mx-4 text-center">
          <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Bienvenido a BoardWave</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Estás a punto de unirte a la sala <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-sm">{roomId}</span>
          </p>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/register')}
              className="w-full py-3 px-4 bg-primary hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Users size={20} />
              Crear cuenta para unirme
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/0 dark:bg-dark-surface/0 text-gray-500 backdrop-blur-sm">o</span>
              </div>
            </div>

            <button
              onClick={() => setHasChosenMode(true)}
              className="w-full py-3 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              Continuar como invitado
            </button>
          </div>
          
          <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
            Como invitado, se te asignará un nombre aleatorio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#202124] text-gray-900 dark:text-white overflow-hidden relative transition-colors duration-500">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
      </div>

      {/* Navbar Glass */}
      <div className="h-14 md:h-16 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-white/20 dark:border-white/10 flex items-center px-4 md:px-6 justify-between z-30 shadow-sm relative shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <h1 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            <span className="hidden md:inline">BoardWave</span>
            <span className="md:hidden">BW</span>
          </h1>
          <span className="px-2 md:px-3 py-1 bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-full text-xs md:text-sm font-medium border border-gray-200/50 dark:border-gray-600/50 truncate max-w-[100px] md:max-w-none">
            <span className="hidden md:inline">Sala: </span>{roomId}
          </span>
          
          {isHost && (
            <button 
              onClick={handleCopyInvite}
              className="flex items-center gap-2 px-2 md:px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs md:text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors border border-blue-200/50 dark:border-blue-800/30"
              title="Copiar enlace de invitación"
            >
              {copied ? <Check size={14} /> : <LinkIcon size={14} />}
              <span className="hidden sm:inline">{copied ? 'Copiado' : 'Invitar'}</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="text-xs md:text-sm text-secondary dark:text-gray-400 flex items-center gap-2">
            <span className="hidden sm:inline">Tú:</span>
            <span className="font-semibold text-gray-900 dark:text-white max-w-[80px] truncate">{username}</span>
            {isHost && <span className="text-[10px] md:text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 px-1.5 md:px-2 py-0.5 rounded-full border border-yellow-200/50 dark:border-yellow-800/30">Host</span>}
          </div>
          <div className="flex items-center gap-2 px-2 md:px-3 py-1 bg-green-50/80 dark:bg-green-900/20 text-success rounded-full text-xs md:text-sm backdrop-blur-sm border border-green-100/50 dark:border-green-800/30">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="hidden md:inline">{peers.length + 1} Conectados</span>
            <span className="md:hidden">{peers.length + 1}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 flex flex-col-reverse md:flex-row overflow-hidden z-20 relative">
        {/* Left Sidebar Controls Glass (Bottom on mobile) */}
        <div className="w-full md:w-20 h-16 md:h-full bg-white/60 dark:bg-dark-surface/60 backdrop-blur-md border-t md:border-t-0 md:border-r border-white/20 dark:border-white/10 flex flex-row md:flex-col items-center justify-evenly md:justify-start py-2 md:py-6 gap-2 md:gap-6 z-20 shadow-lg transition-all shrink-0">
             <button 
                onClick={handleToggleAudio}
                title="Alternar Audio"
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-200 ${producers.get('audio')?.paused ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600' : (producers.has('audio') ? 'bg-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600')}`}>
                {producers.has('audio') && !producers.get('audio')?.paused ? <Mic size={18} /> : <MicOff size={18} />}
             </button>
             <button 
                onClick={handleToggleVideo}
                title="Alternar Video"
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-200 ${producers.get('video')?.paused ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600' : (producers.has('video') ? 'bg-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600')}`}>
                {producers.has('video') && !producers.get('video')?.paused ? <Video size={18} /> : <VideoOff size={18} />}
             </button>
             <button 
                onClick={handleToggleScreen}
                title="Compartir Pantalla"
                className={`hidden md:flex w-12 h-12 rounded-full items-center justify-center transition-all duration-200 ${localScreenStream ? 'bg-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                <MonitorUp size={18} />
             </button>
             
             <div className="w-[1px] h-6 md:w-8 md:h-[1px] bg-gray-200 dark:bg-gray-700 my-0 md:my-2"></div>

             <button 
                onClick={() => setShowSidebar(!showSidebar)}
                title={showSidebar ? "Ocultar Panel" : "Mostrar Panel"}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-200 ${showSidebar ? 'bg-blue-50 text-primary dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                <Layout size={18} />
             </button>

             <div className="flex-1 hidden md:block"></div>

             <button 
                onClick={handleLeaveRoom}
                title="Salir de la Sala"
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-danger text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-md md:mb-4">
                <PhoneOff size={18} />
             </button>
        </div>

        {/* Pizarra / Screen Share Area */}
        <div className="flex-1 bg-transparent p-2 md:p-4 flex flex-col relative overflow-hidden">
           {/* View Mode Tabs (if screen share active) */}
           <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 flex gap-2">
             <button 
               onClick={() => setViewMode('grid')}
               className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium shadow-sm transition-all flex items-center gap-1.5 md:gap-2 backdrop-blur-sm ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700'}`}>
               <Grid3x3 size={14} className="md:w-4 md:h-4" /> <span className="hidden xs:inline">Grid</span>
             </button>
             <button 
               onClick={() => setViewMode('whiteboard')}
               className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium shadow-sm transition-all flex items-center gap-1.5 md:gap-2 backdrop-blur-sm ${viewMode === 'whiteboard' ? 'bg-primary text-white' : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700'}`}>
               <Presentation size={14} className="md:w-4 md:h-4" /> <span className="hidden xs:inline">Pizarra</span>
             </button>
             {activeScreenShare && (
               <button 
                 onClick={() => setViewMode('screen')}
                 className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium shadow-sm transition-all flex items-center gap-1.5 md:gap-2 backdrop-blur-sm ${viewMode === 'screen' ? 'bg-primary text-white' : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700'}`}>
                 <Monitor size={14} className="md:w-4 md:h-4" /> <span className="hidden xs:inline">Pantalla</span>
               </button>
             )}
           </div>

           <div className="flex-1 flex items-center justify-center overflow-hidden bg-white/40 dark:bg-dark-surface/40 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg border border-white/20 dark:border-white/10 relative">
              <div className={`w-full h-full ${viewMode === 'whiteboard' ? 'block' : 'hidden'}`}>
               <Whiteboard roomId={roomId} />
             </div>
              
              {viewMode === 'grid' && (
                 <div className="w-full h-full overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 content-start p-2 md:p-4 scrollbar-thin">
                    {peers.map(peer => {
                      const isMe = peer.username === username;
                      const isPeerHost = peer.socketId === hostId;
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      const hasLocalVideo = isMe && localStream && producers.has('video') && !producers.get('video')?.paused;
                      
                      const videoConsumer = !isMe ? Array.from(consumers.values()).find(
                        c => c.appData.peerId === peer.socketId && c.kind === 'video'
                      ) : null;

                      const hasVideo = hasLocalVideo || !!videoConsumer;

                      return (
                        <div key={peer.socketId} className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
                           {hasVideo ? (
                              <VideoPlayer 
                                stream={isMe ? localStream! : undefined}
                                track={videoConsumer?.track}
                                muted={isMe} // Mute local to avoid feedback
                                username={peer.username}
                                className="w-full h-full object-cover"
                              />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                <Avatar name={peer.username} color={peer.color} size="lg" className="text-xl md:text-2xl w-16 h-16 md:w-20 md:h-20" />
                                <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 text-white font-medium bg-black/50 px-2 py-0.5 md:px-3 md:py-1 rounded-lg flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                                  <span className="max-w-[100px] truncate">{peer.username} {isMe && '(Tú)'}</span>
                                  {isPeerHost && <span className="text-[10px] md:text-xs bg-yellow-500 text-black px-1.5 rounded-full" title="Anfitrión">★</span>}
                                </div>
                              </div>
                           )}
                           
                           {/* Status Icons */}
                           <div className="absolute top-4 right-4 flex gap-2">
                              {/* Audio status could go here if we tracked it per peer */}
                           </div>
                        </div>
                      );
                   })}
                </div>
              )}

              {viewMode === 'screen' && activeScreenShare && (
                 <div className="w-full h-full flex items-center justify-center bg-black rounded-lg overflow-hidden">
                    <VideoPlayer 
                      stream={activeScreenShare.stream} 
                      track={activeScreenShare.track} 
                      username={activeScreenShare.username} 
                      className="w-full h-full object-contain" 
                    />
                 </div>
              )}
           </div>
        </div>

        {/* Sidebar (Videos/Chat) */}
        <div className={`fixed inset-0 top-14 bottom-16 md:static md:inset-auto z-40 md:z-auto transition-all duration-300 ease-in-out md:border-l border-white/20 dark:border-white/10 bg-white/95 dark:bg-dark-surface/95 md:bg-white/80 md:dark:bg-dark-surface/80 backdrop-blur-xl md:backdrop-blur-md flex flex-col ${showSidebar ? 'translate-x-0 w-full md:w-80 opacity-100' : 'translate-x-full w-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto'}`}>
          
          <div className="p-4 flex flex-col h-full gap-4">
             {/* Tabs */}
             <div className="flex bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 shrink-0">
               <button
                onClick={() => setActiveTab('participants')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'participants' ? 'bg-white text-primary shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <Users size={18} />
                Participantes
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'bg-white text-primary shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <MessageSquare size={18} />
                Chat
              </button>
             </div>

             {/* Tab Content */}
             <div className="flex-1 overflow-hidden relative">
               {activeTab === 'participants' ? (
                 <div className="h-full overflow-y-auto pr-1">
                   {peers.map(peer => {
                     const isMe = peer.username === username;
                     const hasLocalVideo = isMe && localStream && producers.has('video') && !producers.get('video')?.paused;
                     
                     const videoConsumer = !isMe ? Array.from(consumers.values()).find(
                       c => c.appData.peerId === peer.socketId && c.kind === 'video'
                     ) : null;

                     const hasVideo = hasLocalVideo || !!videoConsumer;

                     return (
                       <div key={peer.socketId} className="flex flex-col gap-2 mb-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                         <div className="flex items-center gap-3">
                           {!hasVideo && <Avatar name={peer.username} color={peer.color} size="sm" />}
                           <span className="font-medium text-gray-700 dark:text-gray-200 truncate flex-1">{peer.username}</span>
                           {isMe && <span className="text-xs text-primary bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded-full">Tú</span>}
                         </div>
                         
                         {hasVideo && (
                           <div className="w-full aspect-video rounded-lg overflow-hidden bg-black mt-1 shadow-sm relative group">
                             <VideoPlayer 
                               stream={isMe ? localStream! : undefined}
                               track={videoConsumer?.track}
                               muted={true}
                               username={peer.username}
                               className="w-full h-full object-cover"
                             />
                           </div>
                         )}
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <div className="flex flex-col h-full">
                   <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                     {messages.length === 0 && (
                       <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2">
                          <MessageSquare size={48} className="text-gray-300" />
                          <span>No hay mensajes aún</span>
                       </div>
                     )}
                     {messages.map(msg => (
                   <div key={msg.id} className={`flex flex-col ${msg.sender === username ? 'items-end' : 'items-start'}`}>
                     <div className="flex items-center gap-2 mb-1">
                       {msg.sender !== username && <Avatar name={msg.sender} color={msg.color} size="sm" className="w-6 h-6 text-[10px]" />}
                       <span className="text-[10px] text-gray-400">{msg.sender === username ? 'Tú' : msg.sender}</span>
                     </div>
                     <div className={`px-3 py-2 rounded-lg max-w-[90%] text-sm break-words shadow-sm ${msg.sender === username ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
                       {msg.type === 'file' && msg.fileData ? (
                         <div className="flex flex-col gap-2">
                           <div className="flex items-center gap-2">
                             <FileText size={20} />
                             <span className="font-medium truncate max-w-[150px]">{msg.fileData.name}</span>
                           </div>
                           {msg.fileData.type.startsWith('image/') && (
                              <img src={msg.fileData.data} alt={msg.fileData.name} className="max-w-full rounded-md max-h-40 object-cover bg-black/10" />
                           )}
                           <a 
                             href={msg.fileData.data} 
                             download={msg.fileData.name}
                             className={`text-xs underline mt-1 ${msg.sender === username ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}
                           >
                             Descargar ({(msg.fileData.size / 1024).toFixed(1)} KB)
                           </a>
                         </div>
                       ) : (
                         msg.text
                       )}
                     </div>
                   </div>
                 ))}
                     <div ref={chatEndRef} />
                   </div>
                   <form onSubmit={handleSendMessage} className="mt-2 md:mt-4 flex gap-2 shrink-0">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      title="Enviar archivo"
                    >
                      <Paperclip size={20} />
                    </button>
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 px-3 py-2 text-base md:text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    />
                    <button type="submit" disabled={!messageInput.trim()} className="p-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center min-w-[40px]">
                      <Send size={18} className="ml-0.5" />
                    </button>
                  </form>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
