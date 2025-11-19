import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Dashboard />} />
        <Route path="/plans" element={<Dashboard />} />
        <Route path="/builder" element={<Dashboard />} />
        <Route path="/library" element={<Dashboard />} />
        <Route path="/messages" element={<Dashboard />} />
        <Route path="/reports" element={<Dashboard />} />
        <Route path="/" element={<Login />} /> {/* Default route */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
