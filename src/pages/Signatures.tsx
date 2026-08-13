import React, { useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import SignatureCanvas from 'react-signature-canvas';
import { db } from '../lib/db';
import { Eraser, CheckCircle2 } from 'lucide-react';

export default function Signatures() {
  const { id } = useParams();
  const navigate = useNavigate();
  const matchId = Number(id);

  const match = useLiveQuery(() => db.matches.get(matchId));
  const players = useLiveQuery(() => db.players.toArray());
  const signatures = useLiveQuery(() => db.signatures.where({ matchId }).toArray(), [matchId]);

  const teamACaptain = players?.find(p => p.teamId === match?.teamAId && p.isCaptain);
  const teamBCaptain = players?.find(p => p.teamId === match?.teamBId && p.isCaptain);

  const sigRefs = {
    teamA: useRef<SignatureCanvas>(null),
    teamB: useRef<SignatureCanvas>(null),
    referee: useRef<SignatureCanvas>(null),
  };

  useEffect(() => {
    if (signatures) {
      signatures.forEach(sig => {
        const ref = sigRefs[sig.role]?.current;
        if (ref && sig.imageData) {
          ref.fromDataURL(sig.imageData);
        }
      });
    }
  }, [signatures]);

  const handleClear = (role: 'teamA' | 'teamB' | 'referee') => {
    sigRefs[role].current?.clear();
  };

  const handleSaveSignature = async (role: 'teamA' | 'teamB' | 'referee') => {
    const canvas = sigRefs[role].current;
    if (canvas && !canvas.isEmpty()) {
      const imageData = canvas.toDataURL('image/png');
      const existing = signatures?.find(s => s.role === role);
      
      if (existing) {
        await db.signatures.update(existing.id!, { imageData });
      } else {
        await db.signatures.add({ matchId, role, imageData });
      }
    }
  };

  const handleSaveAllAndFinish = async () => {
    await handleSaveSignature('teamA');
    await handleSaveSignature('teamB');
    await handleSaveSignature('referee');
    navigate(`/match/${matchId}/end`);
  };

  if (!match || !players) return <div className="p-8">Loading...</div>;

  const renderSignatureBox = (role: 'teamA' | 'teamB' | 'referee', title: string, subtitle?: string) => (
    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-200 mb-6 flex flex-col">
      <div className="mb-2">
        <h3 className="font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 font-medium">{subtitle}</p>}
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden mb-4 relative">
        <SignatureCanvas 
          ref={sigRefs[role]}
          canvasProps={{ className: 'w-full h-40' }}
          backgroundColor="rgb(249, 250, 251)"
        />
        <button 
          onClick={() => handleClear(role)}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          <Eraser size={20} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 pb-24">
      <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">Signatures</h2>

      <div className="max-w-md w-full mx-auto">
        {renderSignatureBox('teamA', `${match.teamAName} Captain`, teamACaptain?.name)}
        {renderSignatureBox('teamB', `${match.teamBName} Captain`, teamBCaptain?.name)}
        {renderSignatureBox('referee', 'Referee', match.referee)}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <button 
          onClick={handleSaveAllAndFinish}
          className="w-full flex items-center justify-center space-x-2 bg-emerald-600 active:bg-emerald-700 text-white p-4 rounded-xl font-bold text-lg transition-transform active:scale-95 shadow-md"
        >
          <CheckCircle2 size={24} />
          <span>Continue to Summary</span>
        </button>
      </div>
    </div>
  );
}
