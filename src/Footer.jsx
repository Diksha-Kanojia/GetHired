import { FaEnvelope, FaGithub, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  const handleNavClick = (e, href) => {
    e.preventDefault();
    
    // Smooth scroll to the section
    const targetId = href.substring(1); // Remove the '#'
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <footer className="bg-gray-950 text-gray-300 py-12">
      <div className="container mx-auto px-4 flex flex-col items-center space-y-8">

        {/* Social Links */}
        <div className="flex space-x-10 text-3xl">
          <a 
            href="mailto:dikshakanojia2536@gmail.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-white transition"
          >
            <FaEnvelope />
          </a>
          <a 
            href="https://www.linkedin.com/in/diksha-kanojia1/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-white transition"
          >
            <FaLinkedin />
          </a>
          <a 
            href="https://github.com/Diksha-Kanojia" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-white transition"
          >
            <FaGithub />
          </a>
        </div>

        {/* Branding / Copyright */}
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} GetHired. All rights reserved.
        </p>
      </div>
    </footer>
  );
}