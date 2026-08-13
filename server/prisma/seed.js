// Popula o histórico com dois contratos de exemplo: npm run db:seed

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EXEMPLOS = [
  {
    template: 'prestacao-servico',
    contractorName: 'Gustavo Milhomem',
    contractorDoc: 'CPF 000.000.000-00',
    contractorAddress: 'Rua das Acácias, 120, Setor Bueno, Goiânia/GO',
    clientName: 'Padaria Central Ltda.',
    clientDoc: 'CNPJ 12.345.678/0001-90',
    clientAddress: 'Av. T-9, 1500, Setor Marista, Goiânia/GO',
    serviceDescription:
      'Desenvolvimento de sistema web para controle de pedidos e emissão de relatórios de vendas, incluindo painel administrativo e treinamento da equipe.',
    valueCents: 780000,
    paymentTerms: '40% na assinatura e 60% na entrega, via PIX',
    startDate: '2026-07-01',
    deadlineDays: 45,
    city: 'Goiânia',
    conditions:
      'Hospedagem e domínio ficam por conta do CONTRATANTE.\nSuporte corretivo incluso por 30 dias após a entrega.',
  },
  {
    template: 'freelance',
    contractorName: 'Gustavo Milhomem',
    contractorDoc: 'CPF 000.000.000-00',
    contractorAddress: 'Rua das Acácias, 120, Setor Bueno, Goiânia/GO',
    clientName: 'Marina Rezende',
    clientDoc: 'CPF 111.111.111-11',
    clientAddress: 'Rua 24, 340, Setor Oeste, Goiânia/GO',
    serviceDescription:
      'Criação de landing page responsiva com formulário de contato integrado a e-mail e otimização básica de SEO.',
    valueCents: 280000,
    paymentTerms: '50% na assinatura e 50% na entrega, via PIX',
    startDate: '2026-08-04',
    deadlineDays: 15,
    city: 'Goiânia',
    conditions: 'Textos e imagens fornecidos pelo CONTRATANTE.',
  },
];

async function main() {
  const existentes = await prisma.contract.count();
  if (existentes > 0) {
    console.log(`Histórico já tem ${existentes} contrato(s). Nada a fazer.`);
    return;
  }

  for (const exemplo of EXEMPLOS) {
    const criado = await prisma.contract.create({ data: exemplo });
    console.log(`Criado: ${criado.clientName} (${criado.template})`);
  }
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
