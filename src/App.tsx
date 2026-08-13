import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ManageTeams from './pages/ManageTeams';
import NewMatch from './pages/NewMatch';
import PlayerSetup from './pages/PlayerSetup';
import LiveMatch from './pages/LiveMatch';
import SFEntry from './pages/SFEntry';
import Signatures from './pages/Signatures';
import EndMatch from './pages/EndMatch';
import SavedMatches from './pages/SavedMatches';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teams" element={<ManageTeams />} />
        <Route path="/new" element={<NewMatch />} />
        <Route path="/match/:id/players" element={<PlayerSetup />} />
        <Route path="/match/:id/live" element={<LiveMatch />} />
        <Route path="/match/:id/sf" element={<SFEntry />} />
        <Route path="/match/:id/signatures" element={<Signatures />} />
        <Route path="/match/:id/end" element={<EndMatch />} />
        <Route path="/saved" element={<SavedMatches />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
