import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameStatus, Player, Enemy, Bullet, Particle } from '../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SPEED,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_INVULN_TIME,
  PLAYER_INITIAL_HP,
  BULLET_SPEED,
  BULLET_WIDTH,
  BULLET_HEIGHT,
  FIRE_COOLDOWN,
  ENEMY_COLORS,
  ENEMY_BASE_HP,
} from '../constants';

interface GameCanvasProps {
  status: GameStatus;
  onGameOver: (score: number, enemiesKilled: number) => void;
  setScore: (score: number) => void;
  setHealth: (hp: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ status, onGameOver, setScore, setHealth }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs (Mutable for performance in game loop)
  const gameState = useRef({
    lastTime: 0,
    lastFireTime: 0,
    lastEnemySpawnTime: 0,
    score: 0,
    enemiesKilled: 0,
    spawnRate: 1500,
    keys: {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      Space: false,
      w: false,
      a: false,
      s: false,
      d: false,
    } as Record<string, boolean>,
  });

  const entities = useRef({
    player: null as Player | null,
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
  });

  const [isActive, setIsActive] = useState(false);

  // Initialize Game
  const initGame = useCallback(() => {
    gameState.current.score = 0;
    gameState.current.enemiesKilled = 0;
    gameState.current.spawnRate = 1500;
    gameState.current.lastTime = 0;
    gameState.current.lastFireTime = 0;
    gameState.current.lastEnemySpawnTime = 0;
    
    entities.current.player = {
      id: 'player',
      pos: { x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - 100 },
      vel: { dx: 0, dy: 0 },
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      color: '#3b82f6',
      markedForDeletion: false,
      hp: PLAYER_INITIAL_HP,
      invulnerableUntil: performance.now() + 1000,
    };
    entities.current.enemies = [];
    entities.current.bullets = [];
    entities.current.particles = [];
    
    setScore(0);
    setHealth(PLAYER_INITIAL_HP);
  }, [setScore, setHealth]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      initGame();
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [status, initGame]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameState.current.keys[e.key] = true;
      if(e.code === 'Space') gameState.current.keys['Space'] = true; // normalization
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.current.keys[e.key] = false;
      if(e.code === 'Space') gameState.current.keys['Space'] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Helpers
  const createExplosion = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      entities.current.particles.push({
        id: Math.random().toString(),
        pos: { x, y },
        vel: { dx: (Math.random() - 0.5) * 10, dy: (Math.random() - 0.5) * 10 },
        width: Math.random() * 4 + 2,
        height: Math.random() * 4 + 2,
        color: color,
        life: 1.0,
        maxLife: 1.0,
        markedForDeletion: false,
      });
    }
  };

  const spawnEnemy = (currentTime: number) => {
    if (currentTime - gameState.current.lastEnemySpawnTime > gameState.current.spawnRate) {
      const typeRoll = Math.random();
      let type: Enemy['type'] = 'scout';
      let width = 30;
      let height = 30;
      let speed = 2;
      let hp = ENEMY_BASE_HP;
      let color = ENEMY_COLORS.scout;
      let scoreVal = 100;

      if (typeRoll > 0.8) {
        type = 'bomber';
        width = 50;
        height = 40;
        speed = 1.5;
        hp = ENEMY_BASE_HP * 3;
        color = ENEMY_COLORS.bomber;
        scoreVal = 300;
      } else if (typeRoll > 0.5) {
        type = 'fighter';
        width = 35;
        height = 35;
        speed = 3.5;
        hp = ENEMY_BASE_HP * 2;
        color = ENEMY_COLORS.fighter;
        scoreVal = 150;
      }

      entities.current.enemies.push({
        id: Math.random().toString(),
        pos: { x: Math.random() * (CANVAS_WIDTH - width), y: -height },
        vel: { dx: 0, dy: speed },
        width,
        height,
        color,
        type,
        hp,
        scoreValue: scoreVal,
        markedForDeletion: false,
      });

      gameState.current.lastEnemySpawnTime = currentTime;
      // Difficulty ramp up
      gameState.current.spawnRate = Math.max(400, 1500 - gameState.current.score / 10);
    }
  };

  // Main Loop
  useEffect(() => {
    if (!isActive) return;

    let animationFrameId: number;

    const loop = (time: number) => {
      // Handle the case where lastTime is 0 (first frame) to avoid huge dt
      if (gameState.current.lastTime === 0) {
        gameState.current.lastTime = time;
      }

      const dt = time - gameState.current.lastTime;
      gameState.current.lastTime = time;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const player = entities.current.player;

      if (!canvas || !ctx || !player) return;

      // --- UPDATE ---

      // Player Movement
      if (gameState.current.keys['ArrowUp'] || gameState.current.keys['w']) player.pos.y -= PLAYER_SPEED;
      if (gameState.current.keys['ArrowDown'] || gameState.current.keys['s']) player.pos.y += PLAYER_SPEED;
      if (gameState.current.keys['ArrowLeft'] || gameState.current.keys['a']) player.pos.x -= PLAYER_SPEED;
      if (gameState.current.keys['ArrowRight'] || gameState.current.keys['d']) player.pos.x += PLAYER_SPEED;

      // Bounds checking
      player.pos.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.pos.x));
      player.pos.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.height, player.pos.y));

      // Player Shooting (Auto Fire)
      if (time - gameState.current.lastFireTime > FIRE_COOLDOWN) {
        entities.current.bullets.push({
          id: Math.random().toString(),
          pos: { x: player.pos.x + player.width / 2 - BULLET_WIDTH / 2, y: player.pos.y },
          vel: { dx: 0, dy: -BULLET_SPEED },
          width: BULLET_WIDTH,
          height: BULLET_HEIGHT,
          color: '#fbbf24',
          owner: 'player',
          damage: 1,
          markedForDeletion: false,
        });
        gameState.current.lastFireTime = time;
      }

      // Spawn Enemies
      spawnEnemy(time);

      // Update Bullets
      entities.current.bullets.forEach(b => {
        b.pos.y += b.vel.dy;
        if (b.pos.y < 0 || b.pos.y > CANVAS_HEIGHT) b.markedForDeletion = true;
      });

      // Update Enemies
      entities.current.enemies.forEach(e => {
        e.pos.y += e.vel.dy;
        if (e.pos.y > CANVAS_HEIGHT) {
           e.markedForDeletion = true;
           // Penalty for missing enemy? No, just no points.
        }

        // Collision: Enemy vs Player
        if (!player.markedForDeletion && 
            time > player.invulnerableUntil &&
            e.pos.x < player.pos.x + player.width &&
            e.pos.x + e.width > player.pos.x &&
            e.pos.y < player.pos.y + player.height &&
            e.pos.y + e.height > player.pos.y) {
              
            player.hp -= 1; // Lose 1 HP on collision
            setHealth(player.hp);
            player.invulnerableUntil = time + PLAYER_INVULN_TIME;
            createExplosion(e.pos.x + e.width/2, e.pos.y + e.height/2, '#ef4444', 10);
            e.markedForDeletion = true;

            if (player.hp <= 0) {
              player.markedForDeletion = true;
              createExplosion(player.pos.x + player.width/2, player.pos.y + player.height/2, '#3b82f6', 50);
              onGameOver(gameState.current.score, gameState.current.enemiesKilled);
            }
        }
      });

      // Collision: Bullets vs Enemies
      entities.current.bullets.forEach(b => {
        if (b.owner === 'player') {
          entities.current.enemies.forEach(e => {
            if (!b.markedForDeletion && !e.markedForDeletion &&
                b.pos.x < e.pos.x + e.width &&
                b.pos.x + b.width > e.pos.x &&
                b.pos.y < e.pos.y + e.height &&
                b.pos.y + b.height > e.pos.y) {
                  
              b.markedForDeletion = true;
              e.hp -= b.damage;
              createExplosion(b.pos.x, b.pos.y, '#fbbf24', 3);
              
              if (e.hp <= 0) {
                e.markedForDeletion = true;
                gameState.current.score += e.scoreValue;
                gameState.current.enemiesKilled += 1;
                
                // Gain 1 HP on kill
                player.hp += 1;
                
                setScore(gameState.current.score);
                setHealth(player.hp);
                createExplosion(e.pos.x + e.width/2, e.pos.y + e.height/2, e.color, 15);
              }
            }
          });
        }
      });

      // Update Particles
      entities.current.particles.forEach(p => {
        p.pos.x += p.vel.dx;
        p.pos.y += p.vel.dy;
        p.life -= 0.05;
        if (p.life <= 0) p.markedForDeletion = true;
      });

      // Filter deleted
      entities.current.bullets = entities.current.bullets.filter(e => !e.markedForDeletion);
      entities.current.enemies = entities.current.enemies.filter(e => !e.markedForDeletion);
      entities.current.particles = entities.current.particles.filter(e => !e.markedForDeletion);


      // --- DRAW ---
      ctx.fillStyle = '#0f172a'; // Background
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Starfield (Simple)
      ctx.fillStyle = '#ffffff';
      for(let i=0; i<50; i++) {
        const x = (i * 137 + time * 0.1) % CANVAS_WIDTH;
        const y = (i * 59 + time * 0.5) % CANVAS_HEIGHT;
        ctx.fillRect(x, y, 2, 2);
      }

      // Draw Player
      if (!player.markedForDeletion) {
        if (time > player.invulnerableUntil || Math.floor(time / 100) % 2 === 0) {
           // Draw Fighter Jet Shape
           ctx.save();
           ctx.translate(player.pos.x + player.width/2, player.pos.y + player.height/2);
           
           // Body
           ctx.fillStyle = player.color;
           ctx.beginPath();
           ctx.moveTo(0, -player.height/2); // Nose
           ctx.lineTo(player.width/4, 0); 
           ctx.lineTo(player.width/2, player.height/2); // Wing R
           ctx.lineTo(0, player.height/3); // Tail center
           ctx.lineTo(-player.width/2, player.height/2); // Wing L
           ctx.lineTo(-player.width/4, 0);
           ctx.closePath();
           ctx.fill();

           // Cockpit
           ctx.fillStyle = '#93c5fd';
           ctx.beginPath();
           ctx.ellipse(0, -player.height/6, 3, 8, 0, 0, Math.PI * 2);
           ctx.fill();

           // Engine Glow
           ctx.fillStyle = '#fbbf24';
           ctx.beginPath();
           ctx.moveTo(-5, player.height/3);
           ctx.lineTo(5, player.height/3);
           ctx.lineTo(0, player.height/2 + (Math.random() * 10));
           ctx.fill();

           ctx.restore();
        }
      }

      // Draw Enemies
      entities.current.enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.pos.x + e.width/2, e.pos.y + e.height/2);
        ctx.fillStyle = e.color;
        
        // Simple shape based on type
        ctx.beginPath();
        if (e.type === 'bomber') {
           ctx.moveTo(0, e.height/2);
           ctx.lineTo(e.width/2, -e.height/2);
           ctx.lineTo(-e.width/2, -e.height/2);
        } else {
           // Standard inverted triangle
           ctx.moveTo(0, e.height/2);
           ctx.lineTo(e.width/2, -e.height/2);
           ctx.lineTo(0, -e.height/4); // notch
           ctx.lineTo(-e.width/2, -e.height/2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // Draw Bullets
      entities.current.bullets.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.pos.x, b.pos.y, b.width, b.height);
      });

      // Draw Particles
      entities.current.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.pos.x, p.pos.y, p.width, p.height);
        ctx.globalAlpha = 1.0;
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive, onGameOver, setScore, setHealth]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="bg-slate-900 shadow-2xl rounded-lg cursor-none"
      style={{ maxWidth: '100%', maxHeight: '100vh', aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
    />
  );
};