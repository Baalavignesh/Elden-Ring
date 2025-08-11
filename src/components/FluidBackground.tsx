import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface FluidBackgroundProps {
  mousePosition: { x: number; y: number };
  tilt: { x: number; y: number; z: number };
}

// Fluid shader material component
function FluidPlane({ mousePosition, tilt }: FluidBackgroundProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  // Custom shader material
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_mouse: { value: new THREE.Vector2(0, 0) },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_tilt: { value: new THREE.Vector2(0, 0) },
        u_ripples: { value: new Array(5).fill(0).map(() => new THREE.Vector4(0, 0, 0, 0)) } // x, y, intensity, time
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform vec2 u_resolution;
        uniform vec2 u_tilt;
        uniform vec4 u_ripples[5];
        
        varying vec2 vUv;
        
        // Simplex noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
        
        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m ;
          m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }
        
        void main() {
          vec2 uv = vUv;
          vec2 st = gl_FragCoord.xy / u_resolution.xy;
          
          // Base fluid distortion using noise - much slower
          float time = u_time * 0.0001; // Super slow ambient movement
          vec2 noiseCoord = uv * 3.0 + time;
          
          float noise1 = snoise(noiseCoord + vec2(time * 0.05, time * 0.03)) * 0.004;
          float noise2 = snoise(noiseCoord * 2.0 + vec2(-time * 0.02, time * 0.04)) * 0.002;
          float noise3 = snoise(noiseCoord * 4.0 + vec2(time * 0.01, -time * 0.015)) * 0.001;
          
          // Combine noise layers for organic movement
          vec2 distortion = vec2(noise1 + noise2 + noise3, noise2 + noise3 + noise1);
          
          // Add very subtle tilt-based flow
          distortion += u_tilt * 0.0005;
          
          // Mouse influence - create very slow flowing effect around cursor
          vec2 mouseUV = u_mouse / u_resolution;
          mouseUV.y = 1.0 - mouseUV.y; // Flip Y coordinate
          float mouseDist = distance(uv, mouseUV);
          float mouseInfluence = 1.0 - smoothstep(0.0, 0.6, mouseDist);
          
          // Create very slow swirling motion around mouse
          vec2 mouseDir = normalize(uv - mouseUV);
          vec2 perpDir = vec2(-mouseDir.y, mouseDir.x);
          distortion += perpDir * mouseInfluence * 0.003 * sin(time * 0.5 + mouseDist * 5.0);
          
          // Ripple effects from mouse clicks/movement
          float rippleEffect = 0.0;
          for(int i = 0; i < 5; i++) {
            vec4 ripple = u_ripples[i];
            if(ripple.w > 0.0) {
              float rippleDist = distance(uv, ripple.xy);
              float rippleDecay = max(0.0, 1.0 - ripple.w * 0.8);
              float rippleWave = sin(rippleDist * 30.0 - ripple.w * 8.0) * rippleDecay;
              rippleEffect += rippleWave * ripple.z * 0.01;
            }
          }
          
          // Apply ripple distortion
          distortion += vec2(cos(atan(uv.y - mouseUV.y, uv.x - mouseUV.x)), sin(atan(uv.y - mouseUV.y, uv.x - mouseUV.x))) * rippleEffect;
          
          // Final UV with all distortions
          vec2 finalUV = uv + distortion;
          
          // Create oil-like color with iridescent effect
          float colorNoise = snoise(finalUV * 8.0 + time * 2.0) * 0.5 + 0.5;
          float colorShift = snoise(finalUV * 12.0 - time * 1.5) * 0.3 + 0.7;
          
          // Dark water/oil color palette
          vec3 baseColor = vec3(0.01, 0.02, 0.03); // Very dark blue-black
          vec3 highlightColor = vec3(0.03, 0.04, 0.06); // Slightly lighter dark
          vec3 color = mix(baseColor, highlightColor, colorNoise * colorShift);
          
          // Add subtle iridescence based on viewing angle and distortion
          float iridescence = abs(dot(normalize(vec3(distortion, 0.1)), vec3(0, 0, 1)));
          color += vec3(0.005, 0.008, 0.012) * iridescence;
          
          // Fade edges for seamless blending
          float vignette = 1.0 - length(uv - 0.5) * 0.8;
          color *= vignette;
          
          // Subtle opacity for dark water effect
          gl_FragColor = vec4(color, 0.3);
        }
      `,
      transparent: true,
      blending: THREE.NormalBlending,
    });
  }, []);

  const ripplesRef = useRef<Array<{ x: number; y: number; intensity: number; time: number }>>([]);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Update uniforms and create ripples
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      
      // Update time
      material.uniforms.u_time.value = state.clock.elapsedTime * 1000;
      
      // Update mouse position
      material.uniforms.u_mouse.value.set(mousePosition.x, mousePosition.y);
      
      // Update tilt
      material.uniforms.u_tilt.value.set(tilt.x * 0.1, tilt.y * 0.1);
      
      // Check for mouse movement to create ripples - much less sensitive
      const mouseMoved = Math.abs(mousePosition.x - lastMousePos.current.x) > 20 || 
                        Math.abs(mousePosition.y - lastMousePos.current.y) > 20;
      
      if (mouseMoved) {
        // Add new ripple
        const mouseUV = {
          x: mousePosition.x / window.innerWidth,
          y: 1 - (mousePosition.y / window.innerHeight) // Flip Y
        };
        
        ripplesRef.current.push({
          x: mouseUV.x,
          y: mouseUV.y,
          intensity: 0.3, // Much weaker ripples
          time: 0
        });
        
        // Keep only last 5 ripples
        if (ripplesRef.current.length > 5) {
          ripplesRef.current.shift();
        }
        
        lastMousePos.current = { x: mousePosition.x, y: mousePosition.y };
      }
      
      // Update ripples - much slower
      ripplesRef.current = ripplesRef.current
        .map(ripple => ({
          ...ripple,
          time: ripple.time + 0.01, // Much slower ripple expansion
          intensity: ripple.intensity * 0.995 // Much slower decay
        }))
        .filter(ripple => ripple.intensity > 0.005);
      
      // Pass ripples to shader
      const rippleArray = new Array(5).fill(new THREE.Vector4(0, 0, 0, 0));
      ripplesRef.current.forEach((ripple, i) => {
        if (i < 5) {
          rippleArray[i] = new THREE.Vector4(ripple.x, ripple.y, ripple.intensity, ripple.time);
        }
      });
      material.uniforms.u_ripples.value = rippleArray;
    }
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <primitive object={shaderMaterial} />
    </mesh>
  );
}

// Main component
function FluidBackground({ mousePosition, tilt }: FluidBackgroundProps) {
  return (
    <div className="fixed inset-0 z-[5] pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <FluidPlane mousePosition={mousePosition} tilt={tilt} />
      </Canvas>
    </div>
  );
}

export default FluidBackground;