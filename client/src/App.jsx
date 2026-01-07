import { useState, useEffect } from 'react'
import './App.css'
import axios from 'axios'
import postgresLogo from '/icons8-postgres.svg';
import DbExplorer from './DbExplorer.jsx';

function App() {
  const [data, setData] = useState({ message: 'Loading...' });
  const [host, setHost] = useState('');
  const [port, setPort] = useState('5432');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [dbStatus, setDbStatus] = useState('unknown');
  const [showExplorer, setShowExplorer] = useState(false);
  const [schema, setSchema] = useState([]);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api`);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setData({ message: 'Server unavailable' });
    }
  };

  const checkDbStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}/db/status`);
      const available = !!res.data.available;
      setDbStatus(available ? 'available' : 'unavailable');
      return available;
    } catch (err) {
      setDbStatus('unavailable');
      return false;
    }
  };

  //connect to user db
  const connect = async () => {
    setStatusMessage('Connecting...');
    try {
      const res = await axios.post(`${API_BASE}/db/connect`, { host, port, user, password, database });
      setStatusMessage(res.data.message || 'Connected');
      const available = await checkDbStatus();
      if (available) {
        await fetchSchema();
        setShowExplorer(true);
      }
    } catch (err) {
      const error = err.response?.data;
      setStatusMessage((error?.error ? `${error.error}${error.details ? `: ${error.details}` : ''}` : 'Failed to connect'));
      await checkDbStatus();
    }
  };

  // load schema (all table names)
  const fetchSchema = async () => {
    try {
      const res = await axios.get(`${API_BASE}/db/schema`);
      // server returns rows with table_name, column_name, data_type
      const tables = Array.isArray(res.data) ? [...new Set(res.data.map(r => r.table_name))] : [];
      setSchema(tables);
      return tables;
    } catch (err) {
      console.error('Failed to fetch schema', err);
      setStatusMessage('Failed to load schema');
      return [];
    }
  };

  //connect to demo db
  const connectDemo = async () => {
    setStatusMessage('Connecting to demo DB...');
    try {
      const res = await axios.post(`${API_BASE}/db/connect-demo`);
      setStatusMessage(res.data.message || 'Connected to demo');
      const available = await checkDbStatus();
      if (available) {
        await fetchSchema();
        setShowExplorer(true);
      }
    } catch (err) {
      const error = err.response?.data;
      setStatusMessage((error?.error ? `${error.error}${error.details ? `: ${error.details}` : ''}` : 'Failed to connect to demo DB'));
      await checkDbStatus();
    }
  };

  // const connected = async () => {
  //   const available = await checkDbStatus();
  //   if (available) {
  //     await fetchSchema();
  //     setShowExplorer(true);
  // };

  useEffect(() => {
    fetchData();
    (async () => {
      const available = await checkDbStatus();
      if (available) {
        await fetchSchema();
        setShowExplorer(true);
      }
    })();
  }, []);

  if (showExplorer) {
    return <DbExplorer tables={schema} onBack={() => setShowExplorer(false)} />;
  }

  return (
    <>
      <div>
        <img src={postgresLogo} className="logo" alt="PostgreSQL logo" />
      </div>

      <h1>{data?.message}</h1>

      <div className="db-connector">
        <h2>Connect to Postgres</h2>
        <div className="field">
          <label>Host</label>
          <input value={host} onChange={e => setHost(e.target.value)} placeholder="localhost" />
        </div>
        <div className="field">
          <label>Port</label>
          <input value={port} onChange={e => setPort(e.target.value)} />
        </div>
        <div className="field">
          <label>User</label>
          <input value={user} onChange={e => setUser(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div className="field">
          <label>Database</label>
          <input value={database} onChange={e => setDatabase(e.target.value)} />
        </div>

        <div className="actions">
          <button onClick={connect}>Connect</button>
          <button onClick={connectDemo}>Use Demo DB</button>
        </div>

        <p><strong>Status:</strong> {statusMessage} ({dbStatus})</p>
      </div>
    </>
  )
}

export default App
