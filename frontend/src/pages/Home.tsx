import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { Avatar } from '../components/Avatar';
import { Logo } from '../components/Logo';
import { v4 as uuidv4 } from 'uuid';
import { Video, LogOut, ArrowRight, Keyboard } from 'lucide-react';
import { soundService } from '../services/sound';

export const Home = () => {
  const navigate = useNavigate();
  const [joinId, setJoinId] = useState('');
  const { user, logout } = useAuthStore();

  const createRoom = () => {
    soundService.playCreate();
    const roomId = uuidv4().slice(0, 8);
    navigate(`/room/${roomId}`);
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinId.trim()) {
      navigate(`/room/${joinId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-bg p-4 relative overflow-hidden transition-colors duration-500">
       {/* Dynamic Animated Background */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Header/User Bar */}
      <div className="absolute top-6 right-6 z-20 animate-fade-in">
        <div className="glass px-4 py-2 rounded-2xl flex items-center gap-4 shadow-lg">
           <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden sm:block">
                Hola, {user?.username}
              </span>
              {user && <Avatar name={user.username} color={user.color} size="sm" />}
           </div>
           <button 
             onClick={logout}
             className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
             title="Cerrar Sesión"
           >
             <LogOut size={20} />
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center animate-slide-up">
        
        <div className="mb-8 transform hover:scale-105 transition-transform duration-500">
           <Logo size={90} textColor="text-gray-900 dark:text-white" />
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-500 mb-6 tracking-tight drop-shadow-sm">
          Colabora sin límites
        </h1>
        
        <p className="text-xl text-gray-700 dark:text-gray-200 mb-12 max-w-2xl leading-relaxed font-medium">
          Videoconferencias instantáneas, pizarra colaborativa y chat en tiempo real. 
          Todo en un solo lugar, sin complicaciones.
        </p>

        <div className="flex flex-col md:flex-row gap-6 w-full max-w-xl">
          
          {/* Create Room Button */}
          <button 
            onClick={createRoom}
            className="flex-1 py-5 px-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-3xl font-bold text-lg shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group flex items-center justify-center gap-3"
          >
            <div className="p-2 bg-white/20 rounded-full">
               <Video size={24} className="text-white" />
            </div>
            <span>Nueva Reunión</span>
            <ArrowRight size={20} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
          </button>
          
          {/* Join Room Form */}
          <form onSubmit={joinRoom} className="flex-1 relative group">
             <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-600 transition-colors">
                <Keyboard size={24} />
             </div>
             <input
                type="text"
                placeholder="Código de reunión"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                className="w-full h-full py-5 pl-14 pr-24 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-3xl text-gray-900 dark:text-white placeholder-gray-500 shadow-lg focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 transition-all outline-none text-lg"
             />
             <button 
               type="submit"
               disabled={!joinId.trim()}
               className="absolute right-2 top-2 bottom-2 px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-0 disabled:scale-75 shadow-md"
             >
               Unirme
             </button>
          </form>

        </div>
      </div>
    </div>
  );
};
