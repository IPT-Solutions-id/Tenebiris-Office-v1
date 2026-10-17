import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useOffice } from '../../store/officeStore';
import { Agent, Workstation } from '../../types/office';
import { gridToIso, isoToGrid } from '../../utils/isoMath';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Shield, Flame, Compass } from 'lucide-react';

interface ChamberZone {
  id: string;
  name: string;
  center: { col: number; row: number };
}

const CHAMBER_ZONES: ChamberZone[] = [
  { id: 'supreme', name: 'Supreme Command Chamber', center: { col: 5, row: 5 } },
  { id: 'dev', name: 'Infernal Development Chamber', center: { col: 5, row: 2 } },
  { id: 'archive', name: 'Forbidden Knowledge Archive', center: { col: 2, row: 3 } },
  { id: 'cad', name: 'Shadow Rendering Studio', center: { col: 8, row: 5 } },
  { id: 'infra', name: 'Obsidian Infrastructure Chamber', center: { col: 2, row: 7 } },
  { id: 'council', name: 'Council of Agents', center: { col: 9, row: 3 } },
];

export const IsometricCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    agents,
    selectedAgentId,
    setSelectedAgentId,
    workstations,
    focusAgentWorkstation,
    cameraFocus,
    setCameraFocus,
    zoomLevel,
    setZoomLevel,
    targetFps,
    effectsEnabled,
  } = useOffice();

  // Camera viewport pan offset
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<string>('all');

  const animationFrameRef = useRef<number | null>(null);
  const ritualPulseRef = useRef<number>(0);

  // Tile dimensions (standard 2:1 isometric ratio)
  const tileWidth = 76;
  const tileHeight = 38;
  const gridSize = 13; // 13x13 expansive gothic cathedral hall

  // Smooth camera centering
  useEffect(() => {
    if (cameraFocus && canvasRef.current) {
      const canvas = canvasRef.current;
      const originX = canvas.width / 2;
      const originY = 120;
      const targetIso = gridToIso(cameraFocus.col, cameraFocus.row, {
        tileWidth,
        tileHeight,
        originX,
        originY,
      });

      setPanOffset({
        x: canvas.width / 2 - targetIso.x * zoomLevel,
        y: canvas.height / 2 - targetIso.y * zoomLevel - 40,
      });
    }
  }, [cameraFocus, zoomLevel]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    const frameInterval = 1000 / targetFps;

    const render = (currentTime: number) => {
      const elapsed = currentTime - lastTime;

      if (elapsed >= frameInterval) {
        lastTime = currentTime - (elapsed % frameInterval);
        ritualPulseRef.current = (ritualPulseRef.current + 0.035) % (Math.PI * 2);

        // Clear canvas
        ctx.fillStyle = '#09090F';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Apply Camera Transform
        ctx.translate(canvas.width / 2 + panOffset.x, 100 + panOffset.y);
        ctx.scale(zoomLevel, zoomLevel);

        // 1. Draw Cathedral Gothic Stone Wall Backdrop
        drawGothicBackdrop(ctx);

        // 2. Draw Isometric Floor Tiles
        drawFloorTiles(ctx);

        // 3. Draw Central Glowing Ritual Pentagram
        drawRitualPentagram(ctx, ritualPulseRef.current, effectsEnabled);

        // 4. Draw Gothic Stairs on Left with Crimson Runner
        drawGothicStaircase(ctx);

        // 5. Draw Chamber Features (Bookshelves, Server Racks, Desks)
        drawFurnitureAndFeatures(ctx, ritualPulseRef.current);

        // 6. Draw Agents with Depth Sorting & HUD tags
        drawAgentsAndHUD(ctx, ritualPulseRef.current);

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [panOffset, zoomLevel, agents, selectedAgentId, hoveredAgentId, targetFps, effectsEnabled]);

  // DRAW FUNCTIONS

  function drawGothicBackdrop(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Massive Stone Castle Rear Silhouette
    ctx.fillStyle = '#0B0912';
    ctx.beginPath();
    ctx.moveTo(-600, -140);
    ctx.lineTo(600, -140);
    ctx.lineTo(600, 320);
    ctx.lineTo(-600, 320);
    ctx.closePath();
    ctx.fill();

    // High Cathedral Rose Window with Radiant Crimson Light
    const winX = 0;
    const winY = -20;
    const radius = 70;

    const roseGrad = ctx.createRadialGradient(winX, winY, 15, winX, winY, radius * 1.4);
    roseGrad.addColorStop(0, 'rgba(215, 38, 61, 0.45)');
    roseGrad.addColorStop(0.5, 'rgba(158, 23, 44, 0.25)');
    roseGrad.addColorStop(1, 'rgba(73, 13, 27, 0)');
    ctx.fillStyle = roseGrad;
    ctx.beginPath();
    ctx.arc(winX, winY, radius * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Rose Window Stone Tracery
    ctx.strokeStyle = '#221C2F';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(winX, winY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#9E172C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(winX, winY, radius - 14, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      ctx.strokeStyle = i % 2 === 0 ? '#9E172C' : '#2C233D';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(winX, winY);
      ctx.lineTo(winX + Math.cos(angle) * (radius - 4), winY + Math.sin(angle) * (radius - 4));
      ctx.stroke();
    }

    // Gothic Pointed Arches on Walls
    drawPointedArch(ctx, -260, 20, 120, 160);
    drawPointedArch(ctx, 260, 20, 120, 160);
    drawPointedArch(ctx, -460, 50, 100, 140);
    drawPointedArch(ctx, 460, 50, 100, 140);

    // Stone Pillars & Wall Sconces with Animated Flames
    drawStonePillar(ctx, -380, 80);
    drawStonePillar(ctx, -140, 20);
    drawStonePillar(ctx, 140, 20);
    drawStonePillar(ctx, 380, 80);

    ctx.restore();
  }

  function drawPointedArch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();
    ctx.strokeStyle = '#282338';
    ctx.fillStyle = '#0B0912';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(x - w / 2, y + h);
    ctx.lineTo(x - w / 2, y);
    ctx.arcTo(x - w / 2, y - h / 2, x, y - h / 2, w / 2);
    ctx.arcTo(x + w / 2, y - h / 2, x + w / 2, y, w / 2);
    ctx.lineTo(x + w / 2, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner crimson candle glow
    const archGlow = ctx.createRadialGradient(x, y, 10, x, y, w);
    archGlow.addColorStop(0, 'rgba(215, 38, 61, 0.18)');
    archGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = archGlow;
    ctx.fill();

    ctx.restore();
  }

  function drawStonePillar(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    // Pillar Column
    ctx.fillStyle = '#1A1624';
    ctx.fillRect(x - 12, y - 100, 24, 140);

    // Capital & Base moldings
    ctx.fillStyle = '#2C263D';
    ctx.fillRect(x - 16, y - 106, 32, 8);
    ctx.fillRect(x - 16, y + 36, 32, 8);

    // Stone rib line
    ctx.strokeStyle = '#0E0C16';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 100);
    ctx.lineTo(x, y + 40);
    ctx.stroke();

    // Small gothic wall torch with flicker
    ctx.fillStyle = '#C69245';
    ctx.fillRect(x - 2, y - 40, 4, 12);
    ctx.fillStyle = '#D7263D';
    ctx.beginPath();
    ctx.arc(x, y - 45, 5 + Math.sin(ritualPulseRef.current * 3) * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawFloorTiles(ctx: CanvasRenderingContext2D) {
    const halfW = tileWidth / 2;
    const halfH = tileHeight / 2;

    for (let c = 0; c < gridSize; c++) {
      for (let r = 0; r < gridSize; r++) {
        const iso = gridToIso(c, r, { tileWidth, tileHeight, originX: 0, originY: 0 });

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(iso.x, iso.y);
        ctx.lineTo(iso.x + halfW, iso.y + halfH);
        ctx.lineTo(iso.x, iso.y + tileHeight);
        ctx.lineTo(iso.x - halfW, iso.y + halfH);
        ctx.closePath();

        // Check if inside ritual circle region (center around 5.5, 5.5)
        const distFromCenter = Math.sqrt(Math.pow(c - 5.5, 2) + Math.pow(r - 5.5, 2));
        const isRitualTile = distFromCenter <= 2.6;

        if (isRitualTile) {
          ctx.fillStyle = (c + r) % 2 === 0 ? '#220B16' : '#2D1220';
        } else {
          ctx.fillStyle = (c + r) % 2 === 0 ? '#110E18' : '#161322';
        }
        ctx.fill();

        // Stone flagstone dithering / noise dots for authentic gothic texture
        if ((c * 3 + r * 7) % 5 === 0) {
          ctx.fillStyle = 'rgba(158, 23, 44, 0.12)';
          ctx.fillRect(iso.x, iso.y + halfH, 2, 2);
        }
        if ((c * 7 + r * 3) % 4 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.fillRect(iso.x - 4, iso.y + halfH - 2, 1.5, 1.5);
        }

        // Tile border
        ctx.strokeStyle = isRitualTile ? 'rgba(158, 23, 44, 0.45)' : 'rgba(32, 27, 45, 0.75)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }
    }
  }

  function drawRitualPentagram(ctx: CanvasRenderingContext2D, pulse: number, effects: boolean) {
    // Center at grid (5.5, 5.5)
    const centerIso = gridToIso(5.5, 5.5, { tileWidth, tileHeight, originX: 0, originY: 0 });
    const cx = centerIso.x;
    const cy = centerIso.y + tileHeight / 2;
    const rX = 135;
    const rY = 68; // Isometric squashed ellipse

    ctx.save();

    // 1. Ethereal Ritual Glow
    if (effects) {
      const pulseFactor = 0.85 + Math.sin(pulse) * 0.15;
      const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, rX * 1.3);
      glow.addColorStop(0, `rgba(215, 38, 61, ${0.45 * pulseFactor})`);
      glow.addColorStop(0.5, `rgba(158, 23, 44, ${0.25 * pulseFactor})`);
      glow.addColorStop(1, 'rgba(9, 9, 15, 0)');

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rX * 1.25, rY * 1.25, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Outer Occult Circle Rings
    ctx.strokeStyle = '#9E172C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rX, rY, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#D7263D';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rX - 12, rY - 6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Inscribed Pentagram (flattened to isometric space)
    ctx.strokeStyle = '#D7263D';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#D7263D';
    ctx.shadowBlur = effects ? 10 : 0;

    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      points.push({
        x: cx + Math.cos(angle) * (rX - 18),
        y: cy + Math.sin(angle) * (rY - 9),
      });
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < 5; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Central pulsing ruby crystal core
    ctx.fillStyle = '#D7263D';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Ritual Candles surrounding the circle with flickering flame light
    const candleCount = 10;
    for (let i = 0; i < candleCount; i++) {
      const angle = (i * Math.PI * 2) / candleCount;
      const canX = cx + Math.cos(angle) * (rX + 8);
      const canY = cy + Math.sin(angle) * (rY + 4);

      // Candle base pillar
      ctx.fillStyle = '#490D1B';
      ctx.fillRect(canX - 2, canY - 6, 4, 8);

      // Candle flame with flicker
      const flicker = Math.sin(pulse * 4 + i) * 1.5;
      ctx.fillStyle = '#C69245';
      ctx.beginPath();
      ctx.ellipse(canX, canY - 9, 2 + flicker * 0.3, 4 + flicker * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flame tip
      ctx.fillStyle = '#D7263D';
      ctx.beginPath();
      ctx.arc(canX, canY - 8, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawGothicStaircase(ctx: CanvasRenderingContext2D) {
    // Grand gothic stone stairs ascending on the left
    ctx.save();
    const startIso = gridToIso(0, 4, { tileWidth, tileHeight, originX: 0, originY: 0 });
    const sx = startIso.x - 70;
    const sy = startIso.y - 20;

    for (let step = 0; step < 7; step++) {
      const stepX = sx - step * 14;
      const stepY = sy - step * 16;
      const stepW = 54;
      const stepH = 14;

      // Dark stone step
      ctx.fillStyle = '#1B1726';
      ctx.fillRect(stepX, stepY, stepW, stepH);

      // Crimson velvet runner carpet
      ctx.fillStyle = '#9E172C';
      ctx.fillRect(stepX + 12, stepY, stepW - 24, stepH);

      // Step edge highlight
      ctx.strokeStyle = '#2E273F';
      ctx.lineWidth = 1;
      ctx.strokeRect(stepX, stepY, stepW, stepH);
    }

    // Gothic Stone Arch doorway with radiant red glow at top of stairs
    const topX = sx - 7 * 14 + 10;
    const topY = sy - 7 * 16 - 30;

    const doorGlow = ctx.createRadialGradient(topX + 18, topY + 25, 5, topX + 18, topY + 25, 45);
    doorGlow.addColorStop(0, 'rgba(215, 38, 61, 0.6)');
    doorGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = doorGlow;
    ctx.fillRect(topX - 10, topY - 10, 60, 80);

    // Doorway frame
    ctx.strokeStyle = '#3A1521';
    ctx.lineWidth = 3;
    ctx.strokeRect(topX, topY, 36, 60);

    ctx.restore();
  }

  function drawFurnitureAndFeatures(ctx: CanvasRenderingContext2D, pulse: number) {
    // 1. Grimoire Bookshelves in Forbidden Knowledge Archive (col: 2, row: 1)
    drawBookshelf(ctx, 1.8, 1.8);
    drawBookshelf(ctx, 2.8, 1.2);

    // 2. Obsidian Server Rack Monolith in Infrastructure Chamber (col: 1, row: 8)
    drawServerRack(ctx, 1.2, 7.8, pulse);

    // 3. Workstations & Desks for each defined workstation
    workstations.forEach(ws => {
      drawWorkstationDesk(ctx, ws.position.col, ws.position.row, ws.screenGlow, ws.name);
    });
  }

  function drawBookshelf(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const iso = gridToIso(col, row, { tileWidth, tileHeight, originX: 0, originY: 0 });
    const x = iso.x - 22;
    const y = iso.y - 36;

    ctx.save();
    // Dark mahogany wooden shelf
    ctx.fillStyle = '#181216';
    ctx.fillRect(x, y, 44, 48);
    ctx.strokeStyle = '#490D1B';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 44, 48);

    // Shelves with colored grimoire spines
    const bookColors = ['#9E172C', '#C69245', '#39C5CF', '#490D1B', '#241329', '#E8E4E9'];
    for (let shelf = 0; shelf < 3; shelf++) {
      const sy = y + 8 + shelf * 14;
      ctx.fillStyle = '#2A1822';
      ctx.fillRect(x + 2, sy + 10, 40, 2);

      for (let b = 0; b < 6; b++) {
        ctx.fillStyle = bookColors[(shelf * 3 + b) % bookColors.length];
        ctx.fillRect(x + 4 + b * 6, sy, 5, 10);
      }
    }
    ctx.restore();
  }

  function drawServerRack(ctx: CanvasRenderingContext2D, col: number, row: number, pulse: number) {
    const iso = gridToIso(col, row, { tileWidth, tileHeight, originX: 0, originY: 0 });
    const x = iso.x - 18;
    const y = iso.y - 48;

    ctx.save();
    // Obsidian Server Chassis
    ctx.fillStyle = '#0B0A12';
    ctx.fillRect(x, y, 36, 60);
    ctx.strokeStyle = '#39C5CF';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, 36, 60);

    // Server blades & LED blinking arrays
    for (let blade = 0; blade < 5; blade++) {
      const by = y + 6 + blade * 11;
      ctx.fillStyle = '#1A1826';
      ctx.fillRect(x + 3, by, 30, 8);

      // Status diodes
      ctx.fillStyle = blade % 2 === 0 ? '#39C5CF' : '#D7263D';
      ctx.fillRect(x + 6, by + 3, 3, 3);
      ctx.fillStyle = (blade + Math.floor(pulse * 3)) % 3 === 0 ? '#C69245' : '#14121C';
      ctx.fillRect(x + 12, by + 3, 3, 3);
    }
    ctx.restore();
  }

  function drawWorkstationDesk(
    ctx: CanvasRenderingContext2D,
    col: number,
    row: number,
    glowColor: 'crimson' | 'cyan' | 'purple' | 'gold',
    name: string
  ) {
    const iso = gridToIso(col, row, { tileWidth, tileHeight, originX: 0, originY: 0 });
    const x = iso.x;
    const y = iso.y;

    ctx.save();

    // Dark Carved Wooden Desk (Isometric box)
    ctx.fillStyle = '#1E151A';
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x + 24, y + 6);
    ctx.lineTo(x, y + 18);
    ctx.lineTo(x - 24, y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#490D1B';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Desk Legs
    ctx.fillStyle = '#130C10';
    ctx.fillRect(x - 22, y + 6, 4, 14);
    ctx.fillRect(x + 18, y + 6, 4, 14);
    ctx.fillRect(x - 2, y + 18, 4, 14);

    // Glowing Computer Monitor Screen
    const screenColor =
      glowColor === 'cyan'
        ? '#39C5CF'
        : glowColor === 'purple'
        ? '#A855F7'
        : glowColor === 'gold'
        ? '#C69245'
        : '#D7263D';

    // Monitor stand & screen
    ctx.fillStyle = '#0B0A12';
    ctx.fillRect(x - 12, y - 22, 24, 16);
    ctx.strokeStyle = screenColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 12, y - 22, 24, 16);

    // Screen display glow
    ctx.fillStyle = screenColor;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(x - 10, y - 20, 20, 12);
    ctx.globalAlpha = 1;

    // Terminal scanlines on screen
    ctx.fillStyle = '#09090F';
    for (let sl = 0; sl < 3; sl++) {
      ctx.fillRect(x - 8, y - 18 + sl * 4, 16, 1.5);
    }

    ctx.restore();
  }

  function drawAgentsAndHUD(ctx: CanvasRenderingContext2D, pulse: number) {
    // Sort agents by depth (col + row) so foreground characters correctly overlap background objects
    const sorted = [...agents].sort((a, b) => {
      const da = a.position.col + a.position.row;
      const db = b.position.col + b.position.row;
      return da - db;
    });

    sorted.forEach(agent => {
      drawSingleAgent(ctx, agent, pulse);
    });
  }

  function drawSingleAgent(ctx: CanvasRenderingContext2D, agent: Agent, pulse: number) {
    const iso = gridToIso(agent.position.col, agent.position.row, {
      tileWidth,
      tileHeight,
      originX: 0,
      originY: 0,
    });
    const x = iso.x;
    const y = iso.y - 10;

    const isSelected = selectedAgentId === agent.id;
    const isHovered = hoveredAgentId === agent.id;
    const isMrSunan = agent.isPrimary;

    ctx.save();

    // 1. Selection Aura / Shadow Ring
    if (isSelected || isHovered) {
      ctx.strokeStyle = isMrSunan ? '#C69245' : '#D7263D';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.shadowColor = isMrSunan ? '#C69245' : '#D7263D';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(x, y + 24, 26, 13, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // Subtle ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(x, y + 24, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Pixel Art Character Sprite
    drawPixelCharacterSprite(ctx, x, y, agent, pulse);

    // 3. Floating HUD Badge (Matches the reference screenshot design!)
    drawAgentHUDTag(ctx, x, y - 36, agent, isSelected, isHovered);

    ctx.restore();
  }

  function drawPixelCharacterSprite(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    agent: Agent,
    pulse: number
  ) {
    const isCommander = agent.isPrimary;
    const idleBob = Math.sin(pulse * 2 + agent.position.col) * 1.5;

    ctx.save();
    ctx.translate(x, y + idleBob);

    // Commander Cape (Crimson / Obsidian)
    if (isCommander) {
      ctx.fillStyle = '#9E172C';
      ctx.beginPath();
      ctx.moveTo(-10, 4);
      ctx.lineTo(-14, 24);
      ctx.lineTo(14, 24);
      ctx.lineTo(10, 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#C69245';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Body / Robe / Armor
    ctx.fillStyle = isCommander ? '#1E1520' : '#14121C';
    ctx.fillRect(-8, 2, 16, 18);

    // Robe Trim / Accent color
    ctx.fillStyle = agent.spriteColor || '#D7263D';
    ctx.fillRect(-2, 4, 4, 16);

    // Character Head & Face
    ctx.fillStyle = '#E3C1A8'; // Skin tone
    ctx.fillRect(-6, -10, 12, 12);

    // Hair / Hood
    ctx.fillStyle = isCommander ? '#2A1F2D' : '#0B0A12';
    ctx.fillRect(-7, -13, 14, 6);
    ctx.fillRect(-7, -10, 3, 8);
    ctx.fillRect(4, -10, 3, 8);

    // Commander Gold Circlet / Crown
    if (isCommander) {
      ctx.fillStyle = '#C69245';
      ctx.fillRect(-6, -11, 12, 2.5);
      // Ruby gem
      ctx.fillStyle = '#D7263D';
      ctx.fillRect(-1.5, -12, 3, 3);
    }

    // Eyes
    ctx.fillStyle = isCommander ? '#D7263D' : '#39C5CF';
    ctx.fillRect(-4, -6, 2.5, 2.5);
    ctx.fillRect(1.5, -6, 2.5, 2.5);

    // Legs / Boots
    ctx.fillStyle = '#09080F';
    ctx.fillRect(-6, 20, 5, 6);
    ctx.fillRect(1, 20, 5, 6);

    ctx.restore();
  }

  function drawAgentHUDTag(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    agent: Agent,
    isSelected: boolean,
    isHovered: boolean
  ) {
    ctx.save();

    const tagWidth = 120;
    const tagHeight = 44;
    const tagX = x - tagWidth / 2;
    const tagY = y - tagHeight;

    // Background pill with dark charcoal and gothic border
    ctx.fillStyle = isSelected ? '#241329' : '#14121C';
    ctx.strokeStyle = isSelected
      ? '#D7263D'
      : isHovered
      ? '#C69245'
      : 'rgba(158, 23, 44, 0.6)';
    ctx.lineWidth = isSelected ? 1.5 : 1;

    // Rounded rectangle
    roundRect(ctx, tagX, tagY, tagWidth, tagHeight, 4);
    ctx.fill();
    ctx.stroke();

    // Left Avatar circle / square icon
    const iconX = tagX + 16;
    const iconY = tagY + tagHeight / 2;
    ctx.fillStyle = '#09090F';
    ctx.beginPath();
    ctx.arc(iconX, iconY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = agent.isPrimary ? '#C69245' : '#D7263D';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Mini icon face
    ctx.fillStyle = agent.isPrimary ? '#C69245' : '#39C5CF';
    ctx.fillRect(iconX - 4, iconY - 4, 8, 8);

    // Text labels
    ctx.textAlign = 'left';

    // Agent Name
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.fillStyle = '#E8E4E9';
    ctx.fillText(agent.name, tagX + 34, tagY + 14);

    // Agent Role
    ctx.font = '9px Inter, sans-serif';
    ctx.fillStyle = '#A69EA9';
    const roleTruncated =
      agent.role.length > 14 ? agent.role.substring(0, 13) + '..' : agent.role;
    ctx.fillText(roleTruncated, tagX + 34, tagY + 26);

    // Status badge (e.g. "Coding...", "Rendering...", "Searching...")
    const statusText = agent.currentAction || 'Online';
    const truncatedStatus =
      statusText.length > 15 ? statusText.substring(0, 14) + '..' : statusText;

    ctx.font = 'bold 8.5px "Fira Code", monospace';
    ctx.fillStyle = agent.isPrimary ? '#C69245' : '#39C5CF';
    ctx.fillText(truncatedStatus, tagX + 34, tagY + 37);

    // Connecting downward anchor tick to character
    ctx.strokeStyle = isSelected ? '#D7263D' : 'rgba(158, 23, 44, 0.6)';
    ctx.beginPath();
    ctx.moveTo(x, tagY + tagHeight);
    ctx.lineTo(x, tagY + tagHeight + 5);
    ctx.stroke();

    ctx.restore();
  }

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // MOUSE & TOUCH INTERACTION

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // Check hit testing on agents
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Transform mouse into world coordinates
    const worldX = (mouseX - (canvas.width / 2 + panOffset.x)) / zoomLevel;
    const worldY = (mouseY - (140 + panOffset.y)) / zoomLevel;

    let hitAgent: Agent | null = null;
    for (const agent of agents) {
      const iso = gridToIso(agent.position.col, agent.position.row, {
        tileWidth,
        tileHeight,
        originX: 0,
        originY: 0,
      });

      // Bounding box of character and HUD tag
      const dx = Math.abs(worldX - iso.x);
      const dy = worldY - (iso.y - 20);

      if (dx < 65 && dy > -65 && dy < 35) {
        hitAgent = agent;
        break;
      }
    }

    setHoveredAgentId(hitAgent ? hitAgent.id : null);
    canvas.style.cursor = hitAgent ? 'pointer' : isDragging ? 'grabbing' : 'grab';
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - (canvas.width / 2 + panOffset.x)) / zoomLevel;
    const worldY = (mouseY - (140 + panOffset.y)) / zoomLevel;

    for (const agent of agents) {
      const iso = gridToIso(agent.position.col, agent.position.row, {
        tileWidth,
        tileHeight,
        originX: 0,
        originY: 0,
      });

      const dx = Math.abs(worldX - iso.x);
      const dy = worldY - (iso.y - 20);

      if (dx < 65 && dy > -65 && dy < 35) {
        focusAgentWorkstation(agent.id);
        return;
      }
    }
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(Math.max(0.65, prev + delta), 2.2));
  };

  const resetCamera = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1);
    setCameraFocus(null);
  };

  const handleChamberSelect = (chamber: ChamberZone) => {
    setActiveZone(chamber.id);
    setCameraFocus(chamber.center);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#09090F] overflow-hidden">
      {/* 2.5D Isometric Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        className="w-full h-full block touch-none"
      />

      {/* Floating Room / Chamber Selector bar */}
      <div className="absolute top-3 left-4 flex flex-wrap gap-1.5 z-10 max-w-[calc(100%-140px)]">
        {CHAMBER_ZONES.map(z => {
          const isActive = activeZone === z.id;
          return (
            <button
              key={z.id}
              onClick={() => handleChamberSelect(z)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                isActive
                  ? 'bg-[#490D1B] text-[#E8E4E9] border border-[#9E172C] shadow-[0_0_8px_rgba(215,38,61,0.4)]'
                  : 'bg-[#14121C]/80 backdrop-blur text-[#A69EA9] hover:text-[#E8E4E9] border border-[#9E172C]/30 hover:border-[#9E172C]'
              }`}
            >
              {z.name}
            </button>
          );
        })}
      </div>

      {/* Floating Canvas Controls (Zoom In, Zoom Out, Reset, Center on Mr Sunan) */}
      <div className="absolute top-3 right-4 flex items-center space-x-1.5 z-10 bg-[#14121C]/80 backdrop-blur p-1 rounded border border-[#9E172C]/40">
        <button
          onClick={() => handleZoom(0.15)}
          className="p-1.5 rounded hover:bg-[#490D1B] text-[#E8E4E9] transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.15)}
          className="p-1.5 rounded hover:bg-[#490D1B] text-[#E8E4E9] transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetCamera}
          className="p-1.5 rounded hover:bg-[#490D1B] text-[#E8E4E9] transition-all"
          title="Reset Camera"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            const mrSunan = agents.find(a => a.isPrimary);
            if (mrSunan) focusAgentWorkstation(mrSunan.id);
          }}
          className="p-1.5 rounded bg-[#490D1B]/60 hover:bg-[#9E172C] text-[#C69245] hover:text-[#E8E4E9] transition-all"
          title="Center on Mr Sunan (Supreme Command)"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Subtle bottom legend helper */}
      <div className="absolute bottom-2 left-4 text-[10px] text-[#A69EA9]/60 font-mono pointer-events-none">
        Drag to Pan · Scroll or + / - to Zoom · Click any Agent to open Workstation & Inspector
      </div>
    </div>
  );
};
