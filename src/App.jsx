import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PrivacyPolicy from './components/PrivacyPolicy';
import Blog from './components/Blog';
import StartACall from './components/StartACall';
import './App.css'
import ChayoAIHome from "./ChayoAIHome";

function App() {
  // Dark mode state management
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Default to dark mode if no preference is saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Update localStorage when darkMode changes
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    
    // Update document class for global styling
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Apply initial theme class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'dark bg-black text-white' 
        : 'light bg-white text-gray-900'
    }`}>
      <Routes>
        <Route path="/" element={<ChayoAIHome darkMode={darkMode} />} />
        <Route path="/privacy" element={<PrivacyPolicy darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/blog" element={<Blog darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/startaicall" element={<StartACall darkMode={darkMode} setDarkMode={setDarkMode} />} />
      </Routes>
    </div>
  );
}

export default App
