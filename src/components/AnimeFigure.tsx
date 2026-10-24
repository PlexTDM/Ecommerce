import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const ease = (current: number, target: number, factor: number) =>
  current + (target - current) * factor;

const Figure = () => {
  const { scene } = useGLTF("/assets/raiden_shogun_statue.glb");
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0.35, y: -0.15 });
  const target = useRef({ x: 0.35, y: -0.15 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to -1..1 range
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;

    mouse.current.x = ease(mouse.current.x, target.current.x, 0.03);
    mouse.current.y = ease(mouse.current.y, target.current.y, 0.03);

    groupRef.current.rotation.y = mouse.current.x * 0.5 - 0.25;
    groupRef.current.rotation.x = mouse.current.y * 0.3 - 0.25;
  });

  return (
    <group ref={groupRef} position={[0, -0.4, 0]}>
      <primitive object={scene} scale={0.25} />
    </group>
  );
};

const Particles = () => {
  const ref = useRef<THREE.Points>(null);
  const positions = new Float32Array(80 * 3);
  for (let i = 0; i < 80; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 4;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
  }

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.05;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#2A2263"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const AnimeFigure = () => {
  return (
    <div className="w-full h-full min-h-100 md:min-h-screen relative">
      {/* glow */}
      <div
        className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center"
        style={{ transform: "translateY(-5%)" }}
      >
        <div
          className="rounded-full"
          style={{
            width: "80%",
            aspectRatio: "1",
            background:
              "radial-gradient(circle, rgba(138, 43, 226, 0.35) 0%, rgba(75, 0, 130, 0.7) 30%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      <Canvas
        className="relative z-10"
        camera={{ position: [0, 1, 2.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#FFB6C1" />
        <pointLight position={[0, 2, 2]} intensity={0.5} color="#FFD700" />
        <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
          <Figure />
        </Float>
        <Particles />
      </Canvas>
    </div>
  );
};

useGLTF.preload("/assets/raiden_shogun_statue.glb");

export default AnimeFigure;
