import Spline from "@splinetool/react-spline";

export default function InteractiveEarth() {
   return (
      <div className="relative">
         <div
            className="w-full mx-auto rounded-xl shadow-lg bg-gray-50 overflow-hidden"
            style={{ height: "400px" }}
         >
            {/* Spline Scene */}
            <Spline scene="https://prod.spline.design/e7FrPItw4qPget49/scene.splinecode" />
         </div>
        
      </div>
   );
}
