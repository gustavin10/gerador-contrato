import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { Formulario } from './components/Formulario.jsx';
import { Historico } from './components/Historico.jsx';
import { Preview } from './components/Preview.jsx';
import { CONTRATO_EXEMPLO, CONTRATO_VAZIO } from './demo.js';

const CAMPOS = Object.keys(CONTRATO_VAZIO);

/** Descarta o que não é campo do formulário (id, createdAt) ao reabrir do histórico. */
function somenteCampos(objeto) {
  return Object.fromEntries(CAMPOS.map((campo) => [campo, objeto[campo] ?? '']));
}

export default function App() {
  const [valores, setValores] = useState(CONTRATO_EXEMPLO);
  const [templates, setTemplates] = useState([]);

  const [documento, setDocumento] = useState(null);
  const [carregandoPreview, setCarregandoPreview] = useState(true);
  const [erroPreview, setErroPreview] = useState(null);
  const [lento, setLento] = useState(false);
  const [erros, setErros] = useState({});

  const [historico, setHistorico] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);

  const [gerando, setGerando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [aba, setAba] = useState('formulario'); // só usado no layout mobile

  // Cada preview recebe um número. Se uma resposta antiga chegar depois de
  // uma nova ter sido disparada, ela é ignorada — senão o preview "pisca"
  // com conteúdo desatualizado enquanto a pessoa digita.
  const requisicao = useRef(0);

  const carregarHistorico = useCallback(async () => {
    try {
      const { contracts } = await api.historico();
      setHistorico(contracts);
    } catch {
      // O histórico é secundário: se falhar, o resto do app continua útil.
    } finally {
      setCarregandoHistorico(false);
    }
  }, []);

  useEffect(() => {
    api.templates()
      .then(({ templates }) => setTemplates(templates))
      .catch(() => setTemplates([
        { id: 'prestacao-servico', name: 'Prestação de Serviço', description: 'Modelo completo.' },
        { id: 'freelance', name: 'Freelance', description: 'Modelo para trabalho autônomo.' },
      ]));

    carregarHistorico();
  }, [carregarHistorico]);

  // --- Preview ------------------------------------------------------------
  // Debounce de 400ms: sem isso seria uma requisição por tecla digitada.
  useEffect(() => {
    const meuNumero = ++requisicao.current;
    setCarregandoPreview(true);

    const alarme = setTimeout(async () => {
      try {
        const { document } = await api.preview(valores);
        if (meuNumero !== requisicao.current) return;

        setDocumento(document);
        setErroPreview(null);
        setErros({});
      } catch (erro) {
        if (meuNumero !== requisicao.current) return;

        if (erro.status === 422) {
          // Campos incompletos são o estado normal de quem está preenchendo:
          // marcamos os inputs e mantemos na tela o último preview válido.
          setErros(erro.fields);
          setErroPreview(null);
        } else {
          setErroPreview(erro.message);
        }
      } finally {
        if (meuNumero === requisicao.current) setCarregandoPreview(false);
      }
    }, 400);

    return () => clearTimeout(alarme);
  }, [valores]);

  // Aviso de servidor hibernando — só se a primeira carga demorar.
  useEffect(() => {
    if (documento) return undefined;
    const alarme = setTimeout(() => setLento(true), 2500);
    return () => clearTimeout(alarme);
  }, [documento]);

  const alterar = useCallback((campo, valor) => {
    setValores((atual) => ({ ...atual, [campo]: valor }));
  }, []);

  function mostrarAviso(texto, tipo = 'ok') {
    setAviso({ texto, tipo });
    setTimeout(() => setAviso(null), 4500);
  }

  // --- Ações --------------------------------------------------------------

  async function gerarPdf() {
    setGerando(true);
    try {
      const { contract } = await api.criar(valores);

      // Navegar para a URL do PDF dispara o download sem descarregar a
      // página: a resposta vem com Content-Disposition: attachment.
      window.location.assign(api.urlDoPdf(contract.id));

      await carregarHistorico();
      mostrarAviso('PDF gerado e salvo no histórico.');
    } catch (erro) {
      if (erro.status === 422) {
        setErros(erro.fields);
        mostrarAviso('Revise os campos destacados antes de gerar o PDF.', 'erro');
      } else {
        mostrarAviso(erro.message, 'erro');
      }
    } finally {
      setGerando(false);
    }
  }

  async function abrirDoHistorico(id) {
    try {
      const { contract, document } = await api.buscar(id);
      setValores(somenteCampos(contract));
      setDocumento(document);
      setAba('preview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (erro) {
      mostrarAviso(erro.message, 'erro');
    }
  }

  async function removerDoHistorico(id) {
    if (!window.confirm('Excluir este contrato do histórico?')) return;
    try {
      await api.remover(id);
      setHistorico((atual) => atual.filter((c) => c.id !== id));
    } catch (erro) {
      mostrarAviso(erro.message, 'erro');
    }
  }

  function reenviarPreview() {
    setErroPreview(null);
    setValores((atual) => ({ ...atual })); // nova referência → dispara o efeito
  }

  // --- Render -------------------------------------------------------------

  return (
    <div className="app">
      <header className="topo">
        <div className="topo-marca">
          <span className="topo-sigla">§</span>
          <div>
            <h1 className="topo-titulo">Gerador de Contratos</h1>
            <p className="topo-sub">Preencha, confira o preview e baixe o PDF</p>
          </div>
        </div>

        <div className="topo-acoes">
          <a
            className="btn btn--fantasma"
            href="https://github.com/SEU-USUARIO/gerador-contrato"
            target="_blank"
            rel="noopener noreferrer"
          >
            Código no GitHub
          </a>
          <button
            type="button"
            className="btn btn--principal"
            onClick={gerarPdf}
            disabled={gerando || !documento}
          >
            {gerando ? 'Gerando...' : 'Baixar PDF'}
          </button>
        </div>
      </header>

      <nav className="abas" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'formulario'}
          className={aba === 'formulario' ? 'aba aba--on' : 'aba'}
          onClick={() => setAba('formulario')}
        >
          Formulário
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'preview'}
          className={aba === 'preview' ? 'aba aba--on' : 'aba'}
          onClick={() => setAba('preview')}
        >
          Preview
        </button>
      </nav>

      <main className="palco">
        <div className={`coluna coluna--form ${aba === 'formulario' ? '' : 'coluna--oculta'}`}>
          <Formulario
            valores={valores}
            erros={erros}
            templates={templates}
            onChange={alterar}
            onLimpar={() => setValores(CONTRATO_VAZIO)}
            onExemplo={() => setValores(CONTRATO_EXEMPLO)}
          />
        </div>

        <div className={`coluna coluna--preview ${aba === 'preview' ? '' : 'coluna--oculta'}`}>
          <div className="preview-caixa">
            <div className="preview-topo">
              <span className="preview-etiqueta">Preview</span>
              {carregandoPreview && documento && <span className="preview-status">atualizando</span>}
            </div>
            <div className="preview-rolagem">
              <Preview
                documento={documento}
                carregando={carregandoPreview}
                erro={erroPreview}
                lento={lento}
                desatualizado={Object.keys(erros).length > 0}
                onTentarDeNovo={reenviarPreview}
              />
            </div>
          </div>
        </div>
      </main>

      <section className="secao-historico">
        <div className="secao-topo">
          <h2 className="secao-titulo">Histórico</h2>
          <span className="secao-nota">
            {historico.length > 0 && `${historico.length} contrato(s)`}
          </span>
        </div>
        <Historico
          contratos={historico}
          carregando={carregandoHistorico}
          onAbrir={abrirDoHistorico}
          onRemover={removerDoHistorico}
        />
      </section>

      <footer className="rodape">
        <span>Gustavo Milhomem · Goiânia, GO</span>
        <span>React · Node · Express · Prisma · SQLite · PDFKit</span>
      </footer>

      {aviso && (
        <div className={`aviso aviso--${aviso.tipo}`} role="status">
          {aviso.texto}
        </div>
      )}
    </div>
  );
}
