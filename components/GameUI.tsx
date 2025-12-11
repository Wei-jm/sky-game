import React, { useEffect, useState } from 'react';
import { GameStatus } from '../types';
import { Rocket, Skull, Trophy, Play, RotateCcw, Heart } from 'lucide-react';
import { generateMissionDebrief } from '../services/geminiService';

interface GameUIProps {
  status: GameStatus;
  score: number;
  health: number;
  finalStats: { score: number; kills: number; time: number } | null;
  startGame: () => void;
  resetGame: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({
  status,
  score,
  health,
  finalStats,
  startGame,
  resetGame,
}) => {
  const [debrief, setDebrief] = useState<string>('');
  const [loadingDebrief, setLoadingDebrief] = useState(false);

  useEffect(() => {
    if (status === GameStatus.GAME_OVER && finalStats) {
      setLoadingDebrief(true);
      setDebrief('');
      generateMissionDebrief(finalStats.score, finalStats.kills, finalStats.time)
        .then((text) => {
          setDebrief(text);
          setLoadingDebrief(false);
        });
    }
  }, [status, finalStats]);

  // HUD
  if (status === GameStatus.PLAYING) {
    return (
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-2">
          <div className="bg-slate-900/80 border border-slate-700 p-3 rounded-lg text-white backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="font-mono text-xl font-bold">{score.toString().padStart(6, '0')}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
           <div className="bg-slate-900/80 border border-slate-700 p-3 rounded-lg text-white backdrop-blur-sm min-w-[120px]">
             <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-slate-400 mr-3">Life Energy</span>
                <div className="flex items-center gap-2">
                   <Heart className={`w-4 h-4 ${health < 5 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`} fill="currentColor" />
                   <span className={`font-mono font-bold text-xl ${health < 5 ? 'text-red-500' : 'text-blue-400'}`}>{health}</span>
                </div>
             </div>
           </div>
        </div>
      </div>
    );
  }

  // START SCREEN
  if (status === GameStatus.MENU) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
        <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
                <Rocket className="w-10 h-10 text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">SKY ACE</h1>
          <p className="text-slate-400 mb-8">AI Dogfight Simulator</p>
          
          <div className="space-y-4 mb-8 text-left bg-slate-800/50 p-4 rounded-lg text-sm text-slate-300">
            <p className="flex items-center gap-2"><span className="bg-slate-700 px-2 py-0.5 rounded text-white font-mono">WASD / Arrows</span> to Move</p>
            <p className="flex items-center gap-2 text-yellow-400 font-bold">Autofire Engaged</p>
          </div>

          <button 
            onClick={startGame}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            ENGAGE HOSTILES
          </button>
        </div>
      </div>
    );
  }

  // GAME OVER
  if (status === GameStatus.GAME_OVER) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 backdrop-blur-md z-20">
        <div className="bg-slate-900 border border-red-900/50 p-8 rounded-2xl shadow-2xl max-w-lg w-full text-center relative overflow-hidden">
          {/* Animated Background Gradient */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>

          <div className="mb-6 flex justify-center">
             <Skull className="w-16 h-16 text-red-500" />
          </div>
          
          <h2 className="text-3xl font-black text-white mb-1">MISSION FAILED</h2>
          <p className="text-red-400 mb-6 uppercase tracking-widest text-sm">Aircraft Destroyed</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-slate-400 text-xs uppercase mb-1">Final Score</p>
              <p className="text-2xl font-mono font-bold text-white">{score}</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-slate-400 text-xs uppercase mb-1">Kills</p>
              <p className="text-2xl font-mono font-bold text-white">{finalStats?.kills || 0}</p>
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-lg mb-8 border border-slate-700/50 text-left">
            <p className="text-xs text-blue-400 uppercase font-bold mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              Commander's Debrief
            </p>
            <p className="text-slate-300 font-mono text-sm leading-relaxed min-h-[3rem]">
              {loadingDebrief ? (
                <span className="animate-pulse">Decoding encrypted transmission...</span>
              ) : debrief}
            </p>
          </div>

          <button 
            onClick={resetGame}
            className="w-full bg-white text-slate-900 hover:bg-slate-200 font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            RELAUNCH MISSION
          </button>
        </div>
      </div>
    );
  }

  return null;
};