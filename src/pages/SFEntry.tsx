import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Play } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SFEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const matchId = Number(id);

  const match = useLiveQuery(() => db.matches.get(matchId));
  const players = useLiveQuery(() => db.players.toArray());
  const existingSfRecords = useLiveQuery(() => db.sfRecords.where({ matchId }).toArray(), [matchId]);

  const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');

  if (!match || !players || existingSfRecords === undefined) return <div className="p-8">Loading...</div>;

  const activeTeamId = activeTab === 'A' ? match.teamAId : match.teamBId;
  const teamPlayers = players.filter(p => p.teamId === activeTeamId);

  const handleSfChange = async (playerId: number, value: string) => {
    const existing = existingSfRecords.find(r => r.playerId === playerId);
    if (existing) {
      if (value) {
        await db.sfRecords.update(existing.id!, { value });
      } else {
        await db.sfRecords.delete(existing.id!);
      }
    } else {
      if (value) {
        await db.sfRecords.add({
          matchId,
          team: activeTab,
          playerId,
          value
        });
      }
    }
  };

  const getSfValue = (playerId: number) => {
    const record = existingSfRecords.find(r => r.playerId === playerId);
    return record?.value || '';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white px-4 py-4 border-b border-gray-200 sticky top-0 z-10 text-center shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Enter S/F Values</h2>
      </div>

      <div className="flex bg-white border-b border-gray-200 sticky top-[60px] z-10">
        <button 
          onClick={() => setActiveTab('A')}
          className={cn(
            "flex-1 py-4 text-center font-bold border-b-2 transition-colors",
            activeTab === 'A' ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500"
          )}
        >
          {match.teamAName}
        </button>
        <button 
          onClick={() => setActiveTab('B')}
          className={cn(
            "flex-1 py-4 text-center font-bold border-b-2 transition-colors",
            activeTab === 'B' ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500"
          )}
        >
          {match.teamBName}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        <p className="text-sm text-gray-500 font-bold mb-4 uppercase tracking-wider text-center">
          Optional S/F fields for players
        </p>

        {teamPlayers.map(player => (
          <div key={player.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-700">
                {player.number}
              </div>
              <div className="font-bold text-gray-900">{player.name}</div>
            </div>
            
            <input 
              type="text"
              placeholder="S/F"
              value={getSfValue(player.id!)}
              onChange={(e) => handleSfChange(player.id!, e.target.value)}
              className="w-20 bg-gray-50 border border-gray-200 rounded-lg p-2 font-bold text-center focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <button 
          onClick={() => navigate(`/match/${matchId}/signatures`)}
          className="w-full flex items-center justify-center space-x-2 bg-emerald-600 active:bg-emerald-700 text-white p-4 rounded-xl font-bold text-lg transition-transform active:scale-95 shadow-md"
        >
          <span>Continue to Signatures</span>
          <Play size={20} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
