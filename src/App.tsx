import { useRef, useEffect, useState, useCallback } from 'react';
import { SUN, PLANETS, DWARF_PLANETS, BELTS, CelestialBody } from './data/solarSystem';

interface SelectedBody {
  body: CelestialBody;
  screenX: number;
  screenY: number;
}

// Scale factors for visualization
const SCALE_FACTOR = 0.08; // pixels per million km for inner planets
const OUTER_SCALE = 0.03; // for outer solar system
const MIN_PLANET_SIZE = 3;
const MAX_PLANET_SIZE = 18;

function getOrbitalRadius(distanceFromSun: number, zoom: number): number {
  // Use logarithmic scale for better visualization
  if (distanceFromSun <= 0) return 0;
  return (Math.log10(distanceFromSun + 1) * 80 + 30) * zoom;
}

function getPlanetSize(radius: number, type: string): number {
  if (type === 'star') return 20;
  const size = Math.max(MIN_PLANET_SIZE, Math.min(MAX_PLANET_SIZE, Math.log10(radius + 1) * 4));
  return size;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [selectedBody, setSelectedBody] = useState<SelectedBody | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showMoons, setShowMoons] = useState(true);
  const [showBelts, setShowBelts] = useState(true);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const allBodies = [SUN, ...PLANETS, ...DWARF_PLANETS];

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2 + offsetX;
    const centerY = height / 2 + offsetY;
    const time = timeRef.current;

    // Clear canvas with space background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw stars background
    const starSeed = 42;
    for (let i = 0; i < 300; i++) {
      const sx = ((starSeed * (i + 1) * 7919) % width);
      const sy = ((starSeed * (i + 1) * 104729) % height);
      const brightness = 0.3 + ((i * 31) % 70) / 100;
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Draw Oort Cloud (outermost)
    if (showBelts) {
      const oortRadius = getOrbitalRadius(BELTS.oortCloud.innerRadius, zoom);
      const gradient = ctx.createRadialGradient(centerX, centerY, oortRadius * 0.8, centerX, centerY, oortRadius);
      gradient.addColorStop(0, 'rgba(100, 100, 150, 0.02)');
      gradient.addColorStop(1, 'rgba(100, 100, 150, 0.05)');
      ctx.beginPath();
      ctx.arc(centerX, centerY, oortRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(100, 100, 200, 0.15)';
      ctx.setLineDash([2, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (showLabels) {
        ctx.fillStyle = 'rgba(150, 150, 200, 0.5)';
        ctx.font = '10px sans-serif';
        ctx.fillText('Облако Оорта', centerX + oortRadius * 0.7, centerY - oortRadius * 0.7);
      }
    }

    // Draw Kuiper Belt
    if (showBelts) {
      const kuiperInner = getOrbitalRadius(BELTS.kuiperBelt.innerRadius, zoom);
      const kuiperOuter = getOrbitalRadius(BELTS.kuiperBelt.outerRadius, zoom);

      ctx.beginPath();
      ctx.arc(centerX, centerY, kuiperOuter, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, kuiperInner, 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(100, 149, 237, 0.06)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, kuiperInner, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.2)';
      ctx.setLineDash([3, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(centerX, centerY, kuiperOuter, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.2)';
      ctx.setLineDash([3, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (showLabels) {
        ctx.fillStyle = 'rgba(100, 149, 237, 0.6)';
        ctx.font = '11px sans-serif';
        ctx.fillText('Пояс Койпера', centerX + kuiperInner + 10, centerY - kuiperInner * 0.3);
      }
    }

    // Draw Asteroid Belt
    if (showBelts) {
      const asteroidInner = getOrbitalRadius(BELTS.asteroidBelt.innerRadius, zoom);
      const asteroidOuter = getOrbitalRadius(BELTS.asteroidBelt.outerRadius, zoom);

      ctx.beginPath();
      ctx.arc(centerX, centerY, asteroidOuter, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, asteroidInner, 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(139, 119, 101, 0.08)';
      ctx.fill();

      // Draw some asteroid dots
      for (let i = 0; i < 200; i++) {
        const angle = (i / 200) * Math.PI * 2 + (time * 0.0001 * (i % 3 + 1));
        const r = asteroidInner + Math.random() * (asteroidOuter - asteroidInner);
        const ax = centerX + Math.cos(angle) * r;
        const ay = centerY + Math.sin(angle) * r;
        ctx.fillStyle = `rgba(160, 140, 120, ${0.3 + Math.random() * 0.4})`;
        ctx.fillRect(ax, ay, 1.5, 1.5);
      }

      if (showLabels) {
        ctx.fillStyle = 'rgba(160, 140, 120, 0.7)';
        ctx.font = '11px sans-serif';
        ctx.fillText('Пояс астероидов', centerX + asteroidInner + 5, centerY - asteroidInner * 0.5);
      }
    }

    // Draw orbits
    if (showOrbits) {
      allBodies.forEach(body => {
        if (body.type === 'star') return;
        const orbitRadius = getOrbitalRadius(body.distanceFromSun, zoom);
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
        ctx.strokeStyle = body.type === 'dwarf'
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });
    }

    // Draw Sun
    const sunGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 35);
    sunGlow.addColorStop(0, 'rgba(253, 184, 19, 1)');
    sunGlow.addColorStop(0.3, 'rgba(253, 184, 19, 0.8)');
    sunGlow.addColorStop(0.7, 'rgba(253, 140, 0, 0.3)');
    sunGlow.addColorStop(1, 'rgba(253, 100, 0, 0)');
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
    ctx.fillStyle = sunGlow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#FDB813';
    ctx.fill();

    if (showLabels) {
      ctx.fillStyle = '#FDB813';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Солнце', centerX, centerY + 28);
      ctx.textAlign = 'left';
    }

    // Draw planets and dwarf planets
    allBodies.forEach(body => {
      if (body.type === 'star') return;

      const orbitRadius = getOrbitalRadius(body.distanceFromSun, zoom);
      const angularSpeed = (2 * Math.PI) / (body.orbitalPeriod * 60); // speed factor
      const angle = time * angularSpeed;
      const x = centerX + Math.cos(angle) * orbitRadius;
      const y = centerY + Math.sin(angle) * orbitRadius;
      const size = getPlanetSize(body.radius, body.type);

      // Draw planet
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = body.color;
      ctx.fill();

      // Draw glow for planets
      if (body.type === 'planet') {
        const glow = ctx.createRadialGradient(x, y, size * 0.5, x, y, size * 2);
        glow.addColorStop(0, body.color + '40');
        glow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(x, y, size * 2, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Draw Saturn's rings
      if (body.name === 'Saturn') {
        ctx.beginPath();
        ctx.ellipse(x, y, size * 2.2, size * 0.5, 0.3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(210, 180, 140, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw moons
      if (showMoons && body.moons) {
        body.moons.forEach((moon, moonIdx) => {
          const moonOrbitRadius = size + 8 + moonIdx * 7;
          const moonAngularSpeed = (2 * Math.PI) / (moon.orbitalPeriod * 30);
          const moonAngle = time * moonAngularSpeed;
          const mx = x + Math.cos(moonAngle) * moonOrbitRadius;
          const my = y + Math.sin(moonAngle) * moonOrbitRadius;

          // Moon orbit
          if (showOrbits) {
            ctx.beginPath();
            ctx.arc(x, y, moonOrbitRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 0.3;
            ctx.stroke();
          }

          // Moon
          ctx.beginPath();
          ctx.arc(mx, my, 2, 0, Math.PI * 2);
          ctx.fillStyle = moon.color;
          ctx.fill();
        });
      }

      // Draw label
      if (showLabels && zoom > 0.5) {
        ctx.fillStyle = body.type === 'dwarf' ? 'rgba(200, 200, 200, 0.7)' : 'rgba(255, 255, 255, 0.85)';
        ctx.font = body.type === 'dwarf' ? '9px sans-serif' : '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(body.nameRu, x, y + size + 14);
        ctx.textAlign = 'left';
      }
    });

  }, [offsetX, offsetY, zoom, showLabels, showOrbits, showMoons, showBelts, allBodies]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      if (isPlaying) {
        timeRef.current += speed;
      }
      draw(ctx, canvas.width, canvas.height);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, speed, draw]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const centerX = canvas.width / 2 + offsetX;
    const centerY = canvas.height / 2 + offsetY;
    const time = timeRef.current;

    // Check Sun click
    const sunDist = Math.sqrt((clickX - centerX) ** 2 + (clickY - centerY) ** 2);
    if (sunDist < 20) {
      setSelectedBody({ body: SUN, screenX: e.clientX, screenY: e.clientY });
      return;
    }

    // Check planet clicks
    for (const body of [...PLANETS, ...DWARF_PLANETS]) {
      const orbitRadius = getOrbitalRadius(body.distanceFromSun, zoom);
      const angularSpeed = (2 * Math.PI) / (body.orbitalPeriod * 60);
      const angle = time * angularSpeed;
      const x = centerX + Math.cos(angle) * orbitRadius;
      const y = centerY + Math.sin(angle) * orbitRadius;
      const size = getPlanetSize(body.radius, body.type);

      const dist = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2);
      if (dist < size + 10) {
        setSelectedBody({ body, screenX: e.clientX, screenY: e.clientY });
        return;
      }
    }

    setSelectedBody(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setOffsetX(prev => prev + dx);
      setOffsetY(prev => prev + dy);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.2, Math.min(5, prev * delta)));
  };

  const formatDistance = (distance: number): string => {
    if (distance >= 1000) return `${(distance / 1000).toFixed(1)} млрд км`;
    return `${distance.toFixed(1)} млн км`;
  };

  const formatPeriod = (period: number): string => {
    if (period >= 365.25) return `${(period / 365.25).toFixed(2)} лет`;
    return `${period.toFixed(1)} дней`;
  };

  const formatRadius = (radius: number): string => {
    return `${radius.toLocaleString()} км`;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a1a]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <h1 className="text-2xl font-bold text-white/90 tracking-wide">
          ☀️ Солнечная Система
        </h1>
        <p className="text-sm text-white/50 mt-1">Интерактивная демонстрация</p>
      </div>

      {/* Controls Panel */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10">
        {/* Play/Pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          title={isPlaying ? 'Пауза' : 'Воспроизведение'}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="4" height="12" rx="1" />
              <rect x="9" y="2" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <polygon points="3,1 14,8 3,15" />
            </svg>
          )}
        </button>

        {/* Speed Control */}
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-xs">Скорость:</span>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-24 h-1 accent-blue-400"
          />
          <span className="text-white/80 text-xs w-10">{speed.toFixed(1)}x</span>
        </div>

        {/* Zoom Control */}
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-xs">Масштаб:</span>
          <input
            type="range"
            min="0.2"
            max="5"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-24 h-1 accent-blue-400"
          />
          <span className="text-white/80 text-xs w-10">{zoom.toFixed(1)}x</span>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/20" />

        {/* Toggle buttons */}
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${showLabels ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30' : 'bg-white/5 text-white/40 border border-white/10'}`}
        >
          Названия
        </button>
        <button
          onClick={() => setShowOrbits(!showOrbits)}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${showOrbits ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30' : 'bg-white/5 text-white/40 border border-white/10'}`}
        >
          Орбиты
        </button>
        <button
          onClick={() => setShowMoons(!showMoons)}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${showMoons ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30' : 'bg-white/5 text-white/40 border border-white/10'}`}
        >
          Спутники
        </button>
        <button
          onClick={() => setShowBelts(!showBelts)}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${showBelts ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30' : 'bg-white/5 text-white/40 border border-white/10'}`}
        >
          Пояса
        </button>

        {/* Reset View */}
        <button
          onClick={() => { setOffsetX(0); setOffsetY(0); setZoom(1); }}
          className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-colors"
        >
          Сброс
        </button>
      </div>

      {/* Info Panel */}
      {selectedBody && (
        <div
          className="absolute bg-black/80 backdrop-blur-lg rounded-xl p-5 border border-white/15 max-w-xs shadow-2xl"
          style={{
            left: Math.min(selectedBody.screenX + 20, window.innerWidth - 320),
            top: Math.min(selectedBody.screenY - 50, window.innerHeight - 350),
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: selectedBody.body.color }}
              />
              <h2 className="text-lg font-bold text-white">{selectedBody.body.nameRu}</h2>
            </div>
            <button
              onClick={() => setSelectedBody(null)}
              className="text-white/50 hover:text-white transition-colors text-lg"
            >
              ✕
            </button>
          </div>

          <p className="text-white/60 text-sm mb-4">{selectedBody.body.description}</p>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Тип:</span>
              <span className="text-white/90">
                {selectedBody.body.type === 'star' ? 'Звезда' :
                 selectedBody.body.type === 'planet' ? 'Планета' : 'Карликовая планета'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Радиус:</span>
              <span className="text-white/90">{formatRadius(selectedBody.body.radius)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Расстояние от Солнца:</span>
              <span className="text-white/90">{formatDistance(selectedBody.body.distanceFromSun)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Орбитальный период:</span>
              <span className="text-white/90">
                {selectedBody.body.orbitalPeriod > 0 ? formatPeriod(selectedBody.body.orbitalPeriod) : '—'}
              </span>
            </div>
            {selectedBody.body.moons && selectedBody.body.moons.length > 0 && (
              <div className="pt-2 border-t border-white/10">
                <span className="text-white/50 text-sm">Спутники: </span>
                <span className="text-white/80 text-sm">
                  {selectedBody.body.moons.map(m => m.nameRu).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-16 right-4 bg-black/50 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-xs">
        <h3 className="text-white/70 font-semibold mb-2">Легенда</h3>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="text-white/60">Звезда</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <span className="text-white/60">Планеты</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            <span className="text-white/60">Карликовые планеты</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1.5 rounded bg-amber-800/50" />
            <span className="text-white/60">Пояс астероидов</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1.5 rounded bg-blue-300/30" />
            <span className="text-white/60">Пояс Койпера</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1.5 rounded bg-purple-300/20" />
            <span className="text-white/60">Облако Оорта</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-16 left-4 bg-black/50 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-xs text-white/50 max-w-48">
        <p className="mb-1">🖱️ Клик — информация</p>
        <p className="mb-1">🖱️ Перетаскивание — перемещение</p>
        <p>🔄 Колёсико — масштаб</p>
      </div>
    </div>
  );
}

export default App;
