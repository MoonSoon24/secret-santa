import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Lobby from './pages/Lobby';
import Reveal from './pages/Reveal';
import './App.css';

// Wrapper to protect routes
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" />;
  return children;
};

// Snowflake Component
const Snowflakes = () => (
  <div aria-hidden="true">
    {[...Array(10)].map((_, i) => (
      <div key={i} className="snowflake">
        {['❅', '❆'][i % 2]}
      </div>
    ))}
  </div>
);

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [showSnow, setShowSnow] = useState(true);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Floating Controls */}
        <div className="floating-controls">
          <button 
            className="float-btn" 
            onClick={() => setShowSnow(!showSnow)} 
            title={showSnow ? "Disable Snow" : "Enable Snow"}
          >
            {showSnow ? '❄️' : '🚫'}
          </button>
          
          <button 
            className="float-btn" 
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Snow Overlay */}
        {showSnow && <Snowflakes />}

        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/lobby/:eventId" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
          <Route path="/reveal/:eventId" element={<ProtectedRoute><Reveal /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}