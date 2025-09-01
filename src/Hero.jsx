const HeroSection = () => {
  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Navbar */}
      <div className="relative z-30 p-6">
        <nav className="max-w-6xl mx-auto border border-gray-700 rounded-full px-8 py-4 bg-gray-800/50 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <span className="text-white text-lg font-medium">GetHired</span>
            </div>
            
            {/* Navigation Links */}
            <div className="flex items-center space-x-8">
              <a href="#" className="text-white hover:text-gray-300 transition-colors">
                Home
              </a>
              <a href="#" className="text-white hover:text-gray-300 transition-colors">
                About
              </a>
            </div>
          </div>
        </nav>
      </div>

      {/* Hero Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center text-white relative z-20 px-6">
        {/* Heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
          Practice<br />
          Interviews<br />
          With AI.<br />
          
        </h1>

        {/* Subtext */}
        <p className="text-lg md:text-xl max-w-2xl text-gray-300 mb-8 leading-relaxed">
          Ace your next interview with AI-powered practice sessions. Get personalized feedback, improve your skills, and boost your confidence before the real thing.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
      <button
        onClick={() => window.location.href = '/auth'}
        className="px-8 py-3 bg-gray-800 text-white font-bold rounded-full shadow-lg hover:bg-gray-600 transition-all duration-200"
      >
        Get Started
      </button>
    </div>
      </div>
    </div>
  );
};

export default HeroSection;