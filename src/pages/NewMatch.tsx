import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { ArrowLeft, Play } from 'lucide-react';
import { cn } from '../lib/utils';

export default function NewMatch() {
  const navigate = useNavigate();
  const teams = useLiveQuery(() => db.teams.toArray());

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [teamAId, setTeamAId] = useState<number | ''>('');
  const [teamBId, setTeamBId] = useState<number | ''>('');
  const [referee, setReferee] = useState('');
  const [venue, setVenue] = useState('');
  const [tournament, setTournament] = useState('');
  
  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamAId === '' || teamBId === '' || teamAId === teamBId || !teams) return;

    const teamA = teams.find(t => t.id === teamAId);
    const teamB = teams.find(t => t.id === teamBId);

    if (!teamA || !teamB) return;

    const matchId = await db.matches.add({
      date,
      teamAId: teamA.id!,
      teamBId: teamB.id!,
      teamAName: teamA.name,
      teamBName: teamB.name,
      referee,
      venue,
      tournament,
      teamAScore: 0,
      teamBScore: 0,
      status: 'setup',
      timer: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    navigate(`/match/${matchId}/players`);
  };

  if (teams && teams.length < 2) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Not enough teams</h2>
        <p className="text-gray-500 mb-8">You need at least 2 teams created to start a match.</p>
        <button onClick={() => navigate('/teams')} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold">
          Manage Teams
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 md:p-8">
      <div className="max-w-xl w-full mx-auto bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 flex-1">
        <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft size={20} />
          <span className="font-medium">Back</span>
        </button>

        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8">Match Setup</h2>

        <form onSubmit={handleContinue} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Date *</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium" />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">Team A *</label>
              <select 
                required 
                value={teamAId} 
                onChange={e => setTeamAId(Number(e.target.value))}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium appearance-none"
              >
                <option value="" disabled>Select Team</option>
                {teams?.map(t => (
                  <option key={t.id} value={t.id} disabled={t.id === teamBId}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">Team B *</label>
              <select 
                required 
                value={teamBId} 
                onChange={e => setTeamBId(Number(e.target.value))}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium appearance-none"
              >
                <option value="" disabled>Select Team</option>
                {teams?.map(t => (
                  <option key={t.id} value={t.id} disabled={t.id === teamAId}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Referee Name</label>
            <input type="text" value={referee} onChange={e => setReferee(e.target.value)} placeholder="Optional"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Venue</label>
            <input type="text" value={venue} onChange={e => setVenue(e.target.value)} placeholder="Optional"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Tournament Name</label>
            <input type="text" value={tournament} onChange={e => setTournament(e.target.value)} placeholder="Optional"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium" />
          </div>

          <div className="pt-4">
            <button type="submit" disabled={teamAId === '' || teamBId === '' || teamAId === teamBId}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-4 rounded-xl font-bold text-lg transition-all active:scale-95 shadow-md">
              <span>Continue to Players</span>
              <Play size={20} fill="currentColor" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
