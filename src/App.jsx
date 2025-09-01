import { Route, Routes } from 'react-router-dom';
import './App.css';
import AuthPage from './Auth';
import Example from './Blogs';
import Dashboard from './Dashboard'; // Import the Dashboard component
import Footer from './Footer';
import HeroSection from './Hero';
import InterviewScreen from './Interview'; // Import the InterviewScreen component
import { MediaProvider } from './MediaContext'; // Import the MediaProvider
import Results from './Results'; // Import the Results component
import Section from './Section';
import Setup from './Setup';
import Threads from './Threads';

function App() {
  return (
    <MediaProvider>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <div id="hero" className="relative w-full h-screen overflow-hidden">
                <div className="absolute inset-0 z-0">
                  <Threads />
                </div>
                <div className="relative z-20 flex flex-col items-center justify-center h-full text-center">
                  <HeroSection />
                </div>
                <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
              </div>
              <div id="about" className="w-full bg-gray-950">
                <Section />
              </div>
              <div id="community" className="w-full bg-gray-950">
                <Example />
              </div>
              <div className="w-full bg-gray-950">
                <Footer />
              </div>
            </>
          }
        />
        
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/setup" element={<Setup />}  />
        <Route path="/interview" element={<InterviewScreen />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </MediaProvider>
  )
}

export default App