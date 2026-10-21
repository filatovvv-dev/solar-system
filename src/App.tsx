import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { SUN, PLANETS, DWARF_PLANETS, BELTS, CelestialBody, Moon } from './data/solarSystem';

interface SelectedBody {
  body: CelestialBody;
  moon?: Moon;
  screenX: number;
  screenY: number;
}

// Scale functions for different modes
function getOrbitalRadiusCompressed(distanceFromSun: number, zoom: number): number {
  if (distanceFromSun <= 0) return 0;
  return (30 + 18 * Math.pow(distanceFromSun, 0.5)) * zoom;
}

function getOrbitalRadiusReal(distanceFromSun: number, zoom: number): number {
  if (distanceFromSun <= 0) return 0;
  // Real proportions: 1 million km = 0.15 pixels at zoom=1
  return distanceFromSun * 0.15 * zoom;
}

function getPlanetSize(radius: number, type: string): number {
  if (type === 'star') return 20;
  const size = Math.max(3, Math.min(16, Math.log10(radius + 1) * 3.5));
  return size;
}

// Generate stable random initial angles for each body
function generateInitialAngles(): Map<string, number> {
  const angles = new Map<string, number>();
  // Use a seeded pseudo-random for consistency
  let seed = 12345;
  const random = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return seed / 2147483647;
  };

  [...PLANETS, ...DWARF_PLANETS].forEach(body => {
    angles.set(body.name, random() * Math.PI * 2);
  });

  return angles;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const initialAngles = useMemo(() => generateInitialAngles(), []);

  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [zoom, setZoom] = useState(0.5);
  const [selectedBody, setSelectedBody] = useState<SelectedBody | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showMoons, setShowMoons] = useState(true);
  const [showBelts, setShowBelts] = useState(true);
  const [realScale, setRealScale] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const allBodies = [SUN, ...PLANETS, ...DWARF_PLANETS];

  // Wrapper that selects scale function based on mode
  const getOrbitalRadius = useCallback((distanceFromSun: number, zoom: number): number => {
    return realScale
      ? getOrbitalRadiusReal(distanceFromSun, zoom)
      : getOrbitalRadiusCompressed(distanceFromSun, zoom);
  }, [realScale]);

  // Calculate position of a body at current time
  const getBodyPosition = useCallback((body: CelestialBody, centerX: number, centerY: number, currentZoom: number, time: number) => {
    const orbitRadius = getOrbitalRadius(body.distanceFromSun, currentZoom);
    const initialAngle = initialAngles.get(body.name) || 0;
    const angularSpeed = (2 * Math.PI) / (body.orbitalPeriod * 60);
    const angle = initialAngle + time * angularSpeed;
    return {
      x: centerX + Math.cos(angle) * orbitRadius,
      y: centerY + Math.sin(angle) * orbitRadius,
      angle
    };
  }, [initialAngles, getOrbitalRadius]);

  // Calculate moon position relative to its parent
  const getMoonPosition = useCallback((
    parentX: number, parentY: number, parentSize: number,
    moon: Moon, moonIdx: number, time: number, currentZoom: number
  ) => {
    // Moon orbit radius scales with zoom and parent size
    const moonOrbitRadius = (parentSize + 8 + moonIdx * 7) * Math.max(0.7, currentZoom * 0.8);
    // Speed slows down dramatically when zoomed in: divide by zoom^1.5
    // Base factor 500 + zoom scaling ensures moons are catchable at any zoom
    const zoomSlowdown = Math.pow(currentZoom, 1.5);
    const moonAngularSpeed = (2 * Math.PI) / (moon.orbitalPeriod * 500 * zoomSlowdown);
    const moonAngle = time * moonAngularSpeed + moonIdx * 1.5; // offset each moon
    return {
      x: parentX + Math.cos(moonAngle) * moonOrbitRadius,
      y: parentY + Math.sin(moonAngle) * moonOrbitRadius,
      orbitRadius: moonOrbitRadius
    };
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2 + offsetX;
    const centerY = height / 2 + offsetY;
    const time = timeRef.current;

    // Clear canvas with space background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw stars background
    const starSeed = 42;
    for (let i = 0; i < 400; i++) {
      const sx = ((starSeed * (i + 1) * 7919) % width);
      const sy = ((starSeed * (i + 1) * 104729) % height);
      const brightness = 0.2 + ((i * 31) % 80) / 100;
      const size = i % 50 === 0 ? 1.5 : 1;
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.fillRect(sx, sy, size, size);
    }

    // Draw Oort Cloud (outermost)
    if (showBelts) {
      const oortRadius = getOrbitalRadius(BELTS.oortCloud.innerRadius, zoom);
      const gradient = ctx.createRadialGradient(centerX, centerY, oortRadius * 0.85, centerX, centerY, oortRadius);
      gradient.addColorStop(0, 'rgba(100, 100, 150, 0.01)');
      gradient.addColorStop(1, 'rgba(100, 100, 150, 0.04)');
      ctx.beginPath();
      ctx.arc(centerX, centerY, oortRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(100, 100, 200, 0.12)';
      ctx.setLineDash([2, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (showLabels && zoom >= 0.3) {
        ctx.fillStyle = 'rgba(150, 150, 200, 0.5)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Облако Оорта', centerX, centerY - oortRadius + 15);
        ctx.textAlign = 'left';
      }
    }

    // Draw Kuiper Belt
    if (showBelts) {
      const kuiperInner = getOrbitalRadius(BELTS.kuiperBelt.innerRadius, zoom);
      const kuiperOuter = getOrbitalRadius(BELTS.kuiperBelt.outerRadius, zoom);

      ctx.beginPath();
      ctx.arc(centerX, centerY, kuiperOuter, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, kuiperInner, 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(100, 149, 237, 0.05)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, kuiperInner, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.18)';
      ctx.setLineDash([3, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(centerX, centerY, kuiperOuter, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.18)';
      ctx.setLineDash([3, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (showLabels && zoom >= 0.3) {
        ctx.fillStyle = 'rgba(100, 149, 237, 0.6)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Пояс Койпера', centerX + kuiperInner * 0.7, centerY - kuiperInner * 0.7);
        ctx.textAlign = 'left';
      }
    }

    // Draw Asteroid Belt
    if (showBelts) {
      const asteroidInner = getOrbitalRadius(BELTS.asteroidBelt.innerRadius, zoom);
      const asteroidOuter = getOrbitalRadius(BELTS.asteroidBelt.outerRadius, zoom);

      ctx.beginPath();
      ctx.arc(centerX, centerY, asteroidOuter, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, asteroidInner, 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(139, 119, 101, 0.07)';
      ctx.fill();

      // Draw some asteroid dots
      for (let i = 0; i < 250; i++) {
        const baseAngle = (i / 250) * Math.PI * 2;
        const speed = 0.00005 * ((i % 5) + 1);
        const angle = baseAngle + time * speed;
        const r = asteroidInner + ((i * 137) % 100) / 100 * (asteroidOuter - asteroidInner);
        const ax = centerX + Math.cos(angle) * r;
        const ay = centerY + Math.sin(angle) * r;
        ctx.fillStyle = `rgba(160, 140, 120, ${0.3 + ((i * 7) % 40) / 100})`;
        ctx.fillRect(ax, ay, 1.2, 1.2);
      }

      if (showLabels) {
        ctx.fillStyle = 'rgba(160, 140, 120, 0.7)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Пояс астероидов', centerX + (asteroidInner + asteroidOuter) / 2, centerY - (asteroidInner + asteroidOuter) / 2 * 0.3);
        ctx.textAlign = 'left';
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
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(255, 255, 255, 0.12)';
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

      const pos = getBodyPosition(body, centerX, centerY, zoom, time);
      const size = getPlanetSize(body.radius, body.type);

      // Draw planet
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fillStyle = body.color;
      ctx.fill();

      // Draw glow for planets
      if (body.type === 'planet') {
        const glow = ctx.createRadialGradient(pos.x, pos.y, size * 0.5, pos.x, pos.y, size * 2.5);
        glow.addColorStop(0, body.color + '30');
        glow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Draw Saturn's rings
      if (body.name === 'Saturn') {
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y, size * 2.2, size * 0.5, 0.3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(210, 180, 140, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y, size * 1.8, size * 0.4, 0.3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(210, 180, 140, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw moons
      if (showMoons && body.moons) {
        body.moons.forEach((moon, moonIdx) => {
          const moonPos = getMoonPosition(pos.x, pos.y, size, moon, moonIdx, time, zoom);

          // Moon orbit line
          if (showOrbits) {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, moonPos.orbitRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.lineWidth = 0.3;
            ctx.stroke();
          }

          // Moon dot
          ctx.beginPath();
          ctx.arc(moonPos.x, moonPos.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = moon.color;
          ctx.fill();

          // Moon labels - only show when zoomed in enough
          if (showLabels && zoom >= 1.2) {
            ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(moon.nameRu, moonPos.x, moonPos.y + 10);
            ctx.textAlign = 'left';
          }
        });
      }

      // Draw planet label
      if (showLabels) {
        ctx.fillStyle = body.type === 'dwarf' ? 'rgba(200, 200, 200, 0.7)' : 'rgba(255, 255, 255, 0.85)';
        ctx.font = body.type === 'dwarf' ? '9px sans-serif' : '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(body.nameRu, pos.x, pos.y + size + 14);
        ctx.textAlign = 'left';
      }
    });

  }, [offsetX, offsetY, zoom, showLabels, showOrbits, showMoons, showBelts, allBodies, getBodyPosition, getMoonPosition, getOrbitalRadius]);

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
    if (isDragging.current) return;

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

    // Check planets and their moons
    for (const body of [...PLANETS, ...DWARF_PLANETS]) {
      const pos = getBodyPosition(body, centerX, centerY, zoom, time);
      const size = getPlanetSize(body.radius, body.type);

      // Check moons first (they're on top)
      // Hit radius grows with zoom so moons are easier to catch when zoomed in
      if (showMoons && body.moons) {
        const moonHitRadius = Math.max(12, 8 + zoom * 6);
        for (let moonIdx = 0; moonIdx < body.moons.length; moonIdx++) {
          const moon = body.moons[moonIdx];
          const moonPos = getMoonPosition(pos.x, pos.y, size, moon, moonIdx, time, zoom);
          const moonDist = Math.sqrt((clickX - moonPos.x) ** 2 + (clickY - moonPos.y) ** 2);
          if (moonDist < moonHitRadius) {
            setSelectedBody({ body, moon, screenX: e.clientX, screenY: e.clientY });
            return;
          }
        }
      }

      // Check planet click
      const dist = Math.sqrt((clickX - pos.x) ** 2 + (clickY - pos.y) ** 2);
      if (dist < size + 10) {
        setSelectedBody({ body, screenX: e.clientX, screenY: e.clientY });
        return;
      }
    }

    setSelectedBody(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      isDragging.current = false;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        isDragging.current = true;
      }
      setOffsetX(prev => prev + dx);
      setOffsetY(prev => prev + dy);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    // Small delay to prevent click after drag
    setTimeout(() => { isDragging.current = false; }, 50);
  };

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const oldZoom = zoomRef.current;
    const newZoom = Math.max(0.15, Math.min(6, oldZoom * delta));
    const k = newZoom / oldZoom;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    setZoom(newZoom);
    setOffsetX(prev => (mouseX - centerX) * (1 - k) + k * prev);
    setOffsetY(prev => (mouseY - centerY) * (1 - k) + k * prev);
  };

  const formatDistance = (distance: number): string => {
    if (distance >= 1000000) return `${(distance / 1000000).toFixed(2)} трлн км`;
    if (distance >= 1000) return `${(distance / 1000).toFixed(2)} млрд км`;
    return `${distance.toFixed(1)} млн км`;
  };

  const formatPeriod = (period: number): string => {
    if (period >= 365.25) return `${(period / 365.25).toFixed(2)} лет`;
    if (period >= 1) return `${period.toFixed(1)} дней`;
    return `${(period * 24).toFixed(1)} часов`;
  };

  const formatRadius = (radius: number): string => {
    return `${radius.toLocaleString()} км`;
  };

  const formatMoonDistance = (distance: number): string => {
    if (distance >= 1000000) return `${(distance / 1000000).toFixed(2)} млн км`;
    return `${distance.toLocaleString()} км`;
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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-3 bg-black/60 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10 max-w-[95vw]">
        {/* Play/Pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white shrink-0"
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
          <span className="text-white/60 text-xs whitespace-nowrap">Скорость:</span>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-20 h-1 accent-blue-400"
          />
          <span className="text-white/80 text-xs w-10">{speed.toFixed(1)}x</span>
        </div>

        {/* Zoom Control */}
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-xs whitespace-nowrap">Масштаб:</span>
          <input
            type="range"
            min="0.15"
            max="6"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-20 h-1 accent-blue-400"
          />
          <span className="text-white/80 text-xs w-10">{zoom.toFixed(2)}x</span>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/20 hidden sm:block" />

        {/* Toggle buttons */}
        <div className="flex gap-1.5 flex-wrap justify-center">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${showLabels ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30' : 'bg-white/5 text-white/40 border border-white/10'}`}
          >
            Названия
          </button>
          <button
            onClick={() => setShowOrbits(!showOrbits)}
            className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${showOrbits ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30' : 'bg-white/5 text-white/40 border border-white/10'}`}
          >
            Орбиты
          </button>
          <button
            onClick={() => setShowMoons(!showMoons)}
            className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${showMoons ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30' : 'bg-white/5 text-white/40 border border-white/10'}`}
          >
            Спутники
          </button>
          <button
            onClick={() => setShowBelts(!showBelts)}
            className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${showBelts ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30' : 'bg-white/5 text-white/40 border border-white/10'}`}
          >
            Пояса
          </button>
        </div>

        {/* Reset View */}
        <button
          onClick={() => { setOffsetX(0); setOffsetY(0); setZoom(0.5); }}
          className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-colors shrink-0"
        >
          Сброс
        </button>
      </div>

      {/* Info Panel */}
      {selectedBody && (
        <div
          className="absolute bg-black/80 backdrop-blur-lg rounded-xl p-5 border border-white/15 max-w-xs shadow-2xl z-50"
          style={{
            left: Math.min(Math.max(10, selectedBody.screenX + 20), window.innerWidth - 320),
            top: Math.min(Math.max(10, selectedBody.screenY - 50), window.innerHeight - 380),
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full shrink-0"
                style={{ backgroundColor: selectedBody.moon ? selectedBody.moon.color : selectedBody.body.color }}
              />
              <h2 className="text-lg font-bold text-white">
                {selectedBody.moon ? selectedBody.moon.nameRu : selectedBody.body.nameRu}
              </h2>
            </div>
            <button
              onClick={() => setSelectedBody(null)}
              className="text-white/50 hover:text-white transition-colors text-lg shrink-0 ml-2"
            >
              ✕
            </button>
          </div>

          {selectedBody.moon ? (
            // Moon info
            <>
              <p className="text-white/50 text-xs mb-3">
                Спутник планеты {selectedBody.body.nameRu}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Английское название:</span>
                  <span className="text-white/90">{selectedBody.moon.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Радиус:</span>
                  <span className="text-white/90">{formatRadius(selectedBody.moon.radius)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Расстояние от планеты:</span>
                  <span className="text-white/90">{formatMoonDistance(selectedBody.moon.distance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Орбитальный период:</span>
                  <span className="text-white/90">{formatPeriod(selectedBody.moon.orbitalPeriod)}</span>
                </div>
              </div>
            </>
          ) : (
            // Planet/Star info
            <>
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
            </>
          )}
        </div>
      )}

      {/* Scale Mode Toggle */}
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-xl p-3 border border-white/10">
        <button
          onClick={() => {
            const newMode = !realScale;
            setRealScale(newMode);
            // Auto-adjust zoom for better viewing
            if (newMode) {
              // Real scale: zoom out to see inner planets
              setZoom(0.15);
            } else {
              // Compressed scale: zoom in to see all planets
              setZoom(0.5);
            }
            setOffsetX(0);
            setOffsetY(0);
          }}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            realScale
              ? 'bg-orange-500/30 text-orange-300 border border-orange-400/30'
              : 'bg-blue-500/30 text-blue-300 border border-blue-400/30'
          }`}
        >
          {realScale ? '🌍 Реальные пропорции' : '📏 Сжатая шкала'}
        </button>
        <p className="text-white/40 text-xs mt-2 text-center">
          {realScale ? 'Внешние планеты очень далеко' : 'Все планеты видны'}
        </p>
      </div>

      {/* Legend */}
      <div className="absolute top-28 right-4 bg-black/50 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-xs">
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
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="text-white/60">Спутники</span>
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
        <p className="text-white/40 mt-2 pt-2 border-t border-white/10">
          Подписи спутников появляются при масштабе ≥ 1.2x
        </p>
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
