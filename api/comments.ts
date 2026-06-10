import { Redis } from '@upstash/redis';

// Inicializa o cliente Redis. Se as variáveis não estiverem definidas,
// ele usará os defaults definidos pelo ambiente da Vercel.
const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

// Hash onde cada campo é um comentário isolado.
// Campo: encodeURIComponent(squadId):...(releaseId):...(quinzenaId):...(metricId)
// Valor: { gap, action }
// Isso permite escrita atômica por campo (HSET), sem read-modify-write do blob inteiro.
const HASH_KEY = 'locavia_dashboard_comments_v2';
const SEP = ':';

function encodeField(squadId: string, releaseId: string, quinzenaId: string, metricId: string): string {
  return [squadId, releaseId, quinzenaId, metricId].map(encodeURIComponent).join(SEP);
}

// Reconstrói a árvore aninhada que o frontend espera a partir dos campos planos do hash.
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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const hash = await redis.hgetall(HASH_KEY);
      return res.status(200).json(hash ? hashToTree(hash as Record<string, any>) : {});
    }

    if (req.method === 'POST') {
      const body = req.body;
      const { squadId, releaseId, quinzenaId, metricId, gap, action } = body || {};

      if (!squadId || !releaseId || !quinzenaId || !metricId) {
        return res.status(400).json({
          error: 'Missing required fields: squadId, releaseId, quinzenaId, metricId',
        });
      }

      const field = encodeField(squadId, releaseId, quinzenaId, metricId);
      // Escrita atômica e isolada: só este campo é tocado. Sem clobber entre editores.
      await redis.hset(HASH_KEY, { [field]: { gap: gap || '', action: action || '' } });

      return res.status(200).json({ success: true, message: 'Comment saved successfully' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Redis API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
