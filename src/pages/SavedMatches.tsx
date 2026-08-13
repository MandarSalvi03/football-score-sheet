import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { ArrowLeft, Trash2, Eye } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SavedMatches() {
  const navigate = useNavigate();
  const matches = useLiveQuery(() => db.matches.reverse().sortBy('createdAt'));

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this match?')) {
      await db.matches.delete(id);
      await db.goals.where({ matchId: id }).delete();
      await db.sfRecords.where({ matchId: id }).delete();
      await db.signatures.where({ matchId: id }).delete();
    }
  };

  const handleMatchClick = (id: number, status: string) => {
    if (status === 'finished') {
      navigate(`/match/${id}/end`);
    } else if (status === 'live') {
      navigate(`/match/${id}/live`);
    } else {
      navigate(`/match/${id}/players`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 md:p-8">
      <div className="max-w-xl w-full mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full bg-white shadow-sm border border-gray-100">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Saved Matches</h2>
        </div>

        <div className="space-y-4">
          {!matches ? (
            <div className="text-center p-8">Loading...</div>
          ) : matches.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl shadow-sm text-center border border-gray-100">
              <div className="text-gray-400 mb-2">No matches saved yet.</div>
            </div>
          ) : (
            matches.map((match) => (
              <div 
                key={match.id} 
                onClick={() => handleMatchClick(match.id!, match.status)}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="text-sm font-bold text-gray-500">{match.date}</div>
                  <div className={cn(
                    "text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider",
                    match.status === 'finished' ? "bg-gray-100 text-gray-600" :
                    match.status === 'live' ? "bg-emerald-100 text-emerald-700" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {match.status}
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <div className="flex-1 text-center font-bold text-gray-900 truncate px-2">{match.teamAName}</div>
                  <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-xl">
                    <span className="text-2xl font-black">{match.teamAScore}</span>
                    <span className="text-gray-400">-</span>
                    <span className="text-2xl font-black">{match.teamBScore}</span>
                  </div>
                  <div className="flex-1 text-center font-bold text-gray-900 truncate px-2">{match.teamBName}</div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-50">
                  <button 
                    onClick={(e) => handleDelete(e, match.id!)}
                    className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button className="p-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center space-x-2 font-bold px-4 transition-colors">
                    <Eye size={20} />
                    <span>View</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
