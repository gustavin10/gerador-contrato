/**
 * Desenha o documento montado pelos templates em um PDF A4.
 *
 * PDFKit trabalha em pontos tipográficos (1pt = 1/72 pol). A4 = 595 x 842pt.
 * Margem de 2,5cm ≈ 71pt, que é o padrão de documento formal no Brasil.
 */

import PDFDocument from 'pdfkit';
import { formatarData } from '../lib/format.js';

const MARGEM = 71;
const LARGURA_PAGINA = 595.28;
const LARGURA_UTIL = LARGURA_PAGINA - MARGEM * 2;

const FONTE = 'Helvetica';
const FONTE_BOLD = 'Helvetica-Bold';

/**
 * @param {object} documento saída de montarContrato()
 * @returns {Promise<Buffer>} o PDF pronto, em memória
 */
export function gerarPdf(documento) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGEM, bottom: MARGEM, left: MARGEM, right: MARGEM },
      // Guarda as páginas em buffer para poder voltar nelas depois e numerar
      // o rodapé — só no fim sabemos quantas páginas o contrato tem.
      bufferPages: true,
      info: {
        Title: documento.title,
        Author: documento.signatures?.[1]?.name ?? 'Gerador de Contratos',
        Subject: documento.meta?.templateName ?? 'Contrato',
        Creator: 'Gerador de Contratos',
      },
    });

    const pedacos = [];
    doc.on('data', (pedaco) => pedacos.push(pedaco));
    doc.on('end', () => resolve(Buffer.concat(pedacos)));
    doc.on('error', reject);

    desenhar(doc, documento);
    numerarPaginas(doc, documento);

    doc.end();
  });
}

function desenhar(doc, documento) {
  // --- Título -------------------------------------------------------------
  doc.font(FONTE_BOLD).fontSize(14).text(documento.title, {
    align: 'center',
    characterSpacing: 0.5,
  });

  // Linha divisória sob o título
  const y = doc.y + 10;
  doc.moveTo(MARGEM, y)
    .lineTo(MARGEM + LARGURA_UTIL, y)
    .lineWidth(0.8)
    .strokeColor('#111111')
    .stroke();
  doc.y = y + 22;

  // --- Qualificação das partes -------------------------------------------
  doc.font(FONTE).fontSize(10.5).fillColor('#000000');
  for (const paragrafo of documento.intro) {
    doc.text(paragrafo, { align: 'justify', lineGap: 2.5 });
    doc.moveDown(0.7);
  }

  doc.moveDown(0.5);

  // --- Cláusulas ----------------------------------------------------------
  for (const clausula of documento.clauses) {
    // Evita que um título de cláusula fique órfão no pé da página.
    manterJunto(doc, 60);

    doc.font(FONTE_BOLD).fontSize(10.5).text(clausula.heading, { align: 'left' });
    doc.moveDown(0.4);

    doc.font(FONTE).fontSize(10.5);
    for (const paragrafo of clausula.paragraphs) {
      doc.text(paragrafo, { align: 'justify', lineGap: 2.5, indent: 14 });
      doc.moveDown(0.45);
    }
    doc.moveDown(0.6);
  }

  // --- Local e data -------------------------------------------------------
  manterJunto(doc, 190);
  doc.moveDown(1.2);
  doc.font(FONTE).fontSize(10.5).text(documento.closing, { align: 'right' });

  // --- Assinaturas --------------------------------------------------------
  doc.moveDown(3);
  desenharAssinaturas(doc, documento.signatures);
}

function desenharAssinaturas(doc, assinaturas) {
  const larguraLinha = 220;
  const espaco = LARGURA_UTIL - larguraLinha * 2;
  const colunas = [MARGEM, MARGEM + larguraLinha + espaco];
  const topo = doc.y;

  assinaturas.forEach((assinatura, i) => {
    const x = colunas[i % 2];

    doc.moveTo(x, topo)
      .lineTo(x + larguraLinha, topo)
      .lineWidth(0.8)
      .strokeColor('#111111')
      .stroke();

    doc.font(FONTE_BOLD).fontSize(9.5)
      .text(assinatura.name, x, topo + 7, { width: larguraLinha, align: 'center' });

    doc.font(FONTE).fontSize(8.5).fillColor('#444444')
      .text(assinatura.doc, x, doc.y + 1, { width: larguraLinha, align: 'center' })
      .text(assinatura.role, x, doc.y + 1, { width: larguraLinha, align: 'center' });

    doc.fillColor('#000000');
  });
}

/** Quebra a página se não couber `altura` pontos no espaço restante. */
function manterJunto(doc, altura) {
  const limite = doc.page.height - doc.page.margins.bottom;
  if (doc.y + altura > limite) doc.addPage();
}

/** Rodapé com identificação do documento e "Página X de Y". */
function numerarPaginas(doc, documento) {
  const intervalo = doc.bufferedPageRange();
  const emissao = documento.meta?.createdAt
    ? formatarData(String(documento.meta.createdAt).slice(0, 10))
    : null;

  const identificacao = [
    documento.meta?.id ? `Documento ${documento.meta.id}` : null,
    emissao ? `emitido em ${emissao}` : null,
  ].filter(Boolean).join(' · ');

  for (let i = intervalo.start; i < intervalo.start + intervalo.count; i++) {
    doc.switchToPage(i);

    // O rodapé é escrito DENTRO da margem inferior. Se a margem continuar
    // valendo, o PDFKit entende que o texto não coube e cria outra página —
    // que por sua vez ganha rodapé, e o documento cresce sem parar. Zerar a
    // margem durante a escrita e devolvê-la em seguida evita isso.
    const margemOriginal = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    const y = doc.page.height - MARGEM + 26;

    doc.font(FONTE).fontSize(7.5).fillColor('#777777');
    if (identificacao) {
      doc.text(identificacao, MARGEM, y, { width: LARGURA_UTIL, align: 'left', lineBreak: false });
    }
    doc.text(
      `Página ${i - intervalo.start + 1} de ${intervalo.count}`,
      MARGEM, y,
      { width: LARGURA_UTIL, align: 'right', lineBreak: false },
    );

    doc.page.margins.bottom = margemOriginal;
  }
}
