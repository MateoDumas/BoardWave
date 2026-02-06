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
  Link as LinkIcon, Check
} from 'lucide-react';

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { connect, joinRoom, peers, isConnected, socket, disconnect: disconnectSocket, messages, sendMessage } = useSocketStore();
  const { initDevice, produce, consume, localStream, localScreenStream, consumers, producers, close: closeMedia, toggleProducer } = useMediaStore();
  const { user } = useAuthStore();
  const username = user?.username || `Guest-${Math.floor(Math.random() * 1000)}`;
  const userColor = user?.color;
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

  const isHost = peers.find(p => p.socketId === socket?.id)?.isHost;

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
    connect();
  }, [connect]);

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

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#202124] text-gray-900 dark:text-white overflow-hidden relative transition-colors duration-500">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
      </div>

      {/* Navbar Glass */}
      <div className="h-16 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-white/20 dark:border-white/10 flex items-center px-6 justify-between z-30 shadow-sm relative">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">BoardWave</h1>
          <span className="px-3 py-1 bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-full text-sm font-medium border border-gray-200/50 dark:border-gray-600/50">
            Sala: {roomId}
          </span>
          
          {isHost && (
            <button 
              onClick={handleCopyInvite}
              className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors border border-blue-200/50 dark:border-blue-800/30"
              title="Copiar enlace de invitación"
            >
              {copied ? <Check size={14} /> : <LinkIcon size={14} />}
              {copied ? 'Copiado' : 'Invitar'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-secondary dark:text-gray-400">
            Tú: <span className="font-semibold text-gray-900 dark:text-white">{username}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50/80 dark:bg-green-900/20 text-success rounded-full text-sm backdrop-blur-sm border border-green-100/50 dark:border-green-800/30">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            {peers.length + 1} Conectados
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 flex overflow-hidden z-20 relative">
        {/* Left Sidebar Controls Glass */}
        <div className="w-20 bg-white/60 dark:bg-dark-surface/60 backdrop-blur-md border-r border-white/20 dark:border-white/10 flex flex-col items-center py-6 gap-6 z-20 shadow-lg transition-all">
             <button 
                onClick={handleToggleAudio}
                title="Alternar Audio"
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${producers.get('audio')?.paused ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600' : (producers.has('audio') ? 'bg-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600')}`}>
                {producers.has('audio') && !producers.get('audio')?.paused ? <Mic size={20} /> : <MicOff size={20} />}
             </button>
             <button 
                onClick={handleToggleVideo}
                title="Alternar Video"
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${producers.get('video')?.paused ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600' : (producers.has('video') ? 'bg-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600')}`}>
                {producers.has('video') && !producers.get('video')?.paused ? <Video size={20} /> : <VideoOff size={20} />}
             </button>
             <button 
                onClick={handleToggleScreen}
                title="Compartir Pantalla"
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${localScreenStream ? 'bg-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                <MonitorUp size={20} />
             </button>
             
             <div className="w-8 h-[1px] bg-gray-200 dark:bg-gray-700 my-2"></div>

             <button 
                onClick={() => setShowSidebar(!showSidebar)}
                title={showSidebar ? "Ocultar Panel" : "Mostrar Panel"}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${showSidebar ? 'bg-blue-50 text-primary dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                <Layout size={20} />
             </button>

             <div className="flex-1"></div>

             <button 
                onClick={handleLeaveRoom}
                title="Salir de la Sala"
                className="w-12 h-12 rounded-full bg-danger text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-md mb-4">
                <PhoneOff size={20} />
             </button>
        </div>

        {/* Pizarra / Screen Share Area */}
        <div className="flex-1 bg-transparent p-4 flex flex-col relative overflow-hidden">
           {/* View Mode Tabs (if screen share active) */}
           <div className="absolute top-4 left-4 z-10 flex gap-2">
             <button 
               onClick={() => setViewMode('grid')}
               className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2 backdrop-blur-sm ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700'}`}>
               <Grid3x3 size={16} /> Grid
             </button>
             <button 
               onClick={() => setViewMode('whiteboard')}
               className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2 backdrop-blur-sm ${viewMode === 'whiteboard' ? 'bg-primary text-white' : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700'}`}>
               <Presentation size={16} /> Pizarra
             </button>
             {activeScreenShare && (
               <button 
                 onClick={() => setViewMode('screen')}
                 className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2 backdrop-blur-sm ${viewMode === 'screen' ? 'bg-primary text-white' : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700'}`}>
                 <Monitor size={16} /> Pantalla
               </button>
             )}
           </div>

           <div className="flex-1 flex items-center justify-center overflow-hidden bg-white/40 dark:bg-dark-surface/40 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 dark:border-white/10 relative">
              <div className={`w-full h-full ${viewMode === 'whiteboard' ? 'block' : 'hidden'}`}>
               <Whiteboard roomId={roomId} />
             </div>
              
              {viewMode === 'grid' && (
                 <div className="w-full h-full overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start p-4">
                    {peers.map(peer => {
                      const isMe = peer.username === username;
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
                                <Avatar name={peer.username} color={peer.color} size="lg" className="text-2xl w-20 h-20" />
                                <div className="absolute bottom-4 left-4 text-white font-medium bg-black/50 px-3 py-1 rounded-lg">
                                  {peer.username} {isMe && '(Tú)'}
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
        <div className={`transition-all duration-300 ease-in-out border-l border-white/20 dark:border-white/10 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md flex flex-col ${showSidebar ? 'w-80 translate-x-0' : 'w-0 translate-x-full overflow-hidden opacity-0'}`}>
          
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
                   <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 shrink-0">
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
                       className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                     />
                     <button type="submit" disabled={!messageInput.trim()} className="p-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-sm">
                       ➤
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
