import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Gate from './pages/Gate.jsx';
import Value from './pages/Value.jsx';
import Portal from './portal/Portal.jsx';

// Pages behind the gate redirect to it until a valid code was entered this session.
// The dev server skips the check so pages can be previewed directly.
function Guard({ children }) {
  return import.meta.env.DEV || sessionStorage.getItem('pulso-access') ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Gate />} />
        <Route path="/valor" element={<Guard><Value /></Guard>} />
        <Route path="/portal" element={<Navigate to="/portal/visao-geral" replace />} />
        <Route path="/portal/:view" element={<Guard><Portal /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
