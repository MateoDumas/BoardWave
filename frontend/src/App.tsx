import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Room from './pages/Room';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './services/authStore';
import { v4 as uuidv4 } from 'uuid';

import { Avatar } from './components/Avatar';

function Landing() {
  const navigate = useNavigate();
  const [joinId, setJoinId] = useState('');
  const { user, logout } = useAuthStore();

  const createRoom = () => {
    const roomId = uuidv4().slice(0, 8); // ID corto para demo
    navigate(`/room/${roomId}`);
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinId.trim()) {
      navigate(`/room/${joinId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-dark text-gray-900 dark:text-white flex flex-col items-center justify-center relative">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
           {user && <Avatar name={user.username} color={user.color} size="sm" />}
           <span className="font-medium">{user?.username}</span>
        </div>
        <button 
          onClick={logout}
          className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>

      <h1 className="text-4xl font-bold text-primary mb-4">BoardWave</h1>
      <p className="text-xl mb-8 text-secondary dark:text-gray-300">Colabora en vivo. Reúnete sin fricción.</p>
      
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <button 
          onClick={createRoom}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium transition-colors shadow-sm flex items-center gap-2">
          <span>📹</span> Nueva reunión
        </button>
        
        <form onSubmit={joinRoom} className="flex gap-2">
          <input
            type="text"
            placeholder="Introduce un código"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-primary w-48 transition-all"
          />
          <button 
            type="submit"
            disabled={!joinId.trim()}
            className="px-6 py-3 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-600 text-primary rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            Unirme
          </button>
        </form>
      </div>
    </div>
  )
}

function AppContent() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Landing />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
