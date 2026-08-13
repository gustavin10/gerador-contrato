import 'dotenv/config';
import { criarApp } from './app.js';
import { prisma } from './lib/prisma.js';

const PORTA = process.env.PORT || 3333;

const servidor = criarApp().listen(PORTA, '0.0.0.0', () => {
  console.log(`API no ar em http://localhost:${PORTA}`);
});

// A Railway envia SIGTERM antes de derrubar o container. Fechar as conexões
// aqui evita que uma escrita no SQLite seja interrompida no meio.
for (const sinal of ['SIGTERM', 'SIGINT']) {
  process.on(sinal, () => {
    console.log(`\n${sinal} recebido, encerrando...`);
    servidor.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}
