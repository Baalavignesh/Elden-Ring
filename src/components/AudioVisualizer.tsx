import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

function AudioVisualizer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bars, setBars] = useState<number[]>(Array(6).fill(0.3)); // 5 bars with initial height
  
  // Animation refs
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const barConfigsRef = useRef<Array<{
    frequency: number;
    phase: number;
    amplitude: number;
    baseHeight: number;
  }>>([]);

  // Initialize bar configurations with unique characteristics
  useEffect(() => {
    barConfigsRef.current = Array(5).fill(null).map((_, index) => ({
      frequency: 0.8 + Math.random() * 1.4, // Frequency between 0.8-2.2
      phase: (index * Math.PI * 0.4) + (Math.random() * Math.PI), // Phase offset
      amplitude: 0.15 + Math.random() * 0.25, // Amplitude between 0.15-0.4
      baseHeight: 0.3 + Math.random() * 0.2, // Base height between 0.3-0.5
    }));
  }, []);

  // Smooth animation loop using requestAnimationFrame
  useEffect(() => {
    let animationActive = false;

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = (currentTime - startTimeRef.current) / 1000; // Convert to seconds
      
      if (isPlaying) {
        // Calculate smooth sine wave heights for each bar
        const newHeights = barConfigsRef.current.map((config, index) => {
          const sineValue = Math.sin(elapsed * config.frequency + config.phase);
          const randomNoise = (Math.random() - 0.5) * 0.05; // Small random variation
          const height = Math.max(0.2, Math.min(1.0, 
            config.baseHeight + (config.amplitude * sineValue) + randomNoise
          ));
          return height;
        });
        
        setBars(newHeights);
      } else {
        // Smoothly return to static positions when paused
        setBars(prev => prev.map((current, index) => {
          const target = 0.3;
          const diff = target - current;
          return current + diff * 0.05; // Gradual transition to static height
        }));
      }

      if (animationActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying || bars.some(h => Math.abs(h - 0.3) > 0.01)) {
      animationActive = true;
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      animationActive = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  // Force auto-play music when component mounts
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const forceAutoPlay = async () => {
      try {
        // Set volume and prepare audio
        audio.volume = 0.3;
        audio.muted = false;
        
        console.log('Attempting to force auto-play music...');
        
        // Force play with multiple attempts
        let playAttempts = 0;
        const maxAttempts = 5;
        
        const attemptPlay = async () => {
          playAttempts++;
          
          try {
            await audio.play();
            console.log(`Music started successfully on attempt ${playAttempts}`);
            setIsPlaying(true);
            return true;
          } catch (error) {
            console.log(`Play attempt ${playAttempts} failed:`, error);
            
            if (playAttempts < maxAttempts) {
              // Wait a bit and try again
              setTimeout(() => attemptPlay(), 100);
            } else {
              console.log('All auto-play attempts failed, music will need manual start');
              setIsPlaying(false);
            }
            return false;
          }
        };
        
        // Start first attempt immediately
        await attemptPlay();
        
      } catch (error) {
        console.log('Auto-play setup failed:', error);
        setIsPlaying(false);
      }
    };

    // Start auto-play immediately when component mounts
    forceAutoPlay();

    // Also set up fallback for any user interaction
    const handleUserInteraction = async () => {
      if (!isPlaying && audio) {
        try {
          await audio.play();
          setIsPlaying(true);
          console.log('Music started via user interaction');
        } catch (error) {
          console.log('Failed to start music on interaction:', error);
        }
      }
    };

    // Listen for user interactions as fallback
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []); // Remove isPlaying dependency to prevent re-runs

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      // Bars will smoothly transition to static positions via animation loop
    } else {
      audio.play();
      setIsPlaying(true);
      // Reset start time for smooth animation restart
      startTimeRef.current = undefined;
    }
  };

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        autoPlay
        loop
        preload="auto"
        muted={false}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onCanPlay={() => console.log('Audio can start playing')}
        onError={(e) => console.log('Audio error:', e)}
      >
        <source src="/assets/music.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {/* Audio Visualizer - bottom right */}
      <motion.div
        className="fixed bottom-8 right-8 z-50 cursor-pointer"
        onClick={toggleMusic}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
      >
        <div className="flex items-end space-x-1 h-12 px-3 py-2">
          {bars.map((height, index) => (
            <motion.div
              key={index}
              className="w-[2px] bg-white/60 rounded-sm"
              animate={{ 
                height: `${height * 100}%`,
                opacity: isPlaying ? 0.8 : 0.4
              }}
              transition={{ 
                duration: 0.1,
                ease: "linear"
              }}
              style={{
                minHeight: '20%'
              }}
            />
          ))}
        </div>
        
        {/* Subtle glow effect when playing */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              className="absolute inset-0 bg-white/10 rounded-lg blur-sm -z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

export default AudioVisualizer;