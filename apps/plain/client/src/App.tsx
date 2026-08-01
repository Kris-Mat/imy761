import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Tests from './pages/Tests';
import ChapterRunner from './pages/ChapterRunner';
import Completed from './pages/Completed';
import Profile from './pages/Profile';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tests" element={<Tests />} />
        <Route path="/tests/:monolithId" element={<ChapterRunner />} />
        <Route path="/completed" element={<Completed />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
