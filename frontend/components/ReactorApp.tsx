"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

function Core({ power, coolant, unstable }: { power: number; coolant: number; unstable: boolean }) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * (.2 + power / 150);
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * .35) * .08;
    }
    if (ring.current) ring.current.rotation.z -= delta * (.35 + power / 120);
  });
  const heat = Math.min(1, power / 100);
  const coreColor = unstable ? "#ff476b" : heat > .75 ? "#ffb34d" : "#58eaff";
  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.25, 3]} />
        <meshStandardMaterial color={coreColor} emissive={coreColor} emissiveIntensity={1.4 + power / 80} roughness={.25} metalness={.25} wireframe={false} />
      </mesh>
      <mesh scale={1.24}>
        <icosahedronGeometry args={[1.25, 2]} />
        <meshStandardMaterial color="#d7f8ff" wireframe transparent opacity={.16} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.15, .08, 16, 90]} />
        <meshStandardMaterial color="#7d79ff" emissive="#705fff" emissiveIntensity={.8} />
      </mesh>
      <mesh rotation={[0.7, 0.2, 0]}>
        <torusGeometry args={[1.72, .035, 12, 90]} />
        <meshStandardMaterial color={coolant > 40 ? "#6fffc0" : "#ff826f"} emissiveIntensity={.5} emissive={coolant > 40 ? "#3ae899" : "#ff5038"} />
      </mesh>
    </group>
  );
}

export default function ReactorApp() {
  const [power, setPower] = useState(62);
  const [coolant, setCoolant] = useState(74);
  const [containment, setContainment] = useState(91);
  const temp = Math.round(280 + power * 8.4 - coolant * 2.2);
  const unstable = temp > 900 || containment < 45 || coolant < 25;

  function scram() {
    setPower(8); setCoolant(100); setContainment(100);
  }

  return (
    <div className="reactor-wrap">
      <div className="reactor-canvas">
        <Canvas camera={{ position: [0, 1.1, 5.8], fov: 48 }}>
          <ambientLight intensity={.8} />
          <pointLight position={[2, 3, 4]} intensity={40} color="#80eaff" />
          <pointLight position={[-3, -1, 1]} intensity={25} color="#826eff" />
          <Core power={power} coolant={coolant} unstable={unstable} />
        </Canvas>
      </div>
      <aside className="reactor-panel">
        <h2 className="app-title">Reactor Core</h2>
        <p className="app-sub">WebGL / Three.js simulator. Ikke godkendt af nogen myndighed.</p>
        <div className="reactor-stat"><label><span>Power</span><b>{power}%</b></label><input type="range" min="0" max="120" value={power} onChange={e => setPower(+e.target.value)} /></div>
        <div className="reactor-stat"><label><span>Coolant</span><b>{coolant}%</b></label><input type="range" min="0" max="100" value={coolant} onChange={e => setCoolant(+e.target.value)} /></div>
        <div className="reactor-stat"><label><span>Containment</span><b>{containment}%</b></label><input type="range" min="0" max="100" value={containment} onChange={e => setContainment(+e.target.value)} /></div>
        <div className={`alert ${unstable ? "" : "ok"}`}>
          Core temp: <b>{temp} K</b><br/>{unstable ? "UNSTABLE — SCRAM recommended" : "Containment nominal"}
        </div>
        <button className="btn danger" type="button" onClick={scram} style={{ width:"100%", marginTop:12 }}>SCRAM</button>
      </aside>
    </div>
  );
}
