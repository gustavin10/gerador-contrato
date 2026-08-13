// Contrato que já vem preenchido ao abrir o app, para dar pra ver o
// resultado sem precisar digitar nada. Fica no front para os campos
// aparecerem no primeiro frame, sem esperar a rede.

function hoje() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const CONTRATO_EXEMPLO = {
  template: 'prestacao-servico',

  contractorName: 'Gustavo Milhomem',
  contractorDoc: 'CPF 000.000.000-00',
  contractorAddress: 'Rua das Acácias, 120, Setor Bueno, Goiânia/GO',

  clientName: 'Padaria Central Ltda.',
  clientDoc: 'CNPJ 12.345.678/0001-90',
  clientAddress: 'Av. T-9, 1500, Setor Marista, Goiânia/GO',

  serviceDescription:
    'Desenvolvimento de um sistema web para controle de pedidos e emissão de relatórios de vendas, incluindo painel administrativo, cadastro de produtos e treinamento da equipe.',

  valueCents: 780000,
  paymentTerms: '40% na assinatura e 60% na entrega, via PIX',
  startDate: hoje(),
  deadlineDays: 45,
  city: 'Goiânia',
  conditions:
    'Hospedagem e domínio ficam por conta do CONTRATANTE.\nSuporte corretivo incluso por 30 dias após a entrega.',
};

export const CONTRATO_VAZIO = {
  template: 'prestacao-servico',
  contractorName: '',
  contractorDoc: '',
  contractorAddress: '',
  clientName: '',
  clientDoc: '',
  clientAddress: '',
  serviceDescription: '',
  valueCents: 0,
  paymentTerms: '',
  startDate: hoje(),
  deadlineDays: 30,
  city: '',
  conditions: '',
};
