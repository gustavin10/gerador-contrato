/**
 * Desenha na tela o mesmo documento que o PDFKit desenha no arquivo.
 * A folha imita uma página A4 com serifada, para o preview parecer com o
 * resultado impresso — mas o conteúdo vem inteiro do servidor.
 */
export function Preview({ documento, carregando, erro, lento, desatualizado, onTentarDeNovo }) {
  if (erro) {
    return (
      <div className="preview-estado">
        <p className="preview-estado-titulo">Não foi possível montar o preview</p>
        <p className="preview-estado-texto">{erro}</p>
        {onTentarDeNovo && (
          <button type="button" className="btn btn--secundario" onClick={onTentarDeNovo}>
            Tentar de novo
          </button>
        )}
      </div>
    );
  }

  if (!documento) {
    return (
      <div className="preview-estado">
        <div className="spinner" aria-hidden="true" />
        <p className="preview-estado-texto">
          {lento
            ? 'O servidor gratuito hiberna quando fica sem uso — a primeira requisição leva alguns segundos.'
            : 'Montando o contrato...'}
        </p>
      </div>
    );
  }

  return (
    <div className={`folha ${carregando ? 'folha--atualizando' : ''}`} aria-busy={carregando}>
      {/* Enquanto faltam campos, o servidor não monta um contrato novo. Em vez
          de esvaziar a tela, seguramos a última versão válida — mas dizendo
          que ela está desatualizada, senão parece que a edição não pegou. */}
      {desatualizado && (
        <p className="folha-aviso">
          Última versão válida — complete os campos destacados para atualizar.
        </p>
      )}

      <h1 className="folha-titulo">{documento.title}</h1>
      <div className="folha-regua" />

      {documento.intro.map((paragrafo, i) => (
        <p key={i} className="folha-p">{paragrafo}</p>
      ))}

      {documento.clauses.map((clausula) => (
        <section key={clausula.heading} className="folha-clausula">
          <h2 className="folha-clausula-titulo">{clausula.heading}</h2>
          {clausula.paragraphs.map((paragrafo, i) => (
            <p key={i} className="folha-p folha-p--recuo">{paragrafo}</p>
          ))}
        </section>
      ))}

      <p className="folha-local">{documento.closing}</p>

      <div className="folha-assinaturas">
        {documento.signatures.map((assinatura) => (
          <div key={assinatura.role} className="folha-assinatura">
            <div className="folha-linha" />
            <strong>{assinatura.name}</strong>
            <span>{assinatura.doc}</span>
            <span>{assinatura.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
