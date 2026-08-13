# Gerador de Contratos

Aplicação web que monta contratos de prestação de serviço a partir de um formulário,
mostra o resultado em tempo real e gera o PDF no servidor. Os contratos gerados ficam
num histórico e podem ser baixados de novo.

**[Ver funcionando](https://gerador-de-contratos-beta.vercel.app)** - o link já abre com
um contrato de exemplo preenchido.

```
React (Vite)  --HTTP-->  Express  -->  Prisma  -->  SQLite
   Vercel                      Railway         arquivo .db em volume
                                  |
                                  +--> PDFKit --> PDF
```

## O que faz

- Formulário com as duas partes, descrição do serviço, valor, forma de pagamento,
  data de início, prazo, cidade do foro e condições específicas.
- Dois modelos: *Prestação de Serviço* (completo, com obrigações das duas partes,
  rescisão e foro) e *Freelance* (mais enxuto, com autonomia, propriedade intelectual,
  revisões e sigilo).
- Preview em tempo real enquanto se digita.
- PDF em A4 com valor por extenso, numeração automática de cláusulas, linha de
  assinatura e rodapé com paginação.
- Histórico com opção de reabrir no formulário ou baixar o PDF de novo.

O valor sai por extenso: `R$ 7.800,00 (sete mil e oitocentos reais)`. O conector segue a
regra do português, "dois mil e oitocentos" para centena exata e "dois mil, oitocentos e
cinquenta" nos outros casos.

## Rodando localmente

Precisa de Node 20 ou superior. São dois terminais, um para a API e outro para o front.

**API:**

```bash
cd server
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Sobe em `http://localhost:3333`. Para conferir: `http://localhost:3333/health`.

Se quiser dois contratos de exemplo no histórico, rode `npm run db:seed`.

**Front:**

```bash
cd web
npm install
npm run dev
```

Abra `http://localhost:5173`. Não precisa de `.env` aqui, o Vite faz proxy de `/api`
para a porta 3333.

### Scripts

| Pasta | Comando | O que faz |
|---|---|---|
| server | `npm run dev` | API com reload automático |
| server | `npm start` | API em produção |
| server | `npm run db:migrate` | Cria e aplica migrations |
| server | `npm run db:deploy` | Aplica migrations em produção |
| server | `npm run db:studio` | Abre o Prisma Studio |
| server | `npm run db:seed` | Popula o histórico com exemplos |
| web | `npm run dev` | Vite em desenvolvimento |
| web | `npm run build` | Build de produção |

## Por que PDFKit

Testei três caminhos antes de decidir:

**Puppeteer** renderiza HTML e imprime, o que dá fidelidade perfeita com o preview. O
problema é que ele baixa um Chromium inteiro, uns 300 MB, e sobe um navegador a cada
requisição. Consome muita memória e deixa o cold start em vários segundos, o que não
cabe no plano gratuito da Railway.

**pdfmake** declara o documento como objeto JSON. É bom para tabelas, mas dá menos
controle sobre posicionamento, e aqui eu precisava de linha de assinatura e rodapé em
coordenada exata.

**PDFKit** foi o escolhido:

- Roda em Node puro, sem navegador. Build mais rápido, menos memória e nenhuma
  dependência de sistema para instalar no container.
- Gera um contrato de duas páginas em milissegundos.
- Permite controlar o layout ponto a ponto: margem de 2,5 cm, texto justificado, quebra
  de página que não deixa título de cláusula sozinho no rodapé.
- As fontes padrão do PDF usam codificação WinAnsi, que cobre todo o português. Não
  precisei embarcar nenhum arquivo de fonte.

O custo é que o layout fica em código, não em CSS, e o preview em HTML precisa ser
mantido em sintonia com o PDF. A seção abaixo explica como resolvi isso.

## Preview e PDF sempre iguais

O risco de um gerador de documentos é o preview divergir do arquivo final, com duas
implementações do mesmo texto se afastando com o tempo.

Aqui `server/src/templates/index.js` é a única fonte. Ele recebe os dados do formulário
e devolve o contrato como estrutura de dados, sem HTML e sem PDF:

```js
{
  title: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS",
  intro: ["PADARIA CENTRAL LTDA., inscrito(a) sob o nº ...", ...],
  clauses: [
    { heading: "CLÁUSULA PRIMEIRA — DO OBJETO", paragraphs: ["..."] },
  ],
  closing: "Goiânia, 13 de agosto de 2026.",
  signatures: [{ role: "CONTRATANTE", name: "...", doc: "..." }]
}
```

`POST /api/contracts/preview` devolve esse objeto e o React o renderiza em HTML.
`server/src/pdf/gerarPdf.js` percorre o mesmo objeto e desenha o PDF. Mudar uma cláusula
é mexer num arquivo só.

Por isso o preview vem do servidor em vez de ser calculado no navegador: custa uma
requisição com debounce e elimina a chance de divergência.

## Estrutura

```
server/
  prisma/
    schema.prisma       modelo do banco
    migrations/         versionadas
    seed.js             contratos de exemplo
  src/
    lib/format.js       moeda, valor por extenso, datas
    lib/prisma.js       instância do Prisma Client
    lib/schema.js       validação com Zod
    pdf/gerarPdf.js     desenha o PDF
    routes/contratos.js rotas da API
    templates/index.js  os dois modelos de contrato
    app.js              Express, CORS, tratamento de erro
    server.js           sobe o servidor

web/
  src/
    components/         Formulario, Preview, Historico
    api.js              cliente HTTP
    demo.js             contrato de exemplo
    utils.js            formatação
    App.jsx             estado e orquestração
```

## API

| Método | Rota | O que faz |
|---|---|---|
| GET | `/health` | Healthcheck |
| GET | `/api/templates` | Lista os modelos |
| POST | `/api/contracts/preview` | Monta o contrato sem gravar |
| POST | `/api/contracts` | Grava e devolve o contrato montado |
| GET | `/api/contracts` | Histórico, mais recentes primeiro |
| GET | `/api/contracts/:id` | Um contrato específico |
| GET | `/api/contracts/:id/pdf` | Baixa o PDF |
| DELETE | `/api/contracts/:id` | Remove do histórico |

```bash
curl -X POST http://localhost:3333/api/contracts \
  -H "Content-Type: application/json" \
  -d '{
    "template": "freelance",
    "clientName": "Marina Rezende",
    "clientDoc": "CPF 111.111.111-11",
    "clientAddress": "Rua 24, 340, Goiânia/GO",
    "contractorName": "Gustavo Milhomem",
    "contractorDoc": "CPF 000.000.000-00",
    "contractorAddress": "Rua das Acácias, 120, Goiânia/GO",
    "serviceDescription": "Criação de landing page responsiva.",
    "valueCents": 280000,
    "paymentTerms": "50% na assinatura e 50% na entrega",
    "startDate": "2026-08-13",
    "deadlineDays": 15,
    "city": "Goiânia"
  }'
```

Dado inválido devolve `422` com os erros campo a campo, que o front usa para destacar os
inputs:

```json
{
  "error": "Dados inválidos",
  "fields": { "clientName": "Nome do contratante: mínimo de 3 caracteres" }
}
```

## Banco

Uma tabela só, já que o projeto não tem usuários.

```prisma
model Contract {
  id                 String   @id @default(cuid())
  template           String
  contractorName     String
  contractorDoc      String
  contractorAddress  String
  clientName         String
  clientDoc          String
  clientAddress      String
  serviceDescription String
  valueCents         Int
  paymentTerms       String
  startDate          String
  deadlineDays       Int
  city               String
  conditions         String?
  createdAt          DateTime @default(now())
}
```

O PDF não é armazenado. Só os dados vão para o banco e o arquivo é desenhado a cada
download. Assim não preciso de storage de arquivo, o "baixar de novo" continua
funcionando depois de qualquer deploy, e melhorias no layout valem também para contratos
antigos.

## Deploy

### API na Railway

1. New Project, Deploy from GitHub repo.
2. Settings, Root Directory: `server`. Sem isso o build falha, porque a raiz do
   repositório não tem `package.json`.
3. Crie um volume com mount path `/app/data`. O disco do container é apagado a cada
   deploy, então sem o volume o banco é recriado do zero e o histórico some.
4. Em Variables, defina `DATABASE_URL` como `file:/app/data/prod.db`. Não crie `PORT`,
   a Railway injeta a dela.
5. O `railway.json` aplica as migrations e sobe o servidor.
6. Settings, Networking, Generate Domain.

### Front na Vercel

1. Importe o mesmo repositório.
2. Root Directory: `web`. O framework é detectado como Vite.
3. Adicione `VITE_API_URL` com a URL da Railway, sem barra no final.
4. Deploy.

Variáveis `VITE_*` entram no bundle durante o build. Se mudar depois, precisa refazer o
deploy.

### Fechando o CORS

De volta na Railway, coloque a URL da Vercel em `CORS_ORIGIN`. Sem isso a API aceita
requisição de qualquer origem. Para liberar mais de um domínio, separe por vírgula.

## Algumas decisões

**Dinheiro em centavos, como inteiro.** Float binário não representa decimais
exatamente, e num contrato o valor é o dado que não pode ter erro de arredondamento. A
formatação em reais acontece só na exibição.

**Requisições de preview numeradas.** Se uma resposta antiga chega depois de uma nova ter
sido disparada, ela é descartada. Sem isso o preview pisca com conteúdo desatualizado
enquanto se digita.

**Campo incompleto não apaga o preview.** Enquanto falta preencher, a tela mantém a
última versão válida com um aviso, em vez de ficar em branco.

**O contrato de exemplo fica no front.** Se viesse da API, os campos ficariam vazios até
a rede responder, e o plano gratuito da Railway hiberna o serviço quando fica sem uso.
Estando em `web/src/demo.js`, o formulário já aparece preenchido. Se o preview demorar
mais de 2,5s, o app avisa que o servidor está acordando.

**Rodapé do PDF com a margem zerada.** Esse custou um bug: o rodapé é escrito dentro da
margem inferior, e o PDFKit entende que o texto não coube e cria outra página, que
também ganha rodapé. Um contrato de duas páginas virava seis. A correção é zerar
`page.margins.bottom` enquanto escreve o rodapé e devolver o valor depois.

## Licença

MIT.
