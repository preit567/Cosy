// worker.js
import { XataClient } from './xata.js'; // Auto-generated client

export default {
  async fetch(request, env) {
    const xata = new XataClient({
      apiKey: env.XATA_API_KEY,
      branch: env.XATA_BRANCH || 'main'
    });

    const url = new URL(request.url);
    const path = url.pathname;

    // CORS Headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    };

    // Route Handling
    try {
      // Track Download
      if (path === '/api/download' && request.method === 'POST') {
        const ip = request.headers.get('CF-Connecting-IP');
        const userAgent = request.headers.get('User-Agent');
        
        await xata.db.downloads.create({
          ipAddress: ip,
          userAgent: userAgent
        });
        
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      // Get Stats
      if (path === '/api/stats' && request.method === 'GET') {
        const total = await xata.db.downloads.summarize({
          columns: [],
          summaries: {
            total: { count: '*' }
          }
        });
        
        const today = await xata.db.downloads.filter({
          $exists: { timestamp: new Date().toISOString().split('T')[0] }
        }).summarize({
          summaries: {
            count: { count: '*' }
          }
        });
        
        return new Response(JSON.stringify({
          totalDownloads: total.summaries[0].total,
          todayDownloads: today.summaries[0]?.count || 0
        }), { headers });
      }

      // Get Content
      if (path === '/api/content' && request.method === 'GET') {
        const content = await xata.db.content.getAll();
        return new Response(JSON.stringify(content), { headers });
      }

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500,
        headers 
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};