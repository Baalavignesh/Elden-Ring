import { useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  tilt: { x: number; y: number; z: number };
}

function VideoBackground({ tilt }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video plays automatically and loops
    video.play().catch(console.error);
  }, []);

  return (
    <div 
      className="fixed inset-0 overflow-hidden z-0"
      style={{
        transform: `translateX(${-tilt.y * 0.3}px) translateY(${tilt.x * 0.2}px)`,
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        transformOrigin: 'center center'
      }}
    >
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        // poster="/assets/logo.webp"
        onLoadedData={() => console.log("Video loaded and ready to play")}
        onEnded={() => console.log("Video ended - should loop automatically")}
        style={{
          transform: `scale(1.05)` // Slight scale to prevent edge artifacts during parallax
        }}
      >
        <source src="/assets/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {/* Static overlay for consistent performance */}
      <div 
        className="absolute inset-0 bg-black/30"
      />
    </div>
  );
}

export default VideoBackground;