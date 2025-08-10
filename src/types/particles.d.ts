declare module 'particles.js' {
  global {
    interface Window {
      particlesJS: (tagId: string, params: any) => void;
      pJSDom: any[];
    }
  }
}

interface Window {
  particlesJS: (tagId: string, params: any) => void;
  pJSDom: any[];
}