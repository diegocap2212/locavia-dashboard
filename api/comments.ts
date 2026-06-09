import { Redis } from '@upstash/redis';

// Inicializa o cliente Redis. Se as variáveis não estiverem definidas,
// ele usará os defaults definidos pelo ambiente da Vercel.
const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

const REDIS_KEY = 'locavia_dashboard_comments';

export default async function handler(req: any, res: any) {
  // CORS Headers para caso o frontend esteja em outro subdomínio (não é o caso na Vercel, mas é boa prática)
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
      const data = await redis.get(REDIS_KEY);
      return res.status(200).json(data || {});
    }

    if (req.method === 'POST') {
      const body = req.body;
      if (!body) {
        return res.status(400).json({ error: 'Missing body' });
      }

      // Salva no Redis (substitui o valor atual)
      await redis.set(REDIS_KEY, JSON.stringify(body));
      
      return res.status(200).json({ success: true, message: 'Comments saved successfully' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Redis API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
