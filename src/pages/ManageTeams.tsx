import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Team, type Player } from '../lib/db';
import { ArrowLeft, Plus, Users, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ManageTeams() {
  const navigate = useNavigate();
  const teams = useLiveQuery(() => db.teams.toArray());
  const players = useLiveQuery(() => db.players.toArray());

  const [newTeamName, setNewTeamName] = useState('');
  const [activeTeamId, setActiveTeamId] = useState<number | null>(null);
  
  const [newPlayerNum, setNewPlayerNum] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');

  // Auto-select first team
  useEffect(() => {
    if (teams && teams.length > 0 && activeTeamId === null) {
      setActiveTeamId(teams[0].id!);
    }
  }, [teams, activeTeamId]);

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || teams?.length === 6) return; // Limit to 6 teams

    const id = await db.teams.add({ name: newTeamName.trim() });
    setNewTeamName('');
    setActiveTeamId(id);
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (window.confirm('Delete this team and all its players?')) {
      await db.teams.delete(teamId);
      await db.players.where({ teamId }).delete();
      if (activeTeamId === teamId) setActiveTeamId(null);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeamId || !newPlayerNum.trim() || !newPlayerName.trim()) return;

    const teamPlayers = players?.filter(p => p.teamId === activeTeamId) || [];
    if (teamPlayers.length >= 5) {
      alert("This team already has 5 players.");
      return;
    }

    await db.players.add({
      teamId: activeTeamId,
      number: newPlayerNum.trim(),
      name: newPlayerName.trim(),
      isCaptain: teamPlayers.length === 0
    });

    setNewPlayerNum('');
    setNewPlayerName('');
    document.getElementById('playerNumInput')?.focus();
  };

  const handleDeletePlayer = async (playerId: number) => {
    await db.players.delete(playerId);
  };

  if (!teams || !players) return <div className="p-8 text-center">Loading...</div>;

  const activeTeamPlayers = players.filter(p => p.teamId === activeTeamId);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row h-screen">
      
      {/* Sidebar: Teams List */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-1/3 md:h-full">
        <div className="p-4 border-b border-gray-200 flex items-center space-x-3 bg-gray-900 text-white sticky top-0 z-10">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-bold text-lg flex-1">Teams ({teams.length}/6)</h2>
        </div>

        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleAddTeam} className="flex space-x-2">
            <input 
              type="text" 
              placeholder="New Team Name" 
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              disabled={teams.length >= 6}
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            <button 
              type="submit" 
              disabled={!newTeamName.trim() || teams.length >= 6}
              className="bg-emerald-600 text-white p-2 rounded-lg disabled:opacity-50 hover:bg-emerald-700"
            >
              <Plus size={20} />
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto">
          {teams.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No teams added yet.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {teams.map(team => (
                <div 
                  key={team.id}
                  onClick={() => setActiveTeamId(team.id!)}
                  className={cn(
                    "p-4 flex items-center justify-between cursor-pointer transition-colors",
                    activeTeamId === team.id ? "bg-emerald-50 border-l-4 border-emerald-500" : "hover:bg-gray-50 border-l-4 border-transparent"
                  )}
                >
                  <span className="font-bold text-gray-800">{team.name}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                      {players.filter(p => p.teamId === team.id).length}/5
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id!); }}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Players List */}
      <div className="flex-1 bg-gray-50 flex flex-col h-2/3 md:h-full">
        {activeTeamId ? (
          <>
            <div className="p-6 bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm flex items-center space-x-3">
              <Users className="text-emerald-600" size={24} />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {teams.find(t => t.id === activeTeamId)?.name} Squad
                </h2>
                <p className="text-sm text-gray-500 font-medium">{activeTeamPlayers.length} / 5 Players</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col max-w-2xl mx-auto w-full">
              <form onSubmit={handleAddPlayer} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex gap-3 mb-8 shrink-0">
                <input 
                  id="playerNumInput"
                  type="number" 
                  placeholder="#" 
                  value={newPlayerNum}
                  onChange={e => setNewPlayerNum(e.target.value)}
                  disabled={activeTeamPlayers.length >= 5}
                  className="w-20 bg-gray-50 border border-gray-300 rounded-xl p-3 font-bold text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
                />
                <input 
                  type="text" 
                  placeholder="Player Name" 
                  value={newPlayerName}
                  onChange={e => setNewPlayerName(e.target.value)}
                  disabled={activeTeamPlayers.length >= 5}
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-xl p-3 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={!newPlayerNum || !newPlayerName || activeTeamPlayers.length >= 5}
                  className="bg-emerald-600 text-white p-3 px-6 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  Add
                </button>
              </form>

              <div className="space-y-3 pb-10">
                {activeTeamPlayers.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                    <Users size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No players added to this team yet.</p>
                  </div>
                ) : (
                  activeTeamPlayers.map(player => (
                    <div key={player.id} className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-black text-gray-800 text-lg">
                          {player.number}
                        </div>
                        <div className="font-bold text-gray-900 text-lg">{player.name}</div>
                      </div>
                      
                      <button 
                        onClick={() => handleDeletePlayer(player.id!)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-full transition-colors active:bg-red-100"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col space-y-4">
            <Users size={64} className="opacity-20" />
            <p className="font-medium">Select a team to manage its players</p>
          </div>
        )}
      </div>
    </div>
  );
}
