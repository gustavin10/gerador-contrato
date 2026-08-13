# Gerador de Contratos

Aplicação web que monta contratos de prestação de serviço a partir de um formulário,
mostra o resultado em tempo real e gera o PDF final no servidor. Todo contrato gerado
fica no histórico e pode ser baixado de novo a qualquer momento.

**[Ver funcionando](https://gerador-contrato.vercel.app)** · o link abre com um contrato
de exemplo já preenchido, então dá para ver o resultado antes de digitar qualquer coisa.

```
React (Vite)  ──HTTP──▶  Express  ──▶  Prisma  ──▶  SQLite
   Vercel                        Railway            arquivo .db
                                    │
                                    └──▶ PDFKit ──▶ PDF (gerado sob demanda)
```

---

## Sumário

- [O que faz](#o-que-faz)
- [Como rodar localmente](#como-rodar-localmente)
- [Por que PDFKit](#por-que-pdfkit-e-não-puppeteer)
- [Como o preview e o PDF ficam iguais](#como-o-preview-e-o-pdf-ficam-iguais)
- [Estrutura de pastas](#estrutura-de-pastas)
- [API](#api)
- [Modelo de dados](#modelo-de-dados)
- [Deploy](#deploy)
- [Decisões técnicas](#decisões-técnicas)

---

## O que faz

- **Formulário** com as partes (contratante e contratada), descrição do serviço, valor,
  forma de pagamento, data de início, prazo, cidade do foro e condições específicas.
- **Dois modelos de contrato:**
  - *Prestação de Serviço* — completo, com obrigações das duas partes, rescisão e foro.
  - *Freelance* — enxuto, com cláusulas de autonomia (sem vínculo empregatício),
    propriedade intelectual, revisões e confidencialidade.
- **Preview em tempo real** — o contrato é remontado enquanto se digita (com debounce
  de 400ms) e aparece numa folha que imita a página impressa.
- **PDF gerado no servidor**, em A4, com valor por extenso, numeração automática de
  cláusulas, assinaturas e rodapé com identificação e paginação.
- **Histórico** de tudo que foi gerado, com opção de reabrir no formulário ou baixar o
  PDF de novo.

O valor sai por extenso no contrato — `R$ 7.800,00 (sete mil e oitocentos reais)` —
seguindo a regra do português para o conector: *"dois mil **e** oitocentos"* (centena
exata) contra *"dois mil, oitocentos **e** cinquenta"*.

---

## Como rodar localmente

**Pré-requisitos:** Node.js 20 ou superior (`node -v` para conferir) e npm.

Você vai precisar de **dois terminais** — um para a API, outro para o front.

### 1. Clonar

```bash
git clone https://github.com/gustavin10/gerador-contrato.git
cd gerador-contrato
```

### 2. Back-end (terminal 1)

```bash
cd server
npm install
cp .env.example .env      # no Windows: copy .env.example .env
npx prisma migrate dev    # cria o banco SQLite e as tabelas
npm run dev
```

A API sobe em `http://localhost:3333`. Para conferir, abra `http://localhost:3333/health`.

Opcional — dois contratos de exemplo no histórico:

```bash
npm run db:seed
```

### 3. Front-end (terminal 2)

```bash
cd web
npm install
npm run dev
```

Abra `http://localhost:5173`. Não precisa criar `.env` aqui: em desenvolvimento o Vite
faz proxy de `/api` para a porta 3333 (veja `web/vite.config.js`).

### Scripts disponíveis

| Pasta    | Comando            | O que faz                                      |
|----------|--------------------|------------------------------------------------|
| `server` | `npm run dev`      | API com reload automático (`node --watch`)      |
| `server` | `npm start`        | API em modo produção                            |
| `server` | `npm run db:migrate` | Cria/aplica migrations em desenvolvimento     |
| `server` | `npm run db:deploy`  | Aplica migrations em produção                 |
| `server` | `npm run db:studio`  | Abre o Prisma Studio para inspecionar o banco |
| `server` | `npm run db:seed`    | Popula o histórico com exemplos               |
| `web`    | `npm run dev`      | Vite em modo desenvolvimento                    |
| `web`    | `npm run build`    | Build de produção em `web/dist`                 |
| `web`    | `npm run preview`  | Serve o build localmente                        |

---

## Por que PDFKit (e não Puppeteer)

A geração de PDF é a parte central do projeto, então a escolha da biblioteca foi a
decisão técnica mais importante. Avaliei três caminhos:

| Biblioteca | Como funciona | Peso | Por que não / por que sim |
|---|---|---|---|
| **Puppeteer** | Sobe um Chromium headless, renderiza HTML e imprime | ~300 MB | Fidelidade perfeita com o preview, mas exige um navegador inteiro no container. Estoura a memória do plano gratuito da Railway e deixa o cold start em vários segundos |
| **pdfmake** | Documento declarado como objeto JSON | ~2 MB | Bom para tabelas, mas menos controle fino sobre posicionamento — e o contrato precisa de linha de assinatura e rodapé em coordenada exata |
| **PDFKit** ✅ | API imperativa que desenha direto no PDF | ~2 MB | **Escolhida** |

**A escolha foi PDFKit**, por quatro motivos:

1. **Sem navegador headless.** O container roda com Node puro. Na Railway isso significa
   build mais rápido, menos memória e nenhuma dependência de sistema para instalar —
   o que mantém o projeto dentro do plano gratuito.
2. **Cold start rápido.** Gerar um contrato de duas páginas leva alguns milissegundos,
   contra os segundos que o Chromium levaria só para iniciar.
3. **Controle exato do layout.** Contrato é documento formal: margem de 2,5 cm,
   justificação, quebra de página que não deixa título de cláusula órfão no rodapé,
   linha de assinatura numa posição precisa. Com PDFKit isso é código explícito, não
   uma negociação com o engine de CSS do navegador.
4. **Acentuação sem fonte externa.** As fontes padrão do PDF (Helvetica) usam
   codificação WinAnsi, que cobre todo o português — `ç`, `ã`, `õ`, `é`. Nenhum arquivo
   `.ttf` precisa ser embarcado.

**O custo dessa escolha:** o layout é escrito em código, não em CSS, e o preview em HTML
precisa ser mantido em sintonia com o PDF por conta própria. A seção seguinte explica
como o projeto resolve isso.

---

## Como o preview e o PDF ficam iguais

O problema clássico de um gerador de documentos é o preview divergir do arquivo final —
duas implementações do mesmo texto que vão se separando com o tempo.

Aqui existe **uma fonte da verdade só**: `server/src/templates/index.js`. Ele recebe os
dados do formulário e devolve uma estrutura neutra, sem HTML e sem PDF:

```js
{
  title: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS",
  intro: ["PADARIA CENTRAL LTDA., inscrito(a) sob o nº ...", ...],
  clauses: [
    { heading: "CLÁUSULA PRIMEIRA — DO OBJETO", paragraphs: ["..."] },
    ...
  ],
  closing: "Goiânia, 13 de agosto de 2026.",
  signatures: [{ role: "CONTRATANTE", name: "...", doc: "..." }, ...]
}
```

Quem consome decide como desenhar:

- `POST /api/contracts/preview` devolve esse objeto e o React o renderiza em HTML.
- `server/src/pdf/gerarPdf.js` percorre o mesmo objeto e o desenha com PDFKit.

Mudar uma cláusula é mexer num arquivo só, e os dois lados acompanham. Por isso o preview
sai do servidor em vez de ser calculado no navegador: custa uma requisição com debounce e
elimina a chance de divergência.

A numeração das cláusulas é calculada na montagem, não escrita à mão — a cláusula de
condições específicas só existe se o campo for preenchido, e as seguintes se renumeram
sozinhas.

---

## Estrutura de pastas

```
gerador-contrato/
├── server/                     API — deploy na Railway
│   ├── prisma/
│   │   ├── schema.prisma       modelo do banco
│   │   ├── migrations/         histórico de migrations (versionado)
│   │   └── seed.js             contratos de exemplo (opcional)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── format.js       moeda, valor por extenso, datas
│   │   │   ├── prisma.js       instância única do Prisma Client
│   │   │   └── schema.js       validação da entrada com Zod
│   │   ├── pdf/
│   │   │   └── gerarPdf.js     desenha o documento em PDF (PDFKit)
│   │   ├── routes/
│   │   │   └── contratos.js    as rotas da API
│   │   ├── templates/
│   │   │   └── index.js        os dois modelos de contrato
│   │   ├── app.js              montagem do Express (CORS, JSON, erros)
│   │   └── server.js           sobe o servidor e trata SIGTERM
│   ├── railway.json            configuração de deploy
│   └── .env.example
│
├── web/                        Front-end — deploy na Vercel
│   ├── src/
│   │   ├── components/
│   │   │   ├── Formulario.jsx  os campos
│   │   │   ├── Preview.jsx     a folha A4 na tela
│   │   │   └── Historico.jsx   lista de contratos gerados
│   │   ├── api.js              cliente HTTP
│   │   ├── demo.js             contrato de exemplo pré-preenchido
│   │   ├── utils.js            formatação de moeda e data
│   │   ├── styles.css
│   │   ├── App.jsx             estado e orquestração
│   │   └── main.jsx
│   ├── vite.config.js          proxy de /api em desenvolvimento
│   ├── vercel.json
│   └── .env.example
│
└── README.md
```

---

## API

Base local: `http://localhost:3333`

| Método   | Rota                        | O que faz                                        |
|----------|-----------------------------|--------------------------------------------------|
| `GET`    | `/health`                   | Healthcheck usado pela Railway                    |
| `GET`    | `/api/templates`            | Lista os modelos disponíveis                      |
| `POST`   | `/api/contracts/preview`    | Monta o contrato **sem gravar** — usado no preview |
| `POST`   | `/api/contracts`            | Grava o contrato e devolve o documento montado    |
| `GET`    | `/api/contracts`            | Histórico (mais recentes primeiro, limite 50)     |
| `GET`    | `/api/contracts/:id`        | Um contrato específico, já montado                |
| `GET`    | `/api/contracts/:id/pdf`    | Baixa o PDF                                       |
| `DELETE` | `/api/contracts/:id`        | Remove do histórico                               |

Exemplo:

```bash
curl -X POST http://localhost:3333/api/contracts \
  -H "Content-Type: application/json" \
  -d '{
    "template": "freelance",
    "clientName": "Marina Rezende",
    "clientDoc": "CPF 111.111.111-11",
    "clientAddress": "Rua 24, 340 — Goiânia/GO",
    "contractorName": "Gustavo Milhomem",
    "contractorDoc": "CPF 000.000.000-00",
    "contractorAddress": "Rua das Acácias, 120 — Goiânia/GO",
    "serviceDescription": "Criação de landing page responsiva.",
    "valueCents": 280000,
    "paymentTerms": "50% na assinatura e 50% na entrega",
    "startDate": "2026-08-13",
    "deadlineDays": 15,
    "city": "Goiânia",
    "conditions": "Textos fornecidos pelo contratante."
  }'
```

Dados inválidos devolvem `422` com os erros campo a campo, que o front usa para destacar
os inputs:

```json
{
  "error": "Dados inválidos",
  "fields": { "clientName": "Nome do contratante: mínimo de 3 caracteres" }
}
```

---

## Modelo de dados

Uma tabela só — o projeto não tem usuários, então cada contrato é um registro
independente.

```prisma
model Contract {
  id                 String   @id @default(cuid())
  template           String   // "prestacao-servico" | "freelance"
  contractorName     String
  contractorDoc      String
  contractorAddress  String
  clientName         String
  clientDoc          String
  clientAddress      String
  serviceDescription String
  valueCents         Int      // dinheiro em centavos, nunca float
  paymentTerms       String
  startDate          String   // ISO "yyyy-mm-dd"
  deadlineDays       Int
  city               String
  conditions         String?
  createdAt          DateTime @default(now())
}
```

**O PDF não é armazenado.** Só os dados vão para o banco; o arquivo é desenhado na hora
de cada download. Isso tem três consequências boas: nada de blob storage, o botão "baixar
de novo" continua funcionando depois de qualquer redeploy, e qualquer melhoria no layout
do PDF passa a valer também para os contratos antigos.

---

## Deploy

### Back-end na Railway

1. Em [railway.app](https://railway.app), **New Project → Deploy from GitHub repo** e
   selecione este repositório.
2. Em **Settings → Root Directory**, coloque `server`. Sem isso a Railway tenta buildar a
   raiz do repositório e não acha o `package.json` certo.
3. Em **Settings → Volumes**, adicione um volume com mount path `/app/data`.

   > **Este passo não é opcional.** O sistema de arquivos do container é efêmero: sem o
   > volume, o arquivo SQLite é recriado do zero a cada deploy e todo o histórico some.

4. Em **Variables**, defina:

   | Variável      | Valor                                     |
   |---------------|-------------------------------------------|
   | `DATABASE_URL`| `file:/app/data/prod.db`                  |
   | `CORS_ORIGIN` | a URL da Vercel (preencha após o passo seguinte) |

   Não defina `PORT` — a Railway injeta a dela, e o `server.js` já a lê.

5. O `railway.json` já cuida do resto: aplica as migrations e sobe o servidor
   (`npx prisma migrate deploy && npm start`), com healthcheck em `/health`.
6. Em **Settings → Networking**, clique em **Generate Domain**. Guarde a URL —
   algo como `https://gerador-contrato-api.up.railway.app`.

### Front-end na Vercel

1. Em [vercel.com](https://vercel.com), **Add New → Project** e importe o mesmo repositório.
2. Em **Root Directory**, selecione `web`. O framework é detectado como Vite.
3. Em **Environment Variables**, adicione:

   | Variável        | Valor                                              |
   |-----------------|----------------------------------------------------|
   | `VITE_API_URL`  | a URL da Railway, **sem barra no final**            |

   > Variáveis `VITE_*` entram no bundle **em tempo de build**. Se você alterar essa
   > variável depois, precisa refazer o deploy — mudar e só recarregar a página não surte
   > efeito.

4. **Deploy**.

### Fechando o CORS

Volte na Railway e coloque a URL da Vercel em `CORS_ORIGIN` (ex.:
`https://gerador-contrato.vercel.app`). O serviço reinicia sozinho. Sem isso, o navegador
bloqueia as chamadas do front para a API.

Para liberar também os previews de branch da Vercel, separe por vírgula:

```
CORS_ORIGIN=https://gerador-contrato.vercel.app,https://gerador-contrato-git-dev.vercel.app
```

### Checklist depois do deploy

- [ ] `https://SUA-API.up.railway.app/health` responde `{"status":"ok"}`
- [ ] O app na Vercel abre com o contrato de exemplo preenchido e o preview montado
- [ ] "Baixar PDF" baixa o arquivo e o contrato aparece no histórico
- [ ] Recarregar a página mantém o histórico (se sumiu, o volume não foi configurado)
- [ ] Nenhum erro de CORS no console do navegador

---

## Decisões técnicas

**Dinheiro em centavos, como inteiro.** `valueCents: 780000` em vez de `7800.00`. Float
binário não representa decimais exatamente, e num contrato o valor é a informação que não
pode ter erro de arredondamento. A formatação em `R$` acontece só na hora de exibir.

**Preview vindo do servidor.** Custa uma requisição com debounce de 400ms, mas garante
que o que está na tela é exatamente o que sai no PDF. Cada requisição carrega um número
de sequência: se uma resposta antiga chega depois de uma nova ter sido disparada, ela é
descartada — sem isso o preview pisca com conteúdo desatualizado enquanto a pessoa digita.

**Validação nos dois lados.** O front valida para dar retorno imediato; o back valida com
Zod porque é ele quem grava. O erro `422` volta em `{ campo: mensagem }`, formato que o
React consome direto para destacar os inputs.

**Campos incompletos não apagam o preview.** Enquanto falta preencher, o servidor não
monta um contrato novo — a tela mantém a última versão válida com um aviso, em vez de
ficar em branco.

**O exemplo pré-preenchido mora no front.** Poderia vir de uma rota da API, mas então os
campos ficariam vazios até a rede responder — e o plano gratuito da Railway hiberna o
serviço quando fica sem uso. Estando em `web/src/demo.js`, o formulário aparece
preenchido no primeiro frame. Se o preview demorar mais de 2,5s, o app explica que o
servidor está acordando em vez de mostrar um spinner mudo.

**Rodapé do PDF com a margem zerada.** Detalhe que custou um bug real: o rodapé é escrito
dentro da margem inferior, e o PDFKit interpreta isso como "o texto não coube", criando
outra página — que também ganha rodapé, e o documento cresce sem parar. Um contrato de
duas páginas virava seis. A correção é zerar `page.margins.bottom` durante a escrita do
rodapé e devolver o valor em seguida.

---

## Licença

MIT.
