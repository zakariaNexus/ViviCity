import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;
const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// --- Auth middleware ---
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!t) return res.status(401).json({ error: "no token" });
  try { req.user = jwt.verify(t, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "bad token" }); }
}

// --- Auth routes ---
app.post("/auth/register", async (req, res) => {
  const { email, password, display_name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email/password required" });
  const hash = await bcrypt.hash(password, 10);
  try {
    const q = `INSERT INTO users(email,password_hash,display_name)
               VALUES($1,$2,$3) RETURNING id,email,display_name`;
    const { rows } = await pool.query(q, [email, hash, display_name || null]);
    res.json(rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "email exists" });
    console.error(e); res.status(500).json({ error: "server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  const u = rows[0]; if (!u) return res.status(401).json({ error: "invalid" });
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid" });
  const token = jwt.sign({ id: u.id, email: u.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

app.get("/me", auth, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id,email,display_name,created_at FROM users WHERE id=$1",
    [req.user.id]
  );
  res.json(rows[0]);
});

// --- Reviews ---
app.get("/reviews", async (req, res) => {
  const { criterion } = req.query;
  let sql = "SELECT * FROM reviews";
  const params = [];
  if (criterion) { sql += " WHERE criterion=$1"; params.push(criterion); }
  sql += " ORDER BY created_at DESC LIMIT 200";
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

app.post("/reviews", auth, async (req, res) => {
  const { lat, lng, criterion, rating, comment, city } = req.body || {};
  if (lat == null || lng == null || !criterion || rating == null)
    return res.status(400).json({ error: "missing fields" });

  const q = `INSERT INTO reviews(user_id,lat,lng,city,criterion,rating,comment,created_at)
             VALUES($1,$2,$3,$4,$5,$6,$7,now()) RETURNING *`;
  const { rows } = await pool.query(q, [req.user.id, lat, lng, city||null, criterion, rating, comment||null]);
  res.status(201).json(rows[0]);
});

// --- Actions ---
app.get("/actions", async (req, res) => {
  const { after } = req.query;
  let sql = "SELECT * FROM actions";
  const params = [];
  if (after) { sql += " WHERE date_utc >= $1"; params.push(after); }
  sql += " ORDER BY date_utc ASC LIMIT 200";
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

app.post("/actions", auth, async (req, res) => {
  const { theme, title, description, date_utc, lat, lng } = req.body || {};
  if (!theme || !title || !date_utc || lat == null || lng == null)
    return res.status(400).json({ error: "missing fields" });

  const q = `INSERT INTO actions(user_id,theme,title,description,date_utc,lat,lng,created_at)
             VALUES($1,$2,$3,$4,$5,$6,$7,now()) RETURNING *`;
  const { rows } = await pool.query(q, [req.user.id, theme, title, description||null, date_utc, lat, lng]);
  res.status(201).json(rows[0]);
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log("API ready on :" + port));
