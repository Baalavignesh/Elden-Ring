import { useEffect } from 'react';

function ParticlesBackground() {
  useEffect(() => {
    // Load particles.js script dynamically
    const script = document.createElement('script');
    script.src = '/particles.js';
    script.async = true;
    
    script.onload = async () => {
      try {
        const response = await fetch('/particlesjs-config.json');
        const config = await response.json();
        
        if ((window as any).particlesJS) {
          (window as any).particlesJS('particles-js', config);
        }
      } catch (error) {
        console.error('Failed to load particles config:', error);
      }
    };
    
    document.body.appendChild(script);

    return () => {
      if ((window as any).pJSDom && (window as any).pJSDom.length > 0) {
        (window as any).pJSDom[0].pJS.fn.vendors.destroypJS();
        (window as any).pJSDom = [];
      }
      script.remove();
    };
  }, []);

  return (
    <div
      id="particles-js"
      className="fixed inset-0 z-0"
    />
  );
}

export default ParticlesBackground;