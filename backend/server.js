const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');

function getFilePath(filename) {
  const localPath = path.resolve(__dirname, filename);
  if (fs.existsSync(localPath)) return localPath;
  const cwdPath = path.resolve(process.cwd(), 'backend', filename);
  if (fs.existsSync(cwdPath)) return cwdPath;
  return localPath;
}

const DATA_FILE = getFilePath('data.json');
const ADMIN_FILE = getFilePath('admin.json');
const JWT_SECRET = process.env.JWT_SECRET || 'berugram-change-this-secret-before-production';

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));

let cachedData = null;

function readJSON(file, fallback) {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[server] Failed to read or parse ${file}:`, err.message);
    return fallback;
  }
}
function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn(`[server] Warning: Could not write ${file} to disk:`, err.message);
  }
}
function readData() {
  if (cachedData) return cachedData;
  cachedData = readJSON(DATA_FILE, {});
  return cachedData;
}
function writeData(data) {
  cachedData = data;
  writeJSON(DATA_FILE, data);
}

function makePasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  try {
    const [salt, hash] = String(stored).split(':');
    const test = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
  } catch { return false; }
}
function getAdmin() {
  const adminFile = getFilePath('admin.json');
  if (!fs.existsSync(adminFile)) {
    const admin = { username: process.env.ADMIN_USER || 'admin', passwordHash: makePasswordHash(process.env.ADMIN_PASSWORD || 'Headmaster@123') };
    writeJSON(adminFile, admin);
    return admin;
  }
  return readJSON(adminFile, { username: 'admin', passwordHash: makePasswordHash('Headmaster@123') });
}
function saveAdmin(admin) { writeJSON(getFilePath('admin.json'), admin); }

function auth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.admin = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'Session expired. Please login again.' }); }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const kind = req.body.kind === 'notice' ? 'notices' : 'images';
    let destDir = path.join(ROOT, kind);
    try {
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    } catch {
      destDir = path.join('/tmp', kind);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    }
    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').slice(0, 60) || 'upload';
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isImage = /^(image\/(jpeg|jpg|png|webp|gif))$/i.test(file.mimetype);
    const isPdf = file.mimetype === 'application/pdf';
    const wanted = req.body.kind;
    const ok = wanted === 'notice' ? isPdf : isImage;
    cb(ok ? null : new Error(wanted === 'notice' ? 'Please upload a PDF notice.' : 'Please upload a JPG, PNG, WEBP or GIF image.'), ok);
  }
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const admin = getAdmin();
  if (username === admin.username && verifyPassword(password || '', admin.passwordHash)) {
    const token = jwt.sign({ username: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, username: admin.username });
  }
  res.status(401).json({ error: 'Invalid username or password.' });
});
app.get('/api/admin/me', auth, (req, res) => res.json({ username: req.admin.username, role: 'admin' }));

app.post('/api/admin/change-credentials', auth, (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body || {};
  const admin = getAdmin();
  if (!verifyPassword(currentPassword || '', admin.passwordHash)) return res.status(401).json({ error: 'Current password is incorrect.' });
  if (!newUsername || String(newUsername).length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  if (!newPassword || String(newPassword).length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  saveAdmin({ username: String(newUsername).trim(), passwordHash: makePasswordHash(String(newPassword)) });
  res.json({ ok: true, message: 'Login details updated. Please login again.' });
});

app.get('/api/site', (req, res) => res.json(readData()));
app.put('/api/site', auth, (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ error: 'Invalid website data.' });
  writeData(req.body);
  res.json({ ok: true, data: req.body });
});

app.post('/api/admin/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const folder = req.body.kind === 'notice' ? 'notices' : 'images';
  res.json({ ok: true, path: `${folder}/${req.file.filename}`, name: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype });
});

app.get('/api/admin/media', auth, (req, res) => {
  const imagesDir = path.join(ROOT, 'images');
  const noticesDir = path.join(ROOT, 'notices');
  const readFolder = (dir, folder) => {
    if (!fs.existsSync(dir)) return [];
    try {
      return fs.readdirSync(dir, { withFileTypes: true }).filter(x => x.isFile()).map(x => {
        const p = path.join(dir, x.name); const st = fs.statSync(p);
        return { path: `${folder}/${x.name}`, name: x.name, size: st.size, modified: st.mtime.toISOString() };
      });
    } catch { return []; }
  };
  res.json({ images: readFolder(imagesDir, 'images'), notices: readFolder(noticesDir, 'notices') });
});
app.delete('/api/admin/media', auth, (req, res) => {
  const rel = String(req.body?.path || '').replaceAll('\\', '/');
  if (!/^(images|notices)\/[a-zA-Z0-9._-]+$/.test(rel)) return res.status(400).json({ error: 'Invalid media path.' });
  const target = path.resolve(ROOT, rel);
  if (!target.startsWith(path.resolve(ROOT) + path.sep)) return res.status(400).json({ error: 'Invalid path.' });
  try {
    if (fs.existsSync(target)) fs.unlinkSync(target);
  } catch (e) {
    console.warn('[server] Could not delete file:', e.message);
  }
  res.json({ ok: true });
});

app.use(express.static(ROOT));
app.use('/admin', express.static(path.join(ROOT, 'admin')));
app.get('/admin/{*splat}', (req, res) => res.sendFile(path.join(ROOT, 'admin', 'index.html')));
app.get(/.*/, (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.use((err, req, res, next) => { console.error(err); res.status(400).json({ error: err.message || 'Server error' }); });

getAdmin();

if (require.main === module) {
  app.listen(PORT, () => console.log(`Berugram school website running at http://localhost:${PORT}`));
}

module.exports = app;
