import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Player } from '../lib/db';
import { Play, Pause, Square, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function LiveMatch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const matchId = Number(id);

  const match = useLiveQuery(() => db.matches.get(matchId));
  const players = useLiveQuery(() => db.players.toArray());
  const goals = useLiveQuery(() => db.goals.where({ matchId }).reverse().sortBy('createdAt'), [matchId]);

  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<number | null>(null);

  const [scoringTeam, setScoringTeam] = useState<'A' | 'B' | null>(null);

  useEffect(() => {
    if (match && match.timer !== undefined && !timerRef.current && timer === 0) {
      setTimer(match.timer);
    }
  }, [match]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(prev => {
          const next = prev + 1;
          if (next % 5 === 0) {
            db.matches.update(matchId, { timer: next });
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, matchId]);

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      db.matches.update(matchId, { timer });
    } else {
      setIsRunning(true);
    }
  };

  const handleEndMatch = async () => {
    if (window.confirm('Are you sure you want to end this match?')) {
      setIsRunning(false);
      await db.matches.update(matchId, { status: 'finished', timer });
      navigate(`/match/${matchId}/sf`);
    }
  };

  const handleGoalClick = (team: 'A' | 'B') => {
    setScoringTeam(team);
  };

  const handlePlayerSelect = async (player: Player) => {
    if (!scoringTeam || !match) return;

    await db.goals.add({
      matchId,
      team: scoringTeam,
      playerId: player.id!,
      matchTime: formatTime(timer),
      createdAt: new Date().toISOString()
    });

    const newScore = (scoringTeam === 'A' ? match.teamAScore : match.teamBScore) + 1;
    await db.matches.update(matchId, {
      [scoringTeam === 'A' ? 'teamAScore' : 'teamBScore']: newScore,
      timer 
    });

    setScoringTeam(null);
  };

  const handleDeleteGoal = async (goalId: number, team: 'A' | 'B') => {
    if (window.confirm('Delete this goal?')) {
      await db.goals.delete(goalId);
      if (match) {
        const newScore = Math.max(0, (team === 'A' ? match.teamAScore : match.teamBScore) - 1);
        await db.matches.update(matchId, {
          [team === 'A' ? 'teamAScore' : 'teamBScore']: newScore
        });
      }
    }
  };

  if (!match || !players) return <div className="p-8 text-center text-xl">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans select-none">
      <div className="bg-gray-900 text-white p-4 flex flex-col items-center shadow-lg z-10 sticky top-0">
        <div className="text-6xl font-extrabold tracking-tighter mb-4 tabular-nums">
          {formatTime(timer)}
        </div>
        <div className="flex gap-4 w-full max-w-sm">
          <button 
            onClick={toggleTimer}
            className={cn(
              "flex-1 py-4 rounded-2xl flex items-center justify-center space-x-2 font-bold text-xl active:scale-95 transition-transform",
              isRunning ? "bg-amber-500 text-amber-950" : "bg-emerald-500 text-emerald-950"
            )}
          >
            {isRunning ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
            <span>{isRunning ? 'PAUSE' : 'START'}</span>
          </button>
          <button 
            onClick={handleEndMatch}
            className="flex-1 py-4 bg-red-600 text-white rounded-2xl flex items-center justify-center space-x-2 font-bold text-xl active:scale-95 transition-transform"
          >
            <Square size={24} fill="currentColor" />
            <span>END</span>
          </button>
        </div>
      </div>

      <div className="flex bg-white shadow-sm border-b border-gray-200">
        <div className="flex-1 p-6 flex flex-col items-center justify-center border-r border-gray-200">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 text-center line-clamp-1">{match.teamAName}</div>
          <div className="text-7xl font-black text-gray-900 tabular-nums">{match.teamAScore}</div>
        </div>
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 text-center line-clamp-1">{match.teamBName}</div>
          <div className="text-7xl font-black text-gray-900 tabular-nums">{match.teamBScore}</div>
        </div>
      </div>

      <div className="flex gap-4 p-4">
        <button 
          onClick={() => handleGoalClick('A')}
          className="flex-1 bg-blue-600 active:bg-blue-700 text-white p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center active:scale-95 transition-transform"
        >
          <span className="text-3xl font-black tracking-wider uppercase mb-1">GOAL</span>
          <span className="text-sm font-bold opacity-80">{match.teamAName}</span>
        </button>
        <button 
          onClick={() => handleGoalClick('B')}
          className="flex-1 bg-rose-600 active:bg-rose-700 text-white p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center active:scale-95 transition-transform"
        >
          <span className="text-3xl font-black tracking-wider uppercase mb-1">GOAL</span>
          <span className="text-sm font-bold opacity-80">{match.teamBName}</span>
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-4 px-2">Match Events</h3>
        <div className="space-y-3">
          {goals?.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No events yet</div>
          ) : (
            goals?.map(goal => {
              const player = players.find(p => p.id === goal.playerId);
              return (
                <div key={goal.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-xl font-black text-gray-900 w-16">{goal.matchTime}</div>
                    <div className="text-xl">⚽</div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg">
                        <span className="text-gray-500 mr-2">#{player?.number}</span>
                        {player?.name}
                      </div>
                      <div className="text-sm text-gray-500 font-bold">
                        {goal.team === 'A' ? match.teamAName : match.teamBName}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteGoal(goal.id!, goal.team)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-full transition-colors active:bg-red-100"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {scoringTeam && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col p-4">
          <div className="flex justify-between items-center mb-6 pt-4 px-2">
            <h2 className="text-3xl font-black text-white">WHO SCORED?</h2>
            <button 
              onClick={() => setScoringTeam(null)}
              className="bg-white/20 p-3 rounded-full text-white active:bg-white/30"
            >
              <X size={32} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pb-8">
            <div className="grid grid-cols-2 gap-3">
              {players.filter(p => p.teamId === (scoringTeam === 'A' ? match.teamAId : match.teamBId)).map(player => (
                <button
                  key={player.id}
                  onClick={() => handlePlayerSelect(player)}
                  className="bg-white active:bg-gray-200 p-5 rounded-2xl flex flex-col items-center justify-center space-y-2 active:scale-95 transition-transform"
                >
                  <span className="text-3xl font-black text-gray-800">#{player.number}</span>
                  <span className="text-lg font-bold text-gray-600 text-center line-clamp-1 w-full">{player.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
