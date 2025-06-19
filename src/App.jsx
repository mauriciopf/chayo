import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Mascot from './components/Mascot';
import Services from './components/Services';
import PricingReplacement from './components/PricingReplacement';
import PrivacyPolicy from './components/PrivacyPolicy';
import Blog from './components/Blog';
import './App.css'
import AgenticAIHome from "./AgenticAIHome";

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <>
          <Header />
          <Hero />
          <Mascot />
          <Services />
          <PricingReplacement />
          <AgenticAIHome />
        </>
      } />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/blog" element={<Blog />} />
    </Routes>
  );
}

export default App
