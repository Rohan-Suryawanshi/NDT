import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, useGLTF } from "@react-three/drei";
import { Suspense, useRef, useState, useEffect } from "react";

// Earth Model Component with rotation and centered position
function EarthGlobe(props) {
   const { scene } = useGLTF("/earth_globe.glb");
   const earthRef = useRef();

   useFrame(() => {
      if (earthRef.current) {
         earthRef.current.rotation.y += 0.001; // slow rotation
      }
   });

   return (
      <primitive
         ref={earthRef}
         object={scene}
         scale={1.2}
         position={[0, 0, 0]} // ensure Earth is at center
         {...props}
      />
   );
}

const InteractiveEarth = () => {
   const controlsRef = useRef();
   const [autoRotate, setAutoRotate] = useState(true);
   const timeoutRef = useRef(null);

   const handleInteraction = () => {
      setAutoRotate(false);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setAutoRotate(true), 5000);
   };

   useEffect(() => {
      const controls = controlsRef.current;
      if (controls) {
         controls.addEventListener("start", handleInteraction);
      }
      return () => {
         if (controls) {
            controls.removeEventListener("start", handleInteraction);
         }
      };
   }, []);

   return (
      <div className="w-full max-w-lg mx-auto aspect-square rounded-xl shadow-lg overflow-hidden bg-black">
         <Canvas
            camera={{ position: [0, 0, 30], fov: 130 }}
            style={{ background: "#000000" }}
         >
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <Stars
               radius={200}
               depth={80}
               count={10000}
               factor={6}
               saturation={0}
               fade
               speed={1}
            />
            <Suspense fallback={null}>
               <EarthGlobe />
            </Suspense>
            <OrbitControls
               ref={controlsRef}
               enableZoom={true}
               enablePan={false}
               autoRotate={autoRotate}
               autoRotateSpeed={0.8}
               target={[0, 0, 0]} // focus camera to center
            />
         </Canvas>
      </div>
   );
};

export default InteractiveEarth;
