import { motion } from "motion/react";
import FamilyTree from "../components/FamilyTree";
import Navbar from "../components/Navbar";
import AudioVisualizer from "../components/AudioVisualizer";
import Sidebar from "../components/Sidebar";
import VideoBackground from "../components/VideoBackground";
import { useEffect, useState } from "react";

const Family = () => {

    const [sidebarOpen, setSidebarOpen] = useState(false);
    // Using Iridescence background
    // 3D tilt state for environmental integration
    const [globalTilt, setGlobalTilt] = useState({ x: 0, y: 0, z: 0 });
  
    const handleMenuClick = () => {
      console.log("Menu button clicked!");
      setSidebarOpen(true);
    };
  
    // Using Iridescence background - no toggle needed
  
    // Track global mouse position for minimal tilt effect
    useEffect(() => {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        // Calculate global tilt based on full screen dimensions
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
  
        const normalizedX = (e.clientX - centerX) / centerX;
        const normalizedY = (e.clientY - centerY) / centerY;
  
        // Apply minimal 3D tilt effect (max 3 degrees)
        const maxTilt = 3;
        const maxDepth = 20;
  
        const newTilt = {
          x: -normalizedY * maxTilt,
          y: normalizedX * maxTilt,
          z:
            Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY) *
            maxDepth,
        };
  
        setGlobalTilt(newTilt);
      };
  
      const handleGlobalMouseLeave = () => {
        setGlobalTilt({ x: 0, y: 0, z: 0 });
      };
  
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseleave", handleGlobalMouseLeave);
      return () => {
        window.removeEventListener("mousemove", handleGlobalMouseMove);
        window.removeEventListener("mouseleave", handleGlobalMouseLeave);
      };
    }, []);

  return (
    <div>
      {/* Video Background */}
      <VideoBackground tilt={globalTilt} />

      {/* Hamburger Menu Button */}
      {!sidebarOpen && (
        <motion.button
          onClick={handleMenuClick}
          className="fixed top-12 left-12 z-[60] text-white/60 hover:text-white transition-colors p-2 pointer-events-auto"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ delay: 1, duration: 0.5 }}
          aria-label="Open menu"
          style={{ pointerEvents: "auto" }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </motion.button>
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <Navbar />
      <main className="flex-1 relative">
        <FamilyTree tilt={globalTilt} />
      </main>

      {/* Audio Visualizer */}
      <AudioVisualizer />
    </div>
  );
};

export default Family;  