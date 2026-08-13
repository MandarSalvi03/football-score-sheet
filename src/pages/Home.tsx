import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, List, Users } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center space-y-8 border border-gray-100">
        <div className="bg-emerald-100 p-6 rounded-full text-emerald-600 mb-2 shadow-inner">
          <Trophy size={64} />
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Football Score Sheet
          </h1>
          <p className="text-gray-500">Record and track matches on the go</p>
        </div>

        <div className="w-full flex flex-col space-y-4 w-full mt-8">
          <button
            onClick={() => navigate('/new')}
            className={cn(
              "flex items-center justify-center space-x-3 w-full py-4 rounded-2xl text-lg font-bold transition-all",
              "bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 active:scale-95"
            )}
          >
            <Plus size={24} />
            <span>New Match</span>
          </button>
          
          <button
            onClick={() => navigate('/saved')}
            className={cn(
              "flex items-center justify-center space-x-3 w-full py-4 rounded-2xl text-lg font-bold transition-all",
              "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 border-2 border-transparent hover:border-gray-200"
            )}
          >
            <List size={24} />
            <span>Saved Matches</span>
          </button>
          
          <button
            onClick={() => navigate('/teams')}
            className={cn(
              "flex items-center justify-center space-x-3 w-full py-4 rounded-2xl text-lg font-bold transition-all",
              "bg-gray-800 text-white shadow-lg hover:bg-gray-900 active:scale-95"
            )}
          >
            <Users size={24} />
            <span>Manage Teams</span>
          </button>
        </div>
      </div>
      <div className="mt-8 text-gray-400 text-sm flex items-center">
        <span>Offline Ready PWA</span>
      </div>
    </div>
  );
}
