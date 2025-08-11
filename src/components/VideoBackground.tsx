import { useEffect, useRef } from 'react';

function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video plays automatically and loops
    video.play().catch(console.error);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden z-0">
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
      >
        <source src="/assets/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {/* Darker overlay to reduce brightness and ensure readability */}
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}

export default VideoBackground;