// src/components/EarthViewer.jsx
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stars } from '@react-three/drei';
import { Suspense, useRef } from 'react';

function EarthModel() {
  const { scene } = useGLTF('./earth.glb'); // Ensure earth.glb is in public/models/
  const earthRef = useRef();

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001; // Smooth slow rotation
    }
  });

  return <primitive object={scene} ref={earthRef} scale={2.5} />;
}

export default function InteractiveEarth() {
  return (
    <div style={{ width: '100%', height: '80vh' }} className="rounded-2xl bg-black">
      <Canvas camera={{ position: [0, 0, 2], fov: 45 }} className="rounded-2xl">
        {/* Add background stars for better effect */}
        <Stars radius={100} depth={25} count={5000} factor={4} fade speed={1} />
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={null}>
          <EarthModel />
        </Suspense>
        <OrbitControls enableZoom enablePan enableRotate />
      </Canvas>
    </div>
  );
}
