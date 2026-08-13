/**
 * Cliente da API.
 *
 * Em desenvolvimento VITE_API_URL fica vazia: as chamadas vão para "/api/..."
 * e o proxy do Vite repassa para localhost:3333.
 * Em produção (Vercel) a variável aponta para a URL da Railway.
 */

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

class ErroDaApi extends Error {
  constructor(mensagem, { status, fields } = {}) {
    super(mensagem);
    this.name = 'ErroDaApi';
    this.status = status;
    this.fields = fields ?? {};
  }
}

async function requisitar(caminho, opcoes = {}) {
  let resposta;
  try {
    resposta = await fetch(`${BASE}/api${caminho}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opcoes,
    });
  } catch {
    throw new ErroDaApi('Não foi possível falar com o servidor. Verifique sua conexão.');
  }

  if (resposta.status === 204) return null;

  const corpo = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new ErroDaApi(corpo.error ?? 'Erro inesperado no servidor', {
      status: resposta.status,
      fields: corpo.fields,
    });
  }

  return corpo;
}

export const api = {
  templates: () => requisitar('/templates'),

  preview: (dados) =>
    requisitar('/contracts/preview', { method: 'POST', body: JSON.stringify(dados) }),

  criar: (dados) =>
    requisitar('/contracts', { method: 'POST', body: JSON.stringify(dados) }),

  historico: () => requisitar('/contracts'),

  buscar: (id) => requisitar(`/contracts/${id}`),

  remover: (id) => requisitar(`/contracts/${id}`, { method: 'DELETE' }),

  /** URL de download — usada direto num <a>, o navegador cuida do resto. */
  urlDoPdf: (id) => `${BASE}/api/contracts/${id}/pdf`,
};

export { ErroDaApi };
