import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import { authService, postService } from './services/apiService';

function App() {
  const [logs, setLogs] = useState([]);

  const addLog = (message, data) => {
    setLogs(prev => [...prev, { message, data, time: new Date().toLocaleTimeString() }]);
  };

  const handleRegister = async () => {
    try {
      addLog('Attempting to register user...');
      const result = await authService.register({ username: 'testuser', password: 'password123' });
      addLog('Register Success:', result);
    } catch (error) {
      addLog('Register Error:', error.response?.data || error.message);
    }
  };

  const handleLogin = async () => {
    try {
      addLog('Attempting to login user...');
      const result = await authService.login({ username: 'testuser', password: 'password123' });
      addLog('Login Success:', result);
    } catch (error) {
      addLog('Login Error:', error.response?.data || error.message);
    }
  };

  const handleFetchPosts = async () => {
    try {
      addLog('Attempting to fetch posts...');
      const result = await postService.getAllPosts();
      addLog('Fetch Posts Success:', result);
    } catch (error) {
      addLog('Fetch Posts Error:', error.response?.data || error.message);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'left', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <h1>Vite + React</h1>
        <p>Testing Local Backend Connection</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '2rem 0' }}>
        <button onClick={handleRegister}>Register Test User</button>
        <button onClick={handleLogin}>Login Test User</button>
        <button onClick={handleFetchPosts}>Fetch Posts</button>
      </div>

      <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', color: '#333', minHeight: '200px', maxHeight: '400px', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>Connection Logs</h3>
        {logs.length === 0 ? (
          <p style={{ color: '#888' }}>No logs yet. Click a button to test the backend API...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {logs.map((log, index) => (
              <div key={index} style={{ borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
                <strong style={{ color: '#555' }}>[{log.time}]</strong> {log.message}
                {log.data && (
                  <pre style={{ margin: '0.5rem 0 0', background: '#e0e0e0', padding: '0.5rem', borderRadius: '4px', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
