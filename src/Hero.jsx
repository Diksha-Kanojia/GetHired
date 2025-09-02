const HeroSection = () => {
  return (
    <>
      {/* Header with Logo */}
      <div className="absolute top-0 left-0 w-full z-30 p-10 md:p-6 lg:p-8">
        <div className="flex justify-start">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white lg:-ml-4 xl:-ml-6">
            Get <span className="text-indigo-400">Hired</span>
          </h1>
        </div>
      </div>
    <div className="min-h-screen relative flex flex-col">
      {/* Hero Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center text-white relative z-20 px-6 pt-16 md:pt-20 lg:pt-24">
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
    </>
  );
};

export default HeroSection;
