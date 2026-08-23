export default function AboutApp() {
  return (
    <div className="about-hero">
      <h1>Nytte<span>tech</span> OS</h1>
      <p>
        En fuldstændig unødvendigt avanceret teknisk legeplads bygget som et lille web-OS.
        Frontenden kører Next.js/React, live-systemdata og terminal kommer fra Python/FastAPI,
        reaktoren renderes i Three.js, og Factory Meltdown er skrevet i rigtig Python/Pygame.
      </p>
      <div className="about-tags">
        <span>Next.js 16</span><span>React 19</span><span>TypeScript</span><span>FastAPI</span>
        <span>WebSockets</span><span>Three.js</span><span>Pygame</span><span>WebAssembly</span><span>Docker</span>
      </div>
    </div>
  );
}
