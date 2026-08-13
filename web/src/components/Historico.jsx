import { api } from '../api.js';
import { formatarDataHora, formatarMoeda } from '../utils.js';

const NOME_DO_MODELO = {
  'prestacao-servico': 'Prestação de Serviço',
  freelance: 'Freelance',
};

export function Historico({ contratos, carregando, onAbrir, onRemover }) {
  if (carregando) {
    return <p className="historico-vazio">Carregando histórico...</p>;
  }

  if (contratos.length === 0) {
    return (
      <p className="historico-vazio">
        Nenhum contrato gerado ainda. Os que você baixar aparecem aqui e podem ser
        baixados de novo a qualquer momento.
      </p>
    );
  }

  return (
    <ul className="historico">
      {contratos.map((contrato) => (
        <li key={contrato.id} className="historico-item">
          <div className="historico-info">
            <span className="historico-modelo">{NOME_DO_MODELO[contrato.template] ?? contrato.template}</span>
            <strong className="historico-cliente">{contrato.clientName}</strong>
            <span className="historico-servico">{contrato.serviceDescription}</span>
            <span className="historico-meta">
              {formatarMoeda(contrato.valueCents)} · {formatarDataHora(contrato.createdAt)}
            </span>
          </div>

          <div className="historico-acoes">
            <button type="button" className="btn btn--secundario" onClick={() => onAbrir(contrato.id)}>
              Abrir
            </button>
            {/* Download direto pela URL: o navegador baixa sem passar o
                arquivo pelo JavaScript. */}
            <a className="btn btn--secundario" href={api.urlDoPdf(contrato.id)}>
              PDF
            </a>
            <button
              type="button"
              className="btn-icone"
              title="Excluir do histórico"
              aria-label={`Excluir contrato de ${contrato.clientName}`}
              onClick={() => onRemover(contrato.id)}
            >
              ×
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
