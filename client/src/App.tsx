import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreatePresentation from './pages/CreatePresentation';
import EditPresentation from './pages/EditPresentation';
import PresenterView from './pages/PresenterView';
import ParticipantJoin from './pages/ParticipantJoin';
import ParticipantView from './pages/ParticipantView';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create" element={<CreatePresentation />} />
      <Route path="/edit/:id" element={<EditPresentation />} />
      <Route path="/present/:id" element={<PresenterView />} />
      <Route path="/join" element={<ParticipantJoin />} />
      <Route path="/participate/:id" element={<ParticipantView />} />
    </Routes>
  );
}

export default App;
