import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { Logo } from '../components/Logo';
import { User, Lock, UserPlus } from 'lucide-react';

export const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await register(username, password);
    if (success) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-dark-bg dark:to-gray-900 p-4 transition-colors duration-500">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[100px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-cyan-400/10 blur-[100px]" />
      </div>

      <div className="relative bg-white/80 dark:bg-dark-surface/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 dark:border-gray-700/50">
        <div className="flex flex-col items-center mb-10">
          <div className="mb-6 p-4 bg-white dark:bg-dark rounded-2xl shadow-lg shadow-blue-500/10">
            <Logo size={50} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Crear Cuenta</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Únete a BoardWave hoy mismo</p>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl mb-6 text-sm flex items-center animate-fade-in">
            <span className="mr-2">⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Usuario</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                <User size={20} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none"
                placeholder="Elige tu nombre de usuario"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Contraseña</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                <Lock size={20} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none"
                placeholder="Crea una contraseña segura"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Registrarse
                <UserPlus size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary hover:text-blue-600 font-semibold hover:underline transition-colors">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
};
