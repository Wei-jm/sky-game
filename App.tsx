import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { GameStatus } from './types';

function App() {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  
  // Stats for the game over screen
  const [finalStats, setFinalStats] = useState<{ score: number; kills: number; time: number } | null>(null);
  const [startTime, setStartTime] = useState(0);

  const startGame = () => {
    setStatus(GameStatus.PLAYING);
    setScore(0);
    setHealth(100);
    setStartTime(Date.now());
  };

  const resetGame = () => {
    setStatus(GameStatus.PLAYING);
    setScore(0);
    setHealth(100);
    setStartTime(Date.now());
  };

  const handleGameOver = (finalScore: number, enemiesKilled: number) => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    setFinalStats({ score: finalScore, kills: enemiesKilled, time: duration });
    setStatus(GameStatus.GAME_OVER);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans select-none overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute top-10 left-10 w-96 h-96 bg-blue-600 rounded-full blur-[128px]"></div>
         <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600 rounded-full blur-[128px]"></div>
      </div>
      
      {/* Scanline Effect */}
      <div className="scanline pointer-events-none z-10"></div>

      <div className="relative z-0 border-4 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-black">
        <GameCanvas 
          status={status}
          onGameOver={handleGameOver}
          setScore={setScore}
          setHealth={setHealth}
        />
        
        <GameUI 
          status={status}
          score={score}
          health={health}
          finalStats={finalStats}
          startGame={startGame}
          resetGame={resetGame}
        />
      </div>

      <div className="mt-4 text-slate-500 text-xs font-mono">
        SKY ACE v1.0 • SYSTEM READY
      </div>
    </div>
  );
}

export default App;
