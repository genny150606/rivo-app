'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function UniverseBackground3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020204, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4, 38);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setClearColor(0x020204, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0x0a0a10, 1.2);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight(0xbfff00, 3.2, 50, 1.6);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
    rimLight.position.set(15, 30, 20);
    scene.add(rimLight);

    // 3. Subtle Background Star Dust
    const starCount = 420;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 60 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);

      const isGreen = Math.random() > 0.85;
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
      opacity: 0.45,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 4. THE RIVO NUCLEUS (3D Geometric Core)
    const nucleusGroup = new THREE.Group();
    scene.add(nucleusGroup);

    // 4A. Singularity Octahedron Core (Neon Green Energy)
    const coreGeo = new THREE.OctahedronGeometry(2.6, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x050508,
      emissive: 0xbfff00,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.9,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    nucleusGroup.add(coreMesh);

    // 4B. Wireframe Matrix Cage
    const wireGeo = new THREE.OctahedronGeometry(2.7, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    nucleusGroup.add(wireMesh);

    // 4C. Concentric Gimbal Ring 1 (Precision Torus)
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x24242a,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0xbfff00,
      emissiveIntensity: 0.25,
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.08, 16, 100), ringMat);
    ring1.rotation.x = Math.PI * 0.35;
    nucleusGroup.add(ring1);

    // 4D. Concentric Gimbal Ring 2
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(6.8, 0.07, 16, 100), ringMat);
    ring2.rotation.y = Math.PI * 0.25;
    nucleusGroup.add(ring2);

    // 4E. Outer Symmetrical Gear Rim
    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(8.4, 0.06, 16, 120), ringMat);
    ring3.rotation.z = Math.PI * 0.15;
    nucleusGroup.add(ring3);

    // 5. Orbital Spatial Node Anchors (The 6 Worlds)
    const worldPositions: [number, number, number][] = [
      [0, 13, -24],   // Restaurant
      [24, 6, -12],   // Retail
      [24, -6, 12],   // AI
      [0, -13, 24],   // Maps
      [-24, -6, 12],  // Staff
      [-24, 6, -12],  // Data / Ecosystem
    ];

    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);

    worldPositions.forEach((pos, idx) => {
      const nodeMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.2, 0),
        new THREE.MeshStandardMaterial({
          color: 0x14141a,
          emissive: 0xbfff00,
          emissiveIntensity: 0.35,
          roughness: 0.25,
          metalness: 0.85,
        })
      );
      nodeMesh.position.set(...pos);
      nodesGroup.add(nodeMesh);

      // Conduit line connecting back to core
      const conduitPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(...pos)];
      const conduitGeo = new THREE.BufferGeometry().setFromPoints(conduitPoints);
      const conduitMat = new THREE.LineBasicMaterial({
        color: 0xbfff00,
        transparent: true,
        opacity: 0.18,
      });
      const conduit = new THREE.Line(conduitGeo, conduitMat);
      scene.add(conduit);
    });

    // 6. Native Scroll Tracking (Zero hijacking, 100% native scroll listener)
    const scrollInfo = { current: 0, target: 0 };
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        scrollInfo.target = window.scrollY / maxScroll;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    handleScroll();

    // 7. Resize Handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 8. Animation & Scroll-Driven Render Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Smooth scroll lerp
      scrollInfo.current += (scrollInfo.target - scrollInfo.current) * 0.08;
      const progress = scrollInfo.current; // 0 (top) to 1 (bottom)

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // Nucleus rotation: baseline mechanical rotation + scroll-driven acceleration
      nucleusGroup.rotation.y = elapsed * 0.35 + progress * Math.PI * 4;
      nucleusGroup.rotation.x = Math.sin(elapsed * 0.2) * 0.15 + progress * Math.PI * 1.5;
      nucleusGroup.rotation.z = mouse.x * 0.15;

      ring1.rotation.z = elapsed * 0.25 + progress * 2;
      ring2.rotation.x = -elapsed * 0.2 + progress * 2.5;
      ring3.rotation.y = elapsed * 0.15 - progress * 2;

      // Pulse singularity core
      const pulse = 1.2 + Math.sin(elapsed * 3.0) * 0.35;
      coreMat.emissiveIntensity = pulse;
      coreLight.intensity = 2.8 + pulse * 0.8;

      // Camera transitions based on scroll progress:
      // Section 1 (0.0 - 0.12): Origin focal shot of the Nucleus
      // Section 2 - 7: Camera dynamically dollies and shifts perspective as visitor scrolls through worlds
      const camTargetZ = 38 - Math.sin(progress * Math.PI) * 14;
      const camTargetX = Math.sin(progress * Math.PI * 2.5) * 10 + mouse.x * 3;
      const camTargetY = 4 - progress * 16 - mouse.y * 3;

      camera.position.x += (camTargetX - camera.position.x) * 0.05;
      camera.position.y += (camTargetY - camera.position.y) * 0.05;
      camera.position.z += (camTargetZ - camera.position.z) * 0.05;

      // Look at nucleus with slight offset
      camera.lookAt(0, -progress * 6, 0);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);

      scene.clear();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full overflow-hidden"
      aria-hidden="true"
    />
  );
}
