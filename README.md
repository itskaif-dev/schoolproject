# Berugram A.G.C.B. Vidyapith – Full Website + Admin CMS

This repository contains the complete website and Admin CMS for Berugram A.G.C.B. Vidyapith (H.S).

## Architecture & Vercel Deployment

The project is structured to run seamlessly on both **Vercel** and **Localhost**:

- **Frontend & Static Assets**: Located at root (`index.html`, `script.js`, `style.css`, `images/`, `notices/`, `admin/`).
- **Serverless API**: Handled by `api/index.js` which mounts the Express app from `backend/server.js`.
- **Vercel Rewrites**: `vercel.json` routes all `/api/*` traffic to the serverless API handler.
- **Localhost Execution**: `backend/server.js` starts a standalone HTTP server when executed directly.

---

## Local Development

### Option 1: From Root Directory (Recommended)

1. Run:
```bash
npm install
npm start
```
2. Open public website: `http://localhost:3000`
3. Open admin CMS: `http://localhost:3000/admin/`

### Option 2: From Backend Directory

1. Open terminal in `backend/` folder.
2. Run:
```bash
npm install
npm start
```
3. Open: `http://localhost:3000`

---

## Admin CMS Login

- **Username**: `admin`
- **Password**: `Headmaster@123`

The first server start automatically creates `backend/admin.json` with a secure password hash.

---

## Deployment to Vercel

1. Push changes to GitHub (`https://github.com/aryantiw06/schoolproject`).
2. Connect your repository to Vercel.
3. Vercel will automatically detect `package.json`, `vercel.json`, and `api/index.js`.
4. Deploy! The full frontend AND `/api/*` endpoints will work seamlessly under your Vercel URL (e.g., `https://schoolproject-theta.vercel.app`).
