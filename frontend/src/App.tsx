import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Room from './pages/Room';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './services/authStore';

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
        <Route path="/" element={<Home />} />
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

export default App;
