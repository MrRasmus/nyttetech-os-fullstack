"use client";

export default function ArcadeApp() {
  const gameUrl = process.env.NEXT_PUBLIC_GAME_URL || "/game/";
  return (
    <div className="arcade">
      <div className="arcade-head">
        <span>FACTORY MELTDOWN · Python + Pygame → WebAssembly</span>
        <span>WASD / arrows · E</span>
      </div>
      <iframe title="Factory Meltdown Pygame" src={gameUrl} allow="autoplay" />
    </div>
  );
}
