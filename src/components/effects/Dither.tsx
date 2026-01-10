'use client';

import { useRef, useEffect, useState } from 'react';
import { Renderer, Program, Triangle, Mesh } from 'ogl';

interface DitherProps {
  waveColor?: [number, number, number];
  disableAnimation?: boolean;
  enableMouseInteraction?: boolean;
  mouseRadius?: number;
  colorNum?: number;
  waveAmplitude?: number;
  waveFrequency?: number;
  waveSpeed?: number;
  className?: string;
}

const Dither = ({
  waveColor = [0.5, 0.5, 0.5],
  disableAnimation = false,
  enableMouseInteraction = true,
  mouseRadius = 0.3,
  colorNum = 4,
  waveAmplitude = 0.3,
  waveFrequency = 3,
  waveSpeed = 0.05,
  className = ''
}: DitherProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniformsRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const animationIdRef = useRef<number | null>(null);
  const meshRef = useRef<any>(null);
  const cleanupFunctionRef = useRef<(() => void) | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    if (cleanupFunctionRef.current) {
      cleanupFunctionRef.current();
      cleanupFunctionRef.current = null;
    }

    const initializeWebGL = async () => {
      if (!containerRef.current) return;

      await new Promise(resolve => setTimeout(resolve, 10));

      if (!containerRef.current) return;

      const renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio, 2),
        alpha: true
      });
      rendererRef.current = renderer;

      const gl = renderer.gl;
      gl.canvas.style.width = '100%';
      gl.canvas.style.height = '100%';

      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      containerRef.current.appendChild(gl.canvas);

      const vert = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

      const frag = `precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform vec3 waveColor;
uniform float mouseRadius;
uniform float colorNum;
uniform float waveAmplitude;
uniform float waveFrequency;
uniform float waveSpeed;
uniform float disableAnimation;

varying vec2 vUv;

// Bayer matrix for dithering
const mat4 bayerMatrix = mat4(
  0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
  12.0/16.0, 4.0/16.0, 14.0/16.0, 6.0/16.0,
  3.0/16.0, 11.0/16.0,  1.0/16.0, 9.0/16.0,
  15.0/16.0, 7.0/16.0, 13.0/16.0, 5.0/16.0
);

float getBayer(vec2 pos) {
  int x = int(mod(pos.x, 4.0));
  int y = int(mod(pos.y, 4.0));
  
  if (x == 0 && y == 0) return bayerMatrix[0][0];
  if (x == 1 && y == 0) return bayerMatrix[0][1];
  if (x == 2 && y == 0) return bayerMatrix[0][2];
  if (x == 3 && y == 0) return bayerMatrix[0][3];
  
  if (x == 0 && y == 1) return bayerMatrix[1][0];
  if (x == 1 && y == 1) return bayerMatrix[1][1];
  if (x == 2 && y == 1) return bayerMatrix[1][2];
  if (x == 3 && y == 1) return bayerMatrix[1][3];
  
  if (x == 0 && y == 2) return bayerMatrix[2][0];
  if (x == 1 && y == 2) return bayerMatrix[2][1];
  if (x == 2 && y == 2) return bayerMatrix[2][2];
  if (x == 3 && y == 2) return bayerMatrix[2][3];
  
  if (x == 0 && y == 3) return bayerMatrix[3][0];
  if (x == 1 && y == 3) return bayerMatrix[3][1];
  if (x == 2 && y == 3) return bayerMatrix[3][2];
  return bayerMatrix[3][3];
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 pixelPos = gl_FragCoord.xy;
  
  // Wave effect
  float time = disableAnimation > 0.5 ? 0.0 : iTime * waveSpeed;
  float wave = sin(uv.x * waveFrequency + time) * 
               cos(uv.y * waveFrequency + time) * waveAmplitude;
  
  // Mouse interaction
  vec2 mouseUV = iMouse / iResolution.xy;
  float dist = length(uv - mouseUV);
  float mouseInfluence = smoothstep(mouseRadius, 0.0, dist);
  
  // Combine effects
  float value = wave + mouseInfluence * 0.3;
  value = (value + 1.0) * 0.5; // Normalize to 0-1
  
  // Apply wave color
  value = dot(vec3(value), waveColor);
  
  // Dithering
  float bayerValue = getBayer(pixelPos);
  float steps = max(2.0, colorNum);
  value = floor(value * steps + bayerValue) / steps;
  
  gl_FragColor = vec4(vec3(value), 1.0);
}`;

      const uniforms = {
        iTime: { value: 0 },
        iResolution: { value: [1, 1] },
        iMouse: { value: [0.5, 0.5] },
        waveColor: { value: waveColor },
        mouseRadius: { value: mouseRadius },
        colorNum: { value: colorNum },
        waveAmplitude: { value: waveAmplitude },
        waveFrequency: { value: waveFrequency },
        waveSpeed: { value: waveSpeed },
        disableAnimation: { value: disableAnimation ? 1.0 : 0.0 }
      };
      uniformsRef.current = uniforms;

      const geometry = new Triangle(gl);
      const program = new Program(gl, { vertex: vert, fragment: frag, uniforms });
      const mesh = new Mesh(gl, { geometry, program });
      meshRef.current = mesh;

      const updateSize = () => {
        if (!containerRef.current || !renderer) return;

        renderer.dpr = Math.min(window.devicePixelRatio, 2);

        const { clientWidth: wCSS, clientHeight: hCSS } = containerRef.current;
        renderer.setSize(wCSS, hCSS);

        const dpr = renderer.dpr;
        const w = wCSS * dpr;
        const h = hCSS * dpr;

        uniforms.iResolution.value = [w, h];
      };

      const loop = (t: number) => {
        if (!rendererRef.current || !uniformsRef.current || !meshRef.current) {
          return;
        }

        uniforms.iTime.value = t * 0.001;

        try {
          renderer.render({ scene: mesh });
          animationIdRef.current = requestAnimationFrame(loop);
        } catch (error) {
          console.warn('WebGL rendering error:', error);
          return;
        }
      };

      window.addEventListener('resize', updateSize);
      updateSize();
      animationIdRef.current = requestAnimationFrame(loop);

      cleanupFunctionRef.current = () => {
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;
        }

        window.removeEventListener('resize', updateSize);

        if (renderer) {
          try {
            const canvas = renderer.gl.canvas;
            const loseContextExt = renderer.gl.getExtension('WEBGL_lose_context');
            if (loseContextExt) {
              loseContextExt.loseContext();
            }

            if (canvas && canvas.parentNode) {
              canvas.parentNode.removeChild(canvas);
            }
          } catch (error) {
            console.warn('Error during WebGL cleanup:', error);
          }
        }

        rendererRef.current = null;
        uniformsRef.current = null;
        meshRef.current = null;
      };
    };

    initializeWebGL();

    return () => {
      if (cleanupFunctionRef.current) {
        cleanupFunctionRef.current();
        cleanupFunctionRef.current = null;
      }
    };
  }, [
    isVisible,
    disableAnimation,
    waveColor,
    mouseRadius,
    colorNum,
    waveAmplitude,
    waveFrequency,
    waveSpeed
  ]);

  useEffect(() => {
    if (!uniformsRef.current) return;

    const u = uniformsRef.current;
    u.waveColor.value = waveColor;
    u.mouseRadius.value = mouseRadius;
    u.colorNum.value = colorNum;
    u.waveAmplitude.value = waveAmplitude;
    u.waveFrequency.value = waveFrequency;
    u.waveSpeed.value = waveSpeed;
    u.disableAnimation.value = disableAnimation ? 1.0 : 0.0;
  }, [waveColor, mouseRadius, colorNum, waveAmplitude, waveFrequency, waveSpeed, disableAnimation]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !rendererRef.current || !enableMouseInteraction) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (uniformsRef.current) {
        const dpr = rendererRef.current.dpr;
        uniformsRef.current.iMouse.value = [x * dpr, (rect.height - y) * dpr];
      }
    };

    if (enableMouseInteraction) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [enableMouseInteraction]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full pointer-events-none z-[3] overflow-hidden relative ${className}`.trim()}
    />
  );
};

export default Dither;