import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import audioManager from "../utils/audioManager";

const Welcome = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleClick = () => {
    // Play audio using the global audio manager
    audioManager.playClickSoundOnce();
    
    // Start fade out
    setIsFadingOut(true);
    
    // Navigate after fade out completes
    setTimeout(() => {
      navigate("/familytree");
    }, 1500); // 1.5 second delay
  };

  useEffect(() => {
    setIsLoaded(true);

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key && !isFadingOut) {
        handleClick();
      }
    };

    window.addEventListener("keypress", handleKeyPress);

    return () => {
      window.removeEventListener("keypress", handleKeyPress);
      // No need to clean up audio - it's managed globally
    };
  }, [navigate, isFadingOut]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isFadingOut ? 0 : 1 }}
      transition={{ duration: 1 }}
      className="relative h-screen bg-black overflow-hidden cursor-pointer"
      onClick={() => !isFadingOut && handleClick()}
    >
      {/* Full screen background image */}
      <img
        src="/assets/main.jpeg"
        alt="Elden Ring Background"
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      />

      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-amber-950/20 via-black/50 to-black/70" />

      {/* Centered content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
          className="text-6xl font-extralight md:text-8xl text-center text-white mb-8"
        >
          ELDEN RING
        </motion.h1>

        {/* Press any button text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
          className="absolute bottom-40 animate-pulse text-lg md:text-2xl pt-32 uppercase text-center"
        >
          PRESS ANY BUTTON
        </motion.p>

      </div>

      {/* Subtle particle effect overlay */}
      <div className="absolute inset-0 opacity-20 z-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(251, 191, 36, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 80% 50%, rgba(251, 191, 36, 0.1) 0%, transparent 50%)`,
          }}
        />
      </div>
    </motion.div>
  );
};

export default Welcome;
