/**
 * Formatadores usados na montagem do texto do contrato.
 * Ficam isolados aqui porque tanto o preview quanto o PDF consomem o mesmo
 * documento montado — se a formatação mudar, muda nos dois ao mesmo tempo.
 */

const UNIDADES = [
  'zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito',
  'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis',
  'dezessete', 'dezoito', 'dezenove',
];
const DEZENAS = [
  '', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta',
  'oitenta', 'noventa',
];
const CENTENAS = [
  '', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
  'seiscentos', 'setecentos', 'oitocentos', 'novecentos',
];

/** Escreve por extenso um número de 0 a 999. */
function grupoPorExtenso(n) {
  if (n === 0) return '';
  if (n === 100) return 'cem';

  const partes = [];
  const centena = Math.floor(n / 100);
  const resto = n % 100;

  if (centena > 0) partes.push(CENTENAS[centena]);

  if (resto > 0) {
    if (resto < 20) {
      partes.push(UNIDADES[resto]);
    } else {
      const dezena = Math.floor(resto / 10);
      const unidade = resto % 10;
      partes.push(unidade > 0 ? `${DEZENAS[dezena]} e ${UNIDADES[unidade]}` : DEZENAS[dezena]);
    }
  }

  return partes.join(' e ');
}

/** Escreve por extenso um inteiro de 0 até 999.999.999. */
export function numeroPorExtenso(valor) {
  const n = Math.floor(Math.abs(valor));
  if (n === 0) return 'zero';

  const milhoes = Math.floor(n / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const unidades = n % 1000;

  const partes = [];
  if (milhoes > 0) {
    partes.push(`${grupoPorExtenso(milhoes)} ${milhoes === 1 ? 'milhão' : 'milhões'}`);
  }
  if (milhares > 0) {
    partes.push(milhares === 1 ? 'mil' : `${grupoPorExtenso(milhares)} mil`);
  }
  if (unidades > 0) partes.push(grupoPorExtenso(unidades));

  // O conector antes do último grupo é "e" quando ele é menor que cem
  // ("dois mil e trinta") ou uma centena exata ("dois mil e oitocentos").
  // Nos demais casos é vírgula: "dois mil, oitocentos e cinquenta".
  if (partes.length === 1) return partes[0];
  const ultima = partes.pop();
  const usaE = unidades === 0 || unidades < 100 || unidades % 100 === 0;
  return partes.join(', ') + (usaE ? ' e ' : ', ') + ultima;
}

/** 450000 -> "R$ 4.500,00" */
export function formatarMoeda(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** 450000 -> "quatro mil e quinhentos reais" */
export function moedaPorExtenso(centavos) {
  const reais = Math.floor(centavos / 100);
  const cents = centavos % 100;

  const parteReais = `${numeroPorExtenso(reais)} ${reais === 1 ? 'real' : 'reais'}`;
  if (cents === 0) return parteReais;

  const parteCentavos = `${numeroPorExtenso(cents)} ${cents === 1 ? 'centavo' : 'centavos'}`;
  return `${parteReais} e ${parteCentavos}`;
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
  'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** Interpreta "yyyy-mm-dd" como data local, sem o deslocamento de fuso do Date. */
export function lerDataISO(iso) {
  const [ano, mes, dia] = String(iso).split('-').map(Number);
  return new Date(ano, (mes || 1) - 1, dia || 1);
}

/** "2026-08-13" -> "13/08/2026" */
export function formatarData(iso) {
  const d = lerDataISO(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "2026-08-13" -> "13 de agosto de 2026" */
export function dataPorExtenso(iso) {
  const d = lerDataISO(iso);
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/** Soma dias corridos a uma data ISO e devolve outra data ISO. */
export function somarDias(iso, dias) {
  const d = lerDataISO(iso);
  d.setDate(d.getDate() + Number(dias));
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Quebra um texto livre em parágrafos, descartando linhas vazias. */
export function emParagrafos(texto) {
  if (!texto) return [];
  return String(texto)
    .split(/\n+/)
    .map((linha) => linha.trim())
    .filter(Boolean);
}
