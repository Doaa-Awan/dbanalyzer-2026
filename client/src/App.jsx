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
  const [activeDb, setActiveDb] = useState('postgres');



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

  // load schema (table names + column counts)
  const fetchSchema = async () => {
    try {
      const res = await axios.get(`${API_BASE}/db/schema`);
      // server returns rows with table_name, column_name, data_type
      const rows = Array.isArray(res.data) ? res.data : [];
      const tableCounts = rows.reduce((acc, row) => {
        const name = typeof row === 'string' ? row : row.table_name;
        if (!name) return acc;
        acc[name] = (acc[name] || 0) + (row.column_name ? 1 : 0);
        return acc;
      }, {});
      const tables = Object.entries(tableCounts)
        .map(([name, columnCount]) => ({ name, columnCount }))
        .sort((a, b) => a.name.localeCompare(b.name));
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
    <div className="login-shell">
      <div className="login-card">
        <header className="login-header">
          <div className="brand">
            <img src={postgresLogo} className="logo" alt="PostgreSQL logo" />
            <div className="brand-text">
              <p className="eyebrow">AI DB Explorer</p>
              <h1>Connect your database</h1>
              <p className="subtitle">{data?.message}</p>
            </div>
          </div>
          <div className={`status-pill ${dbStatus}`}>
            <span className="status-dot" aria-hidden="true" />
            <span>{statusMessage || 'Ready to connect'}</span>
            <span className="status-tag">{dbStatus}</span>
          </div>
        </header>

        <div className="db-tabs">
          <button
            className={`tab ${activeDb === 'postgres' ? 'active' : ''}`}
            onClick={() => setActiveDb('postgres')}
            type="button"
          >
            PostgreSQL
          </button>
          <button
            className={`tab ${activeDb === 'sqlserver' ? 'active' : ''}`}
            onClick={() => setActiveDb('sqlserver')}
            type="button"
          >
            SQL Server <span className="tab-note">Coming soon</span>
          </button>
        </div>

        {activeDb === 'postgres' ? (
          <div className="panel">
            <div className="fields-grid">
              <div className="field">
                <label htmlFor="pg-host">Host</label>
                <input
                  id="pg-host"
                  value={host}
                  onChange={e => setHost(e.target.value)}
                  placeholder="localhost"
                />
              </div>
              <div className="field">
                <label htmlFor="pg-port">Port</label>
                <input id="pg-port" value={port} onChange={e => setPort(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="pg-user">User</label>
                <input id="pg-user" value={user} onChange={e => setUser(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="pg-password">Password</label>
                <input
                  id="pg-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <div className="field field-full">
                <label htmlFor="pg-database">Database</label>
                <input id="pg-database" value={database} onChange={e => setDatabase(e.target.value)} />
              </div>
            </div>

            <div className="actions">
              <button className="btn primary" onClick={connect} type="button">
                Connect
              </button>
              <button className="btn ghost" onClick={connectDemo} type="button">
                Use Demo DB
              </button>
            </div>
          </div>
        ) : (
          <div className="panel panel-disabled">
            <div className="fields-grid">
              <div className="field">
                <label htmlFor="ms-server">Server</label>
                <input id="ms-server" placeholder="localhost\\SQLEXPRESS" disabled />
              </div>
              <div className="field">
                <label htmlFor="ms-port">Port</label>
                <input id="ms-port" placeholder="1433" disabled />
              </div>
              <div className="field">
                <label htmlFor="ms-user">User</label>
                <input id="ms-user" placeholder="sa" disabled />
              </div>
              <div className="field">
                <label htmlFor="ms-password">Password</label>
                <input id="ms-password" type="password" placeholder="••••••••" disabled />
              </div>
              <div className="field">
                <label htmlFor="ms-database">Database</label>
                <input id="ms-database" placeholder="master" disabled />
              </div>
              <div className="field">
                <label htmlFor="ms-instance">Instance (optional)</label>
                <input id="ms-instance" placeholder="SQLEXPRESS" disabled />
              </div>
            </div>

            <div className="notice">SQL Server connections are disabled for now.</div>

            <div className="actions">
              <button className="btn primary" type="button" disabled>
                Connect
              </button>
              <button className="btn ghost" type="button" disabled>
                Use Demo DB
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
