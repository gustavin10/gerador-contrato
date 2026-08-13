import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { contratoSchema, errosPorCampo } from '../lib/schema.js';
import { gerarPdf } from '../pdf/gerarPdf.js';
import { montarContrato, TEMPLATES } from '../templates/index.js';

export const rotas = Router();

const RESUMO = {
  id: true,
  template: true,
  clientName: true,
  contractorName: true,
  serviceDescription: true,
  valueCents: true,
  createdAt: true,
};

function slug(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

rotas.get('/templates', (_req, res) => {
  res.json({ templates: TEMPLATES });
});

rotas.post('/contracts/preview', (req, res) => {
  const resultado = contratoSchema.safeParse(req.body);
  if (!resultado.success) {
    return res.status(422).json({
      error: 'Dados inválidos',
      fields: errosPorCampo(resultado.error),
    });
  }

  res.json({ document: montarContrato(resultado.data) });
});

rotas.post('/contracts', async (req, res, next) => {
  const resultado = contratoSchema.safeParse(req.body);
  if (!resultado.success) {
    return res.status(422).json({
      error: 'Dados inválidos',
      fields: errosPorCampo(resultado.error),
    });
  }

  try {
    const contrato = await prisma.contract.create({ data: resultado.data });
    res.status(201).json({
      contract: contrato,
      document: montarContrato(contrato),
    });
  } catch (erro) {
    next(erro);
  }
});

rotas.get('/contracts', async (req, res, next) => {
  const limite = Math.min(Number(req.query.limit) || 50, 100);

  try {
    const contratos = await prisma.contract.findMany({
      orderBy: { createdAt: 'desc' },
      take: limite,
      select: RESUMO,
    });
    res.json({ contracts: contratos });
  } catch (erro) {
    next(erro);
  }
});

rotas.get('/contracts/:id', async (req, res, next) => {
  try {
    const contrato = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!contrato) return res.status(404).json({ error: 'Contrato não encontrado' });

    res.json({ contract: contrato, document: montarContrato(contrato) });
  } catch (erro) {
    next(erro);
  }
});

// O PDF é gerado na hora a partir dos dados do banco, sem guardar binário.
// Assim o download continua funcionando depois de um redeploy e mudanças no
// layout valem também para os contratos antigos.
rotas.get('/contracts/:id/pdf', async (req, res, next) => {
  try {
    const contrato = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!contrato) return res.status(404).json({ error: 'Contrato não encontrado' });

    const pdf = await gerarPdf(montarContrato(contrato));
    const nome = `contrato-${slug(contrato.clientName)}-${contrato.id.slice(-6)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.send(pdf);
  } catch (erro) {
    next(erro);
  }
});

rotas.delete('/contracts/:id', async (req, res, next) => {
  try {
    await prisma.contract.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (erro) {
    if (erro.code === 'P2025') return res.status(404).json({ error: 'Contrato não encontrado' });
    next(erro);
  }
});
