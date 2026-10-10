'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { universeAudio } from './UniverseAudio';

export type WorldId = 'restaurant' | 'retail' | 'ai' | 'maps' | 'staff' | 'data';

export interface WorldMeta {
  id: WorldId;
  name: string;
  tagline: string;
  category: string;
  metric: string;
  position: [number, number, number];
  color: string;
}

export const WORLDS_CONFIG: WorldMeta[] = [
  {
    id: 'restaurant',
    name: 'RESTAURANT',
    tagline: 'Table Touchpoints • Smart Routing • Review Shield • Waiter Pager',
    category: 'Hospitality Architecture',
    metric: '13.56 MHz NFC • 0.2s Load',
    position: [0, 13, -27],
    color: '#BFFF00',
  },
  {
    id: 'retail',
    name: 'RETAIL',
    tagline: 'Physical Products to Digital Records • Box Scanner • Instant Inventory',
    category: 'Intelligent Commerce',
    metric: 'RFID/NFC • 100% Stock Sync',
    position: [27, 7, -13],
    color: '#00FF66',
  },
  {
    id: 'ai',
    name: 'AI CORE',
    tagline: 'Contextual Reasoning • Sommelier • Dynamic Personalized Upsell',
    category: 'Neural Decision Engine',
    metric: '4 Context Vectors • 14ms Inference',
    position: [27, -7, 13],
    color: '#BFFF00',
  },
  {
    id: 'maps',
    name: 'MAPS',
    tagline: 'Venue Floorplans • Multi-Location Footprint • Table Layouts',
    category: 'Spatial Topology',
    metric: 'Real-Time Table Occupancy',
    position: [0, -13, 27],
    color: '#38BDF8',
  },
  {
    id: 'staff',
    name: 'STAFF',
    tagline: 'Service Dispatch • Smartwatch Paging • Table Turn Optimization',
    category: 'Operations & Workflow',
    metric: '-38% Service Wait Time',
    position: [-27, -7, 13],
    color: '#F59E0B',
  },
  {
    id: 'data',
    name: 'DATA',
    tagline: 'Physical Footprint Telemetry • Conversion Funnels • CRM Ledger',
    category: 'Executive Intelligence',
    metric: '2,481 Live Tap Telemetry',
    position: [-27, 7, -13],
    color: '#BFFF00',
  },
];

interface UniverseSceneProps {
  activeWorld: WorldId | null;
  onSelectWorld: (world: WorldId) => void;
  onReturnToNucleus: () => void;
  isIntroComplete: boolean;
}

export default function UniverseScene({
  activeWorld,
  onSelectWorld,
  onReturnToNucleus,
  isIntroComplete,
}: UniverseSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredWorld, setHoveredWorld] = useState<WorldMeta | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // References for camera targeting & smooth damping
  const targetCamPos = useRef(new THREE.Vector3(0, 8, 48));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020204, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 8, 48);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020204, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 3. Lighting (Strict contrast: deep shadows, precision highlights)
    const ambientLight = new THREE.AmbientLight(0x0c0c12, 1.2);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight(0xbfff00, 3.5, 45, 1.6);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
    rimLight.position.set(20, 40, 20);
    scene.add(rimLight);

    // 4. Background Deep-Space Star Dust (controlled, subtle)
    const starCount = 380;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 80 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);

      const isGreen = Math.random() > 0.88;
      starColors[i * 3] = isGreen ? 0.75 : 0.85;
      starColors[i * 3 + 1] = isGreen ? 1.0 : 0.85;
      starColors[i * 3 + 2] = isGreen ? 0.1 : 0.9;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.9,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 5. THE RIVO NUCLEUS (Proprietary Geometric Construct)
    const nucleusGroup = new THREE.Group();
    scene.add(nucleusGroup);

    // 5A. Singularity Octahedron Core (Glowing Neon Green Energy)
    const coreGeo = new THREE.OctahedronGeometry(2.4, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x050508,
      emissive: 0xbfff00,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.9,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    nucleusGroup.add(coreMesh);

    // 5B. Singularity Wireframe Lattice
    const wireGeo = new THREE.OctahedronGeometry(2.48, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    nucleusGroup.add(wireMesh);

    // 5C. Concentric Gimbal Ring 1 (Precision Torus)
    const ring1Geo = new THREE.TorusGeometry(4.8, 0.08, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x222228,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0xbfff00,
      emissiveIntensity: 0.2,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ringMat);
    ring1.rotation.x = Math.PI * 0.35;
    nucleusGroup.add(ring1);

    // 5D. Concentric Gimbal Ring 2 (Orthogonal)
    const ring2Geo = new THREE.TorusGeometry(6.2, 0.07, 16, 100);
    const ring2 = new THREE.Mesh(ring2Geo, ringMat);
    ring2.rotation.y = Math.PI * 0.25;
    nucleusGroup.add(ring2);

    // 5E. Outer Symmetrical Gear Rim
    const ring3Geo = new THREE.TorusGeometry(7.8, 0.06, 16, 120);
    const ring3 = new THREE.Mesh(ring3Geo, ringMat);
    ring3.rotation.z = Math.PI * 0.15;
    nucleusGroup.add(ring3);

    // Symmetrical Laser Crosshairs inside Nucleus
    const lineMat = new THREE.LineBasicMaterial({ color: 0xbfff00, transparent: true, opacity: 0.4 });
    const crossHairPoints = [
      new THREE.Vector3(-9, 0, 0), new THREE.Vector3(9, 0, 0),
      new THREE.Vector3(0, -9, 0), new THREE.Vector3(0, 9, 0),
      new THREE.Vector3(0, 0, -9), new THREE.Vector3(0, 0, 9),
    ];
    const crossHairGeo = new THREE.BufferGeometry().setFromPoints(crossHairPoints);
    const crossHairs = new THREE.LineSegments(crossHairGeo, lineMat);
    nucleusGroup.add(crossHairs);

    // 6. THE 6 SPATIAL WORLDS & CONDUITS
    const worldsGroup = new THREE.Group();
    scene.add(worldsGroup);

    interface WorldMeshEntry {
      meta: WorldMeta;
      mesh: THREE.Group;
      conduit: THREE.Line;
      conduitMat: THREE.LineBasicMaterial;
      corePulse: THREE.Mesh;
    }

    const worldEntries: WorldMeshEntry[] = [];

    WORLDS_CONFIG.forEach((world) => {
      const group = new THREE.Group();
      group.position.set(...world.position);

      // World specific geometric node
      let nodeGeo: THREE.BufferGeometry;
      if (world.id === 'restaurant') {
        nodeGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.4, 32);
      } else if (world.id === 'retail') {
        nodeGeo = new THREE.BoxGeometry(1.8, 2.6, 1.8);
      } else if (world.id === 'ai') {
        nodeGeo = new THREE.IcosahedronGeometry(1.6, 0);
      } else if (world.id === 'maps') {
        nodeGeo = new THREE.ConeGeometry(1.4, 2.4, 4);
      } else if (world.id === 'staff') {
        nodeGeo = new THREE.TorusGeometry(1.5, 0.25, 12, 32);
      } else {
        nodeGeo = new THREE.DodecahedronGeometry(1.5, 0);
      }

      const nodeMat = new THREE.MeshStandardMaterial({
        color: 0x121216,
        roughness: 0.25,
        metalness: 0.85,
        emissive: new THREE.Color(world.color),
        emissiveIntensity: 0.45,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      group.add(nodeMesh);

      // Outer Wireframe Halo
      const haloGeo = new THREE.SphereGeometry(2.3, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(world.color),
        wireframe: true,
        transparent: true,
        opacity: 0.25,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      group.add(haloMesh);

      // Center active LED beacon
      const beaconGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(world.color),
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      group.add(beaconMesh);

      // User data for raycasting
      nodeMesh.userData = { worldId: world.id };
      haloMesh.userData = { worldId: world.id };
      beaconMesh.userData = { worldId: world.id };

      worldsGroup.add(group);

      // Neon-Green Luminous Conduit connecting back to Nucleus Core (0,0,0)
      const conduitPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(...world.position)];
      const conduitGeo = new THREE.BufferGeometry().setFromPoints(conduitPoints);
      const conduitMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(world.color),
        transparent: true,
        opacity: 0.2,
      });
      const conduit = new THREE.Line(conduitGeo, conduitMat);
      scene.add(conduit);

      worldEntries.push({
        meta: world,
        mesh: group,
        conduit,
        conduitMat,
        corePulse: beaconMesh,
      });
    });

    // 7. Raycaster & Mouse tracking
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      mouseVector.x = (clientX / rect.width) * 2 - 1;
      mouseVector.y = -(clientY / rect.height) * 2 + 1;

      mouse.current.targetX = mouseVector.x;
      mouse.current.targetY = mouseVector.y;

      setTooltipPos({ x: e.clientX, y: e.clientY });

      // Raycast against worlds
      raycaster.setFromCamera(mouseVector, camera);
      const intersects = raycaster.intersectObjects(worldsGroup.children, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const hitWorldId = hit.userData.worldId as WorldId | undefined;
        if (hitWorldId) {
          const found = WORLDS_CONFIG.find((w) => w.id === hitWorldId);
          if (found && found.id !== hoveredWorld?.id) {
            setHoveredWorld(found);
            universeAudio.playClick();
          }
          return;
        }
      }
      setHoveredWorld(null);
    };

    const handleClick = () => {
      if (hoveredWorld) {
        universeAudio.playWarp();
        universeAudio.playLaserBeam();
        onSelectWorld(hoveredWorld.id);
      } else {
        // Clicking center nucleus pulses energy
        universeAudio.playNucleusActivate();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleClick);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 8. Animation Render Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Smooth mouse lerp
      mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.05;
      mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.05;

      // Mechanical rotation of RIVO Nucleus
      coreMesh.rotation.y = elapsed * 0.4;
      coreMesh.rotation.x = elapsed * 0.2;
      wireMesh.rotation.y = -elapsed * 0.3;
      wireMesh.rotation.z = elapsed * 0.25;

      ring1.rotation.z = elapsed * 0.2;
      ring2.rotation.x = -elapsed * 0.15;
      ring3.rotation.y = elapsed * 0.1;

      // Pulse the central singularity light
      const pulse = 1.2 + Math.sin(elapsed * 2.8) * 0.35;
      coreMat.emissiveIntensity = pulse;
      coreLight.intensity = 2.8 + pulse * 0.8;

      // Animate worlds
      worldEntries.forEach((entry) => {
        const isSelected = activeWorld === entry.meta.id;
        const isHovered = hoveredWorld?.id === entry.meta.id;

        // Subtle self rotation
        entry.mesh.rotation.y = elapsed * 0.3;
        entry.mesh.rotation.x = elapsed * 0.15;

        // Hover / Active reaction: scale up and ignite conduit
        const targetScale = isSelected ? 1.5 : isHovered ? 1.3 : 1.0;
        entry.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

        if (isSelected || isHovered) {
          entry.conduitMat.opacity = 0.95;
          entry.conduitMat.color.setHex(0xbfff00);
        } else {
          entry.conduitMat.opacity = 0.18;
          entry.conduitMat.color.set(entry.meta.color);
        }
      });

      // Camera Director positioning
      if (activeWorld) {
        const activeEntry = WORLDS_CONFIG.find((w) => w.id === activeWorld);
        if (activeEntry) {
          // Camera glides close to the active world node
          targetCamPos.current.set(
            activeEntry.position[0] * 0.72 + mouse.current.x * 2,
            activeEntry.position[1] * 0.72 - mouse.current.y * 2,
            activeEntry.position[2] * 0.72 + 10
          );
          targetLookAt.current.set(...activeEntry.position);
        }
      } else {
        // Orbit around origin with subtle mouse parallax
        targetCamPos.current.set(
          mouse.current.x * 8,
          8 - mouse.current.y * 6,
          48
        );
        targetLookAt.current.set(0, 0, 0);
      }

      // Smooth camera interpolation (Damping / Inertia)
      camera.position.lerp(targetCamPos.current, 0.05);
      currentLookAt.current.lerp(targetLookAt.current, 0.06);
      camera.lookAt(currentLookAt.current);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);

      // Clean disposal
      scene.clear();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeWorld, hoveredWorld, onSelectWorld]);

  return (
    <div className="relative w-full h-full select-none">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      {/* Floating Holographic 3D Tooltip tracking cursor */}
      {hoveredWorld && !activeWorld && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-24 px-4 py-2.5 rounded-xl bg-black/80 border border-[#BFFF00] backdrop-blur-md shadow-[0_0_30px_rgba(191,255,0,0.35)] flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] animate-pulse" />
            <span className="text-xs font-mono font-bold text-white tracking-widest uppercase">
              {hoveredWorld.name}
            </span>
            <span className="text-[9px] font-mono text-[#BFFF00] uppercase border border-[#BFFF00]/40 px-1 rounded">
              ENTER WORLD
            </span>
          </div>
          <span className="text-[11px] text-zinc-300 font-sans">{hoveredWorld.tagline}</span>
          <span className="text-[9px] font-mono text-zinc-500 mt-1">{hoveredWorld.metric}</span>
        </div>
      )}
    </div>
  );
}
