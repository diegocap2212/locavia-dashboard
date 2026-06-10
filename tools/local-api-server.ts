/**
 * Local API server for E2E testing.
 * Espelha api/comments.ts (Redis Hash) na porta 3001, lendo credenciais do .env.local
 */
import http from 'http';
import { Redis } from '@upstash/redis';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env.local') });

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

const HASH_KEY = 'locavia_dashboard_comments_v2';
const SEP = ':';
const PORT = 3001;

function encodeField(squadId: string, releaseId: string, quinzenaId: string, metricId: string): string {
  return [squadId, releaseId, quinzenaId, metricId].map(encodeURIComponent).join(SEP);
}

function hashToTree(hash: Record<string, any>): Record<string, any> {
  const tree: Record<string, any> = {};
  for (const [field, value] of Object.entries(hash)) {
    const parts = field.split(SEP).map(decodeURIComponent);
    if (parts.length !== 4) continue;
    const [squadId, releaseId, quinzenaId, metricId] = parts;
    const comment = typeof value === 'string' ? JSON.parse(value) : value;
    if (!tree[squadId]) tree[squadId] = {};
    if (!tree[squadId][releaseId]) tree[squadId][releaseId] = {};
    if (!tree[squadId][releaseId][quinzenaId]) tree[squadId][releaseId][quinzenaId] = {};
    tree[squadId][releaseId][quinzenaId][metricId] = comment;
  }
  return tree;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url !== '/api/comments') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  try {
    if (req.method === 'GET') {
      const hash = await redis.hgetall(HASH_KEY);
      const tree = hash ? hashToTree(hash as Record<string, any>) : {};
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(tree));
      return;
    }

    if (req.method === 'POST') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const { squadId, releaseId, quinzenaId, metricId, gap, action } = JSON.parse(
        Buffer.concat(chunks).toString()
      );
      if (!squadId || !releaseId || !quinzenaId || !metricId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing required fields' }));
        return;
      }
      const field = encodeField(squadId, releaseId, quinzenaId, metricId);
      const updatedAt = new Date().toISOString();
      await redis.hset(HASH_KEY, { [field]: { gap: gap || '', action: action || '', updatedAt } });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, updatedAt }));
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  } catch (err: any) {
    console.error('API Error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Local API server (Redis Hash) running on http://localhost:${PORT}`);
});
