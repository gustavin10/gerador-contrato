import { formatarMoeda, paraCentavos } from '../utils.js';

function Campo({ label, erro, dica, children }) {
  return (
    <label className={`campo ${erro ? 'campo--erro' : ''}`}>
      <span className="campo-label">{label}</span>
      {children}
      {erro && <span className="campo-msg">{erro}</span>}
      {!erro && dica && <span className="campo-dica">{dica}</span>}
    </label>
  );
}

export function Formulario({ valores, erros, templates, onChange, onLimpar, onExemplo }) {
  // Guarda o boilerplate de ler o evento e devolver só o valor.
  const texto = (campo) => ({
    value: valores[campo],
    onChange: (e) => onChange(campo, e.target.value),
  });

  return (
    <form className="formulario" onSubmit={(e) => e.preventDefault()}>
      <div className="secao">
        <div className="secao-topo">
          <h2 className="secao-titulo">Modelo</h2>
          <div className="secao-acoes">
            <button type="button" className="btn-texto" onClick={onExemplo}>
              Carregar exemplo
            </button>
            <button type="button" className="btn-texto" onClick={onLimpar}>
              Limpar
            </button>
          </div>
        </div>

        <div className="modelos">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`modelo ${valores.template === t.id ? 'modelo--on' : ''}`}
              onClick={() => onChange('template', t.id)}
              aria-pressed={valores.template === t.id}
            >
              <span className="modelo-nome">{t.name}</span>
              <span className="modelo-desc">{t.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="secao">
        <h2 className="secao-titulo">Contratante <span className="secao-nota">quem contrata e paga</span></h2>

        <Campo label="Nome ou razão social" erro={erros.clientName}>
          <input {...texto('clientName')} placeholder="Padaria Central Ltda." autoComplete="off" />
        </Campo>

        <div className="linha">
          <Campo label="CPF / CNPJ" erro={erros.clientDoc}>
            <input {...texto('clientDoc')} placeholder="CNPJ 12.345.678/0001-90" autoComplete="off" />
          </Campo>
          <Campo label="Endereço" erro={erros.clientAddress}>
            <input {...texto('clientAddress')} placeholder="Av. T-9, 1500 — Goiânia/GO" autoComplete="off" />
          </Campo>
        </div>
      </div>

      <div className="secao">
        <h2 className="secao-titulo">Contratada <span className="secao-nota">quem presta o serviço</span></h2>

        <Campo label="Nome ou razão social" erro={erros.contractorName}>
          <input {...texto('contractorName')} placeholder="Seu nome ou sua empresa" autoComplete="off" />
        </Campo>

        <div className="linha">
          <Campo label="CPF / CNPJ" erro={erros.contractorDoc}>
            <input {...texto('contractorDoc')} placeholder="CPF 000.000.000-00" autoComplete="off" />
          </Campo>
          <Campo label="Endereço" erro={erros.contractorAddress}>
            <input {...texto('contractorAddress')} placeholder="Rua das Acácias, 120 — Goiânia/GO" autoComplete="off" />
          </Campo>
        </div>
      </div>

      <div className="secao">
        <h2 className="secao-titulo">Serviço</h2>

        <Campo
          label="O que será entregue"
          erro={erros.serviceDescription}
          dica="Vira a Cláusula do Objeto — quanto mais específico, melhor."
        >
          <textarea
            {...texto('serviceDescription')}
            rows={4}
            placeholder="Desenvolvimento de um sistema web para controle de pedidos..."
          />
        </Campo>

        <div className="linha">
          <Campo label="Valor total" erro={erros.valueCents}>
            <input
              inputMode="numeric"
              value={formatarMoeda(valores.valueCents)}
              onChange={(e) => onChange('valueCents', paraCentavos(e.target.value))}
            />
          </Campo>
          <Campo label="Forma de pagamento" erro={erros.paymentTerms}>
            <input {...texto('paymentTerms')} placeholder="50% na assinatura, 50% na entrega" autoComplete="off" />
          </Campo>
        </div>

        <div className="linha">
          <Campo label="Início" erro={erros.startDate}>
            <input type="date" {...texto('startDate')} />
          </Campo>
          <Campo label="Prazo (dias)" erro={erros.deadlineDays}>
            <input
              type="number"
              min="1"
              value={valores.deadlineDays}
              onChange={(e) => onChange('deadlineDays', e.target.value)}
            />
          </Campo>
          <Campo label="Cidade do foro" erro={erros.city}>
            <input {...texto('city')} placeholder="Goiânia" autoComplete="off" />
          </Campo>
        </div>

        <Campo
          label="Condições específicas (opcional)"
          erro={erros.conditions}
          dica="Uma por linha. Cada linha vira um parágrafo de uma cláusula própria."
        >
          <textarea
            {...texto('conditions')}
            rows={3}
            placeholder={'Hospedagem por conta do contratante.\nSuporte incluso por 30 dias.'}
          />
        </Campo>
      </div>
    </form>
  );
}
