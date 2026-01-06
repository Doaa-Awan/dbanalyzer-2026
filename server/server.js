//.env config
require('dotenv').config();
const express = require('express');
const app = express();

//cors to connect to frontend
const cors = require('cors');
const corsOptions = {
  origin: ['http://localhost:5173'], 
//   methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
//   allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
};

app.use(cors(corsOptions));
app.use(express.json());

const PORT = process.env.VITE_PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.get("/api", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

//POSTGRES CONNECTION SETUP

let dbPool;
let dbAvailable = false;

//import Postgres client functions
const {
  createPostgresClient,
} = require("./db/postgres");

app.post('/db/connect-demo', async (req, res) => {
  const demoCfg = {
    host: process.env.DEMO_DB_HOST,
    port: process.env.DEMO_DB_PORT,
    user: process.env.DEMO_DB_USER,
    password: process.env.DEMO_DB_PASSWORD,
    database: process.env.DEMO_DB_NAME,
    ssl: process.env.DEMO_DB_SSL === 'true' || false,
  };

  // Validate demo config exists
  if (!demoCfg.host || !demoCfg.user || !demoCfg.database) {
    return res.status(400).json({ error: 'Demo DB credentials are not configured on the server' });
  }

  console.log('Attempting demo connect to', { host: demoCfg.host, port: demoCfg.port, user: demoCfg.user, database: demoCfg.database });

  const result = await testAndSetDb(demoCfg);
  if (result.ok) {
    return res.json({ message: 'Connected to demo DB' });
  }

  return res.status(500).json({ error: 'Failed to connect to demo DB', details: result.error });
});

app.post('/db/connect', async (req, res) => {
  const { host, port, user, password, database, ssl } = req.body;
  const cfg = { host, port, user, password, database, ssl };

  // basic validation
  if (!cfg.host || !cfg.user || !cfg.database) {
    return res.status(400).json({ error: 'Host, user and database are required' });
  }

  const result = await testAndSetDb(cfg);
  if (result.ok) {
    return res.json({ message: 'Connected' });
  }

  return res.status(500).json({ error: 'Failed to connect with provided credentials', details: result.error });
});

async function testAndSetDb(config) {
  if (!config) return { ok: false, error: 'No config provided' };

  if (!config.host || !config.user || !config.database) {
    return { ok: false, error: 'Host, user and database are required' };
  }

  if (config.password !== undefined && typeof config.password !== 'string') {
    return { ok: false, error: 'DB password must be a string' };
  }

  let candidatePool;
  try {
    candidatePool = createPostgresClient(config);
    // validate connection
    await candidatePool.query('SELECT 1');

    // close previous pool if exists
    if (dbPool && dbPool !== candidatePool) {
      try { await dbPool.end(); } catch (e) { /* ignore */ }
    }

    dbPool = candidatePool;
    dbAvailable = true;

    console.log('✅ Connected to Postgres (user:', config.user, 'db:', config.database, ')');

    return { ok: true };
  } catch (err) {
    try { if (candidatePool) await candidatePool.end(); } catch (e) { /* ignore */ }
    console.error('testAndSetDb error:', err.message);
    return { ok: false, error: err.message };
  }
}

app.get('/db/status', (req, res) => {
  res.json({ available: !!dbAvailable });
});

app.get("/health/db", async (req, res) => {
  if (!dbPool || !dbAvailable) {
    return res.status(503).json({ status: "unavailable", error: "DB connection not available" });
  }

  try {
    const result = await dbPool.query("SELECT NOW()");
    res.json({
      status: "ok",
      time: result.rows[0].now,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const { getSchema } = require("./db/postgres");

app.get("/db/schema", async (req, res) => {
  if (!dbPool || !dbAvailable) {
    return res.status(503).json({ error: "DB connection not available" });
  }

  try {
    const schema = await getSchema(dbPool);
    res.json(schema);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


