import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Download, Home, Share2, Award } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cn } from '../lib/utils';

export default function EndMatch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const matchId = Number(id);

  const match = useLiveQuery(() => db.matches.get(matchId));
  const players = useLiveQuery(() => db.players.toArray());
  const goals = useLiveQuery(() => db.goals.where({ matchId }).sortBy('matchTime'), [matchId]);
  const cards = useLiveQuery(() => db.cards.where({ matchId }).toArray(), [matchId]);

  const signatures = useLiveQuery(() => db.signatures.where({ matchId }).toArray(), [matchId]);

  const pdfRef = useRef<HTMLDivElement>(null);
  
  // Awards state
  const [showAwardsModal, setShowAwardsModal] = useState(false);
  const [selectedDefenderId, setSelectedDefenderId] = useState<number | ''>('');
  const [selectedGoalkeeperId, setSelectedGoalkeeperId] = useState<number | ''>('');

  if (!match || !players || !goals || !cards || !signatures) return <div className="p-8">Loading...</div>;

  const matchPlayers = players.filter(p => p.teamId === match.teamAId || p.teamId === match.teamBId);

  const events = [...goals.map(g => ({ ...g, eventType: 'goal' })), ...cards.map(c => ({ ...c, eventType: 'card' }))].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // If awards are not set and we haven't shown modal, open it.
  if (!match.bestDefenderId && !match.bestGoalkeeperId && !showAwardsModal) {
    setShowAwardsModal(true);
  }

  const handleSaveAwards = async () => {
    if (selectedDefenderId !== '' && selectedGoalkeeperId !== '') {
      await db.matches.update(matchId, {
        bestDefenderId: Number(selectedDefenderId),
        bestGoalkeeperId: Number(selectedGoalkeeperId)
      });
    }
    setShowAwardsModal(false);
  };

  const exportPDF = async () => {
    if (!pdfRef.current) return;
    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Football-Score-Sheet-${match.date}.pdf`);
    } catch (err) {
      console.error('PDF Export Error', err);
      alert('Failed to generate PDF.');
    }
  };

  const getTeamGoals = (team: 'A' | 'B') => {
    const teamGoals = goals.filter(g => g.team === team);
    const playerGoals: Record<number, number> = {};
    teamGoals.forEach(g => {
      playerGoals[g.playerId] = (playerGoals[g.playerId] || 0) + 1;
    });
    return Object.entries(playerGoals).map(([playerId, count]) => {
      const player = players.find(p => p.id === Number(playerId));
      return { player, count };
    });
  };

  const teamAGoals = getTeamGoals('A');
  const teamBGoals = getTeamGoals('B');
  const teamACaptainSig = signatures.find(s => s.role === 'teamA')?.imageData;
  const teamBCaptainSig = signatures.find(s => s.role === 'teamB')?.imageData;
  const refereeSig = signatures.find(s => s.role === 'referee')?.imageData;

  const bestDefender = players.find(p => p.id === match.bestDefenderId);
  const bestGoalkeeper = players.find(p => p.id === match.bestGoalkeeperId);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      
      {/* Sticky Action Bar */}
      <div className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => navigate('/')} className="p-2 text-gray-500 hover:text-gray-900 rounded-full">
          <Home size={24} />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Final Score Sheet</h2>
        <div className="flex space-x-2">
          <button onClick={() => setShowAwardsModal(true)} className="bg-amber-100 text-amber-700 p-2 rounded-xl flex items-center space-x-1 font-bold text-sm">
            <Award size={18} />
          </button>
          <button onClick={exportPDF} className="bg-emerald-600 text-white p-2 rounded-xl flex items-center space-x-1 font-bold text-sm px-4">
            <Download size={18} />
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8 flex-1 overflow-y-auto flex justify-center pb-24">
        {/* PDF Container */}
        <div 
          ref={pdfRef} 
          className="bg-white w-full max-w-3xl border border-gray-200 shadow-sm p-8 text-gray-900"
          style={{ minHeight: '1122px' }}
        >
          {/* Header */}
          <div className="text-center mb-8 border-b-4 border-gray-900 pb-6">
            <h1 className="text-4xl font-black uppercase tracking-widest mb-4">Football Score Sheet</h1>
            <div className="grid grid-cols-2 gap-4 text-left max-w-lg mx-auto font-medium text-lg">
              <div><span className="text-gray-500 font-bold">DATE:</span> {match.date}</div>
              <div><span className="text-gray-500 font-bold">VENUE:</span> {match.venue || 'N/A'}</div>
              <div><span className="text-gray-500 font-bold">TOURNAMENT:</span> {match.tournament || 'N/A'}</div>
              <div><span className="text-gray-500 font-bold">REFEREE:</span> {match.referee || 'N/A'}</div>
            </div>
          </div>

          {/* Final Score */}
          <div className="flex justify-center items-center space-x-12 mb-12">
            <div className="text-center flex-1">
              <h2 className="text-2xl font-bold text-gray-500 uppercase">{match.teamAName}</h2>
              <div className="text-6xl font-black">{match.teamAScore}</div>
            </div>
            <div className="text-4xl font-bold text-gray-300">-</div>
            <div className="text-center flex-1">
              <h2 className="text-2xl font-bold text-gray-500 uppercase">{match.teamBName}</h2>
              <div className="text-6xl font-black">{match.teamBScore}</div>
            </div>
          </div>

          {/* Match Awards */}
          {(bestDefender || bestGoalkeeper) && (
            <div className="mb-12 border-2 border-amber-500 bg-amber-50 p-6 rounded-xl flex justify-around text-center">
              <div>
                <h3 className="text-amber-700 font-black tracking-widest uppercase mb-2 flex items-center justify-center gap-2">
                  <Award size={20} /> Best Defender
                </h3>
                {bestDefender ? (
                  <div className="text-2xl font-bold text-gray-900">
                    <span className="text-gray-400 mr-2">#{bestDefender.number}</span>
                    {bestDefender.name}
                  </div>
                ) : <span className="text-gray-400">Not selected</span>}
                <div className="text-sm font-bold text-amber-600 uppercase mt-1">
                  {bestDefender?.teamId === match.teamAId ? match.teamAName : bestDefender?.teamId === match.teamBId ? match.teamBName : ''}
                </div>
              </div>
              <div className="w-px bg-amber-200"></div>
              <div>
                <h3 className="text-amber-700 font-black tracking-widest uppercase mb-2 flex items-center justify-center gap-2">
                  <Award size={20} /> Best Goalkeeper
                </h3>
                {bestGoalkeeper ? (
                  <div className="text-2xl font-bold text-gray-900">
                    <span className="text-gray-400 mr-2">#{bestGoalkeeper.number}</span>
                    {bestGoalkeeper.name}
                  </div>
                ) : <span className="text-gray-400">Not selected</span>}
                <div className="text-sm font-bold text-amber-600 uppercase mt-1">
                  {bestGoalkeeper?.teamId === match.teamAId ? match.teamAName : bestGoalkeeper?.teamId === match.teamBId ? match.teamBName : ''}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 mb-12">
            {/* Team A Data */}
            <div>
              <h3 className="bg-gray-900 text-white font-bold p-2 text-center uppercase">{match.teamAName} - PLAYER GOALS</h3>
              <div className="border border-gray-900 p-4 min-h-[100px]">
                {teamAGoals.length === 0 ? <p className="text-gray-400 italic">No goals recorded</p> : 
                  teamAGoals.map((g, i) => (
                    <div key={i} className="flex justify-between font-bold border-b border-gray-100 py-1">
                      <span>#{g.player?.number} {g.player?.name}</span>
                      <span>{g.count}</span>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Team B Data */}
            <div>
              <h3 className="bg-gray-900 text-white font-bold p-2 text-center uppercase">{match.teamBName} - PLAYER GOALS</h3>
              <div className="border border-gray-900 p-4 min-h-[100px]">
                {teamBGoals.length === 0 ? <p className="text-gray-400 italic">No goals recorded</p> : 
                  teamBGoals.map((g, i) => (
                    <div key={i} className="flex justify-between font-bold border-b border-gray-100 py-1">
                      <span>#{g.player?.number} {g.player?.name}</span>
                      <span>{g.count}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>



          {/* Match Events */}
          <div className="mb-12">
            <h3 className="bg-gray-900 text-white font-bold p-2 text-center uppercase">MATCH EVENTS (TIMELINE)</h3>
            <div className="border border-gray-900 p-4 max-h-[300px] overflow-hidden">
               {events.length === 0 ? <p className="text-gray-400 italic">No events recorded</p> : 
                  events.map((e, i) => {
                    const p = players.find(pl => pl.id === e.playerId);
                    const isCard = e.eventType === 'card';
                    // @ts-ignore
                    const cardType = isCard ? e.type : null;
                    return (
                      <div key={i} className="flex items-center space-x-4 py-1 border-b border-gray-100 text-sm">
                        <span className="font-bold w-12">{e.matchTime}</span>
                        <span className="font-bold text-gray-500 w-24 uppercase truncate">{e.team === 'A' ? match.teamAName : match.teamBName}</span>
                        <span>#{p?.number} {p?.name}</span>
                        <span className={cn(
                          "ml-auto font-bold",
                          !isCard ? "text-gray-400 italic" : cardType === 'yellow' ? "text-amber-500" : "text-red-600"
                        )}>
                          {!isCard ? 'Goal ⚽' : cardType === 'yellow' ? 'Yellow 🟨' : 'Red 🟥'}
                        </span>
                      </div>
                    )
                  })
                }
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t-2 border-gray-900">
            <div className="text-center">
              <div className="h-24 flex items-center justify-center border-b border-dashed border-gray-400 mb-2">
                {teamACaptainSig ? <img src={teamACaptainSig} alt="Team A Sig" className="max-h-full" /> : null}
              </div>
              <div className="font-bold text-sm uppercase">{match.teamAName} CAPTAIN</div>
            </div>
            <div className="text-center">
              <div className="h-24 flex items-center justify-center border-b border-dashed border-gray-400 mb-2">
                {refereeSig ? <img src={refereeSig} alt="Referee Sig" className="max-h-full" /> : null}
              </div>
              <div className="font-bold text-sm uppercase">REFEREE</div>
            </div>
            <div className="text-center">
              <div className="h-24 flex items-center justify-center border-b border-dashed border-gray-400 mb-2">
                {teamBCaptainSig ? <img src={teamBCaptainSig} alt="Team B Sig" className="max-h-full" /> : null}
              </div>
              <div className="font-bold text-sm uppercase">{match.teamBName} CAPTAIN</div>
            </div>
          </div>
        </div>
      </div>

      {/* Awards Modal */}
      {showAwardsModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="text-center mb-6">
              <div className="mx-auto bg-amber-100 text-amber-600 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Award size={32} />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Match Awards</h2>
              <p className="text-gray-500 text-sm mt-1">Select the best players of the match</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Best Defender</label>
                <select 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                  value={selectedDefenderId}
                  onChange={e => setSelectedDefenderId(Number(e.target.value))}
                >
                  <option value="" disabled>Select a player</option>
                  {matchPlayers.map(p => (
                    <option key={p.id} value={p.id}>#{p.number} {p.name} ({p.teamId === match.teamAId ? match.teamAName : match.teamBName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Best Goalkeeper</label>
                <select 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                  value={selectedGoalkeeperId}
                  onChange={e => setSelectedGoalkeeperId(Number(e.target.value))}
                >
                  <option value="" disabled>Select a player</option>
                  {matchPlayers.map(p => (
                    <option key={p.id} value={p.id}>#{p.number} {p.name} ({p.teamId === match.teamAId ? match.teamAName : match.teamBName})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setShowAwardsModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 p-4 rounded-xl font-bold hover:bg-gray-200"
              >
                Skip
              </button>
              <button 
                onClick={handleSaveAwards}
                disabled={selectedDefenderId === '' || selectedGoalkeeperId === ''}
                className="flex-1 bg-amber-500 text-white p-4 rounded-xl font-bold hover:bg-amber-600 disabled:opacity-50"
              >
                Save Awards
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
