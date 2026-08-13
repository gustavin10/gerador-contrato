/** 780000 -> "R$ 7.800,00" */
export function formatarMoeda(centavos) {
  return (Number(centavos || 0) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** Lê o que a pessoa digitou no campo de dinheiro e devolve centavos. */
export function paraCentavos(texto) {
  const digitos = String(texto).replace(/\D/g, '').slice(0, 13);
  return digitos ? Number(digitos) : 0;
}

/** "2026-08-13T10:00:00.000Z" -> "13/08/2026 às 10:00" */
export function formatarDataHora(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
