import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { ArrowLeft, Shield, Play } from 'lucide-react';
import { cn } from '../lib/utils';

export default function PlayerSetup() {
  const { id } = useParams();
  const navigate = useNavigate();
  const matchId = Number(id);

  const match = useLiveQuery(() => db.matches.get(matchId));
  const players = useLiveQuery(() => db.players.toArray());

  const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');

  if (!match || !players) return <div className="p-8 text-center">Loading match...</div>;

  const activeTeamId = activeTab === 'A' ? match.teamAId : match.teamBId;
  const teamPlayers = players.filter(p => p.teamId === activeTeamId) || [];

  const handleSetCaptain = async (playerId: number) => {
    const currentCaptain = teamPlayers.find(p => p.isCaptain);
    if (currentCaptain && currentCaptain.id) {
      await db.players.update(currentCaptain.id, { isCaptain: false });
    }
    await db.players.update(playerId, { isCaptain: true });
  };

  const handleStartMatch = async () => {
    await db.matches.update(matchId, { status: 'live' });
    navigate(`/match/${matchId}/live`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen max-h-screen">
      <div className="bg-white px-4 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-gray-900 text-center flex-1">Confirm Squad</h2>
        <button 
          onClick={handleStartMatch}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center space-x-1 shadow-sm active:scale-95 transition-all"
        >
          <span>Start</span>
          <Play size={16} fill="currentColor" />
        </button>
      </div>

      <div className="flex bg-white border-b border-gray-200 sticky top-[65px] z-10">
        <button 
          onClick={() => setActiveTab('A')}
          className={cn(
            "flex-1 py-4 text-center font-bold border-b-2 transition-colors",
            activeTab === 'A' ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          {match.teamAName} ({teamPlayers.length})
        </button>
        <button 
          onClick={() => setActiveTab('B')}
          className={cn(
            "flex-1 py-4 text-center font-bold border-b-2 transition-colors",
            activeTab === 'B' ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          {match.teamBName} ({teamPlayers.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        <div className="text-center text-sm text-gray-500 font-medium mb-4">
          Select the captain for this match.
        </div>
        
        <div className="space-y-3 flex-1 pb-10 max-w-xl w-full mx-auto">
          {teamPlayers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
              <p>No players in this team. Please go to Manage Teams to add players.</p>
            </div>
          ) : (
            teamPlayers.map(player => (
              <div key={player.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center justify-between group cursor-pointer" onClick={() => handleSetCaptain(player.id!)}>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-700">
                    {player.number}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{player.name}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={cn(
                    "p-2 rounded-full transition-colors flex items-center text-xs font-bold space-x-1",
                    player.isCaptain ? "bg-emerald-100 text-emerald-700" : "bg-gray-50 text-gray-300 group-hover:bg-gray-100"
                  )}>
                    <Shield size={16} fill={player.isCaptain ? "currentColor" : "none"} />
                    {player.isCaptain && <span>C</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
