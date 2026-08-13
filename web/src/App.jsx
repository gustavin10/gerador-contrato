import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { Formulario } from './components/Formulario.jsx';
import { Historico } from './components/Historico.jsx';
import { Preview } from './components/Preview.jsx';
import { CONTRATO_EXEMPLO, CONTRATO_VAZIO } from './demo.js';

const CAMPOS = Object.keys(CONTRATO_VAZIO);

// Descarta id e createdAt ao reabrir um contrato do histórico.
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
  const [aba, setAba] = useState('formulario');

  // Numera cada preview para ignorar resposta antiga que chegue depois de
  // uma nova ter sido disparada.
  const requisicao = useRef(0);

  const carregarHistorico = useCallback(async () => {
    try {
      const { contracts } = await api.historico();
      setHistorico(contracts);
    } catch {
      // O histórico é secundário, o resto do app continua funcionando.
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

  // Debounce de 400ms, senão seria uma requisição por tecla digitada.
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
          // Campo faltando é normal enquanto se preenche: marca os inputs e
          // mantém o último preview válido na tela.
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

  async function gerarPdf() {
    setGerando(true);
    try {
      const { contract } = await api.criar(valores);

      // A resposta vem com Content-Disposition: attachment, então navegar
      // para a URL baixa o arquivo sem descarregar a página.
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
    setValores((atual) => ({ ...atual }));
  }

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
            href="https://github.com/gustavin10/gerador-contrato"
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
