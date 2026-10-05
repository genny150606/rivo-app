'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Move3d } from 'lucide-react';

interface NodeData {
  title: string;
  category: string;
  color: string;
  phi: number;
  theta: number;
}

const ECOSYSTEM_NODES: NodeData[] = [
  { title: 'Magazzino AI', category: 'Retail', color: '#BFFF00', phi: Math.PI * 0.35, theta: Math.PI * 0.2 },
  { title: 'Vision Scanner', category: 'Hardware', color: '#38BDF8', phi: Math.PI * 0.65, theta: Math.PI * 0.6 },
  { title: 'Cassa & Pagamenti', category: 'Phygital', color: '#A855F7', phi: Math.PI * 0.45, theta: Math.PI * 1.1 },
  { title: 'NFC Smart Stand', category: 'Touchpoint', color: '#F59E0B', phi: Math.PI * 0.75, theta: Math.PI * 1.55 },
  { title: 'Loyalty & CRM', category: 'Retention', color: '#EC4899', phi: Math.PI * 0.25, theta: Math.PI * 1.85 },
  { title: 'Analisi & ROI', category: 'Cloud', color: '#10B981', phi: Math.PI * 0.8, theta: Math.PI * 0.35 },
];

export default function HeroGlobe3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activeNode, setActiveNode] = useState<NodeData | null>(ECOSYSTEM_NODES[0]);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 480;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 240;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Group for all rotating elements
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Particle Cloud Sphere (Hologram Globe)
    const particleCount = 1200;
    const radius = 72;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const baseColor = new THREE.Color('#BFFF00');
    const accentColor = new THREE.Color('#818CF8');
    const glowColor = new THREE.Color('#FFFFFF');

    for (let i = 0; i < particleCount; i++) {
      // Fibonacci sphere distribution for uniform dispersion
      const phi = Math.acos(1 - (2 * (i + 0.5)) / particleCount);
      const theta = Math.PI * (1 + 5 ** 0.5) * i;

      // Slight random radial jitter for organic depth
      const r = radius + (Math.random() - 0.5) * 4;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Color gradient: lime pole to soft indigo & white sparkles
      const lerpFactor = Math.random();
      const pColor = lerpFactor < 0.65 ? baseColor : lerpFactor < 0.9 ? accentColor : glowColor;
      colors[i * 3] = pColor.r;
      colors[i * 3 + 1] = pColor.g;
      colors[i * 3 + 2] = pColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Dynamic procedural point texture for soft circular glowing dots
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.3, 'rgba(191,255,0,0.8)');
      gradient.addColorStop(0.7, 'rgba(191,255,0,0.2)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 2.8,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    globeGroup.add(particles);

    // 2. Inner Pulsing Core Orb
    const coreGeo = new THREE.SphereGeometry(radius * 0.42, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x101b10,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const coreOrb = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreOrb);

    // 3. Orbital Gyroscope Rings
    const createRing = (ringRadius: number, tiltX: number, tiltY: number, color: string) => {
      const ringGeo = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      const segments = 120;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * ringRadius, Math.sin(theta) * ringRadius, 0));
      }
      ringGeo.setFromPoints(points);
      const ringMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Line(ringGeo, ringMat);
      ring.rotation.x = tiltX;
      ring.rotation.y = tiltY;
      return ring;
    };

    const ring1 = createRing(radius * 1.18, Math.PI * 0.35, Math.PI * 0.15, '#BFFF00');
    const ring2 = createRing(radius * 1.28, -Math.PI * 0.25, Math.PI * 0.4, '#818CF8');
    globeGroup.add(ring1);
    globeGroup.add(ring2);

    // 4. Interactive 3D Beacon Nodes
    const nodeMeshes: THREE.Mesh[] = [];
    ECOSYSTEM_NODES.forEach((node) => {
      const nodeR = radius * 1.04;
      const x = nodeR * Math.sin(node.phi) * Math.cos(node.theta);
      const y = nodeR * Math.sin(node.phi) * Math.sin(node.theta);
      const z = nodeR * Math.cos(node.phi);

      const nodeGeo = new THREE.SphereGeometry(3.5, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(node.color),
        wireframe: false,
      });
      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      mesh.position.set(x, y, z);
      mesh.userData = { node };

      // Halo ring around node
      const haloGeo = new THREE.RingGeometry(4.2, 5.4, 20);
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(node.color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.lookAt(0, 0, 0);
      mesh.add(halo);

      globeGroup.add(mesh);
      nodeMeshes.push(mesh);
    });

    // 5. Interactive Drag & Mouse Momentum
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let targetRotationX = 0.2;
    let targetRotationY = 0;
    let velocityX = 0.003;
    let velocityY = 0.002;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      setIsInteracting(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      previousMouseX = clientX;
      previousMouseY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - previousMouseX;
      const deltaY = clientY - previousMouseY;

      targetRotationY += deltaX * 0.008;
      targetRotationX += deltaY * 0.008;

      previousMouseX = clientX;
      previousMouseY = clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
      setTimeout(() => setIsInteracting(false), 2000);
    };

    const domElement = renderer.domElement;
    domElement.style.touchAction = 'none';
    domElement.addEventListener('mousedown', onPointerDown);
    domElement.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);

    // Cycle through highlighted active nodes periodically
    let cycleIndex = 0;
    const cycleInterval = setInterval(() => {
      cycleIndex = (cycleIndex + 1) % ECOSYSTEM_NODES.length;
      setActiveNode(ECOSYSTEM_NODES[cycleIndex]);
    }, 4500);

    // 6. Animation Loop at 60 FPS
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth damped rotation
      if (!isDragging) {
        targetRotationY += velocityX;
      }
      globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.08;
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.08;

      // Subtle breathing / counter-rotation of rings and core
      ring1.rotation.z = elapsedTime * 0.2;
      ring2.rotation.z = -elapsedTime * 0.15;
      coreOrb.rotation.y = -elapsedTime * 0.3;

      // Pulse beacon nodes
      nodeMeshes.forEach((mesh, idx) => {
        const scale = 1 + Math.sin(elapsedTime * 3 + idx) * 0.18;
        mesh.scale.set(scale, scale, scale);
      });

      renderer.render(scene, camera);
    };

    animate();

    // 7. Handle Resize
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(cycleInterval);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', onPointerDown);
      domElement.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchend', onPointerUp);

      // Clean up geometries and materials
      geometry.dispose();
      particleMaterial.dispose();
      particleTexture.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      renderer.dispose();
      if (domElement.parentElement) {
        domElement.parentElement.removeChild(domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-[520px] aspect-square mx-auto flex items-center justify-center">
      {/* Glow aura backdrop */}
      <div className="absolute inset-0 bg-gradient-to-tr from-lime-500/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* WebGL Canvas Container */}
      <div 
        ref={mountRef} 
        className="w-full h-full relative z-10 cursor-grab active:cursor-grabbing select-none"
        title="Trascina la sfera per ruotarla in 3D"
      />

      {/* Interactive 3D Badge Overlay */}
      <div className="absolute top-2 right-2 z-20 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-lime-400/40 text-[11px] font-mono text-lime-400 backdrop-blur-md shadow-lg shadow-lime-500/10">
          <Move3d className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          <span>3D WebGL Live • Ruota a 360°</span>
        </span>
      </div>

      {/* Active Node Holographic HUD Card */}
      {activeNode && (
        <div className="absolute -bottom-6 inset-x-4 md:inset-x-8 z-20 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="bg-zinc-950/85 border border-white/15 backdrop-blur-xl rounded-2xl p-3.5 shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full animate-ping"
                style={{ backgroundColor: activeNode.color }}
              />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Nodo Connesso: {activeNode.category}
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{activeNode.title}</span>
                  <Sparkles className="w-3 h-3 text-lime-400" />
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-lime-400/10 text-lime-400 border border-lime-400/20">
                Attivo 60 FPS
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
