import {
  dataPorExtenso,
  emParagrafos,
  formatarData,
  formatarMoeda,
  moedaPorExtenso,
  numeroPorExtenso,
  somarDias,
} from '../lib/format.js';

export const TEMPLATES = [
  {
    id: 'prestacao-servico',
    name: 'Prestação de Serviço',
    description:
      'Contrato completo entre empresa e prestador, com obrigações de ambas as partes, rescisão e foro.',
  },
  {
    id: 'freelance',
    name: 'Freelance',
    description:
      'Modelo enxuto para trabalho autônomo, com cláusulas de propriedade intelectual, revisões e sigilo.',
  },
];

const ORDINAIS = [
  'PRIMEIRA', 'SEGUNDA', 'TERCEIRA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÉTIMA',
  'OITAVA', 'NONA', 'DÉCIMA', 'DÉCIMA PRIMEIRA', 'DÉCIMA SEGUNDA',
  'DÉCIMA TERCEIRA', 'DÉCIMA QUARTA', 'DÉCIMA QUINTA',
];

// A cláusula de condições específicas só existe se o campo for preenchido,
// então a numeração é calculada depois da montagem.
function numerar(clausulas) {
  return clausulas
    .filter(Boolean)
    .map((clausula, i) => ({
      heading: `CLÁUSULA ${ORDINAIS[i] ?? `${i + 1}ª`} — ${clausula.titulo}`,
      paragraphs: clausula.paragrafos.filter(Boolean),
    }));
}

function derivar(dados) {
  const fim = somarDias(dados.startDate, dados.deadlineDays);
  return {
    valor: `${formatarMoeda(dados.valueCents)} (${moedaPorExtenso(dados.valueCents)})`,
    prazo: `${dados.deadlineDays} (${numeroPorExtenso(dados.deadlineDays)}) dias corridos`,
    inicio: formatarData(dados.startDate),
    fim: formatarData(fim),
    condicoes: emParagrafos(dados.conditions),
  };
}

function qualificacao(dados) {
  return [
    `${dados.clientName.toUpperCase()}, inscrito(a) sob o nº ${dados.clientDoc}, ` +
      `com endereço em ${dados.clientAddress}, doravante denominado(a) simplesmente CONTRATANTE;`,
    `${dados.contractorName.toUpperCase()}, inscrito(a) sob o nº ${dados.contractorDoc}, ` +
      `com endereço em ${dados.contractorAddress}, doravante denominado(a) simplesmente CONTRATADA;`,
    'Têm entre si justo e contratado o presente instrumento particular, que se regerá pelas ' +
      'cláusulas e condições a seguir estabelecidas.',
  ];
}

function assinaturas(dados) {
  return [
    { role: 'CONTRATANTE', name: dados.clientName, doc: dados.clientDoc },
    { role: 'CONTRATADA', name: dados.contractorName, doc: dados.contractorDoc },
  ];
}

function prestacaoServico(dados) {
  const d = derivar(dados);

  return {
    title: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS',
    intro: qualificacao(dados),
    clauses: numerar([
      {
        titulo: 'DO OBJETO',
        paragrafos: [
          'O presente contrato tem por objeto a prestação, pela CONTRATADA ao CONTRATANTE, ' +
            `dos seguintes serviços: ${dados.serviceDescription}`,
          'Os serviços serão executados com autonomia técnica pela CONTRATADA, que responde ' +
            'pela qualidade e pela adequação do resultado entregue.',
        ],
      },
      {
        titulo: 'DO PRAZO',
        paragrafos: [
          `Os serviços terão início em ${d.inicio} e prazo de execução de ${d.prazo}, ` +
            `encerrando-se em ${d.fim}.`,
          'Parágrafo único. O prazo poderá ser prorrogado mediante acordo entre as partes, ' +
            'formalizado por escrito.',
        ],
      },
      {
        titulo: 'DO VALOR E DA FORMA DE PAGAMENTO',
        paragrafos: [
          `Pela prestação dos serviços, o CONTRATANTE pagará à CONTRATADA o valor total de ${d.valor}.`,
          `Forma de pagamento: ${dados.paymentTerms}`,
          'Parágrafo único. O atraso no pagamento implicará multa de 2% (dois por cento) sobre ' +
            'o valor em aberto, acrescida de juros de 1% (um por cento) ao mês.',
        ],
      },
      {
        titulo: 'DAS OBRIGAÇÕES DA CONTRATADA',
        paragrafos: [
          'Executar os serviços descritos na Cláusula Primeira dentro do prazo ajustado, ' +
            'observando as boas práticas aplicáveis à atividade.',
          'Manter o CONTRATANTE informado sobre o andamento dos trabalhos e comunicar de ' +
            'imediato qualquer fato que possa comprometer o prazo ou o resultado.',
          'Arcar com os tributos e encargos decorrentes da sua própria atividade.',
        ],
      },
      {
        titulo: 'DAS OBRIGAÇÕES DO CONTRATANTE',
        paragrafos: [
          'Fornecer à CONTRATADA as informações, os acessos e os materiais necessários à ' +
            'execução dos serviços, em tempo hábil.',
          'Efetuar os pagamentos nas condições e nos prazos pactuados na Cláusula Terceira.',
          'Indicar um responsável para validar as entregas e responder às solicitações da CONTRATADA.',
        ],
      },
      d.condicoes.length > 0 && {
        titulo: 'DAS CONDIÇÕES ESPECÍFICAS',
        paragrafos: d.condicoes,
      },
      {
        titulo: 'DA RESCISÃO',
        paragrafos: [
          'Este contrato poderá ser rescindido por qualquer das partes, mediante aviso prévio ' +
            'por escrito de 15 (quinze) dias.',
          'Em caso de rescisão, serão devidos à CONTRATADA os valores proporcionais aos ' +
            'serviços efetivamente prestados até a data do encerramento.',
        ],
      },
      {
        titulo: 'DO FORO',
        paragrafos: [
          `Fica eleito o foro da comarca de ${dados.city} para dirimir quaisquer dúvidas ou ` +
            'litígios decorrentes deste contrato, com renúncia a qualquer outro, por mais ' +
            'privilegiado que seja.',
          'E, por estarem assim justas e contratadas, as partes assinam o presente instrumento ' +
            'em 2 (duas) vias de igual teor e forma.',
        ],
      },
    ]),
    closing: `${dados.city}, ${dataPorExtenso(dados.startDate)}.`,
    signatures: assinaturas(dados),
  };
}

function freelance(dados) {
  const d = derivar(dados);

  return {
    title: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS AUTÔNOMOS',
    intro: qualificacao(dados),
    clauses: numerar([
      {
        titulo: 'DO OBJETO',
        paragrafos: [
          'A CONTRATADA, na condição de profissional autônoma, prestará ao CONTRATANTE os ' +
            `seguintes serviços: ${dados.serviceDescription}`,
        ],
      },
      {
        titulo: 'DA AUTONOMIA E DA AUSÊNCIA DE VÍNCULO',
        paragrafos: [
          'A CONTRATADA presta os serviços com total autonomia, sem subordinação, controle de ' +
            'jornada ou exclusividade, não se estabelecendo entre as partes qualquer vínculo ' +
            'empregatício nos termos da legislação trabalhista.',
          'A CONTRATADA é a única responsável pelos encargos fiscais e previdenciários ' +
            'decorrentes da sua atividade.',
        ],
      },
      {
        titulo: 'DO PRAZO E DAS ENTREGAS',
        paragrafos: [
          `Os trabalhos terão início em ${d.inicio} e prazo de ${d.prazo}, com entrega final ` +
            `prevista para ${d.fim}.`,
          'Atrasos causados por falta de resposta, de material ou de acesso por parte do ' +
            'CONTRATANTE prorrogam automaticamente o prazo de entrega pelo mesmo número de dias.',
        ],
      },
      {
        titulo: 'DA REMUNERAÇÃO',
        paragrafos: [
          `O CONTRATANTE pagará à CONTRATADA o valor total de ${d.valor} pelo escopo descrito ` +
            'na Cláusula Primeira.',
          `Forma de pagamento: ${dados.paymentTerms}`,
          'Serviços solicitados fora do escopo original serão orçados separadamente e só ' +
            'iniciados após aprovação por escrito.',
        ],
      },
      {
        titulo: 'DAS REVISÕES',
        paragrafos: [
          'Estão incluídas até 2 (duas) rodadas de ajustes sobre cada entrega, desde que ' +
            'solicitadas em até 7 (sete) dias do envio e dentro do escopo contratado.',
        ],
      },
      {
        titulo: 'DA PROPRIEDADE INTELECTUAL',
        paragrafos: [
          'Quitado integralmente o valor previsto na Cláusula Quarta, os direitos patrimoniais ' +
            'sobre o resultado final são cedidos ao CONTRATANTE.',
          'A CONTRATADA mantém o direito de exibir o trabalho em seu portfólio, salvo vedação ' +
            'expressa registrada nas condições específicas.',
        ],
      },
      {
        titulo: 'DA CONFIDENCIALIDADE',
        paragrafos: [
          'As partes se obrigam a manter sigilo sobre as informações a que tiverem acesso em ' +
            'razão deste contrato, obrigação que permanece válida após o seu encerramento.',
        ],
      },
      d.condicoes.length > 0 && {
        titulo: 'DAS CONDIÇÕES ESPECÍFICAS',
        paragrafos: d.condicoes,
      },
      {
        titulo: 'DA RESCISÃO E DO FORO',
        paragrafos: [
          'Qualquer das partes poderá rescindir este contrato mediante comunicação por escrito, ' +
            'ficando devidos os valores proporcionais ao trabalho já executado.',
          `Fica eleito o foro da comarca de ${dados.city} para dirimir eventuais controvérsias ` +
            'decorrentes deste instrumento.',
        ],
      },
    ]),
    closing: `${dados.city}, ${dataPorExtenso(dados.startDate)}.`,
    signatures: assinaturas(dados),
  };
}

const RENDERIZADORES = {
  'prestacao-servico': prestacaoServico,
  freelance,
};

export function templateExiste(id) {
  return Object.hasOwn(RENDERIZADORES, id);
}

// Devolve o contrato como estrutura de dados (título, parágrafos, cláusulas).
// O preview em React e o PDF leem essa mesma saída.
export function montarContrato(dados) {
  const renderizar = RENDERIZADORES[dados.template];
  if (!renderizar) {
    throw new Error(`Template desconhecido: ${dados.template}`);
  }

  const documento = renderizar(dados);
  const template = TEMPLATES.find((t) => t.id === dados.template);

  return {
    ...documento,
    meta: {
      template: dados.template,
      templateName: template.name,
      id: dados.id ?? null,
      createdAt: dados.createdAt ?? null,
    },
  };
}
