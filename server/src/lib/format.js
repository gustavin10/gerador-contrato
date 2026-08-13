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

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
  'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

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

  if (partes.length === 1) return partes[0];

  // "e" antes do último grupo quando ele é menor que cem ou uma centena exata:
  // "dois mil e trinta", "dois mil e oitocentos", "dois mil, oitocentos e cinquenta"
  const ultima = partes.pop();
  const usaE = unidades === 0 || unidades < 100 || unidades % 100 === 0;
  return partes.join(', ') + (usaE ? ' e ' : ', ') + ultima;
}

export function formatarMoeda(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function moedaPorExtenso(centavos) {
  const reais = Math.floor(centavos / 100);
  const cents = centavos % 100;

  const parteReais = `${numeroPorExtenso(reais)} ${reais === 1 ? 'real' : 'reais'}`;
  if (cents === 0) return parteReais;

  const parteCentavos = `${numeroPorExtenso(cents)} ${cents === 1 ? 'centavo' : 'centavos'}`;
  return `${parteReais} e ${parteCentavos}`;
}

// new Date('2026-08-13') seria interpretado como UTC e voltaria um dia
// dependendo do fuso, por isso montamos a data campo a campo.
export function lerDataISO(iso) {
  const [ano, mes, dia] = String(iso).split('-').map(Number);
  return new Date(ano, (mes || 1) - 1, dia || 1);
}

export function formatarData(iso) {
  const d = lerDataISO(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function dataPorExtenso(iso) {
  const d = lerDataISO(iso);
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function somarDias(iso, dias) {
  const d = lerDataISO(iso);
  d.setDate(d.getDate() + Number(dias));
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function emParagrafos(texto) {
  if (!texto) return [];
  return String(texto)
    .split(/\n+/)
    .map((linha) => linha.trim())
    .filter(Boolean);
}
