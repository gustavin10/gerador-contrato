import cors from 'cors';
import express from 'express';
import { rotas } from './routes/contratos.js';

export function criarApp() {
  const app = express();

  // Front e API ficam em domínios diferentes em produção.
  // CORS_ORIGIN aceita vários domínios separados por vírgula.
  const origens = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(cors({ origin: origens.length > 0 ? origens : true }));
  app.use(express.json({ limit: '256kb' }));

  app.get('/', (_req, res) => {
    res.json({
      name: 'Gerador de Contratos — API',
      status: 'ok',
      docs: '/api/templates',
    });
  });

  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  app.use('/api', rotas);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
  });

  // O Express só reconhece o handler de erro com os quatro parâmetros.
  // eslint-disable-next-line no-unused-vars
  app.use((erro, _req, res, _next) => {
    console.error('[erro]', erro);
    res.status(500).json({ error: 'Erro interno ao processar a requisição' });
  });

  return app;
}
