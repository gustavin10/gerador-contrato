/**
 * Validação da entrada da API.
 *
 * Nunca confiar no que chega do formulário: o front valida para dar feedback
 * rápido, o back valida porque é ele quem grava no banco. O Zod devolve os
 * erros campo a campo, e a rota repassa isso para o React destacar os inputs.
 */

import { z } from 'zod';
import { TEMPLATES } from '../templates/index.js';

const idsDeTemplate = TEMPLATES.map((t) => t.id);

// "Preencha X" evita ter que acertar o gênero de cada rótulo
// ("é obrigatório" vs. "é obrigatória") em toda mensagem.
const texto = (min, max, campo) =>
  z.string({ required_error: `Preencha ${campo.toLowerCase()}` })
    .trim()
    .min(min, min === 1 ? `Preencha ${campo.toLowerCase()}` : `${campo}: mínimo de ${min} caracteres`)
    .max(max, `${campo}: máximo de ${max} caracteres`);

export const contratoSchema = z.object({
  template: z.enum(idsDeTemplate, {
    errorMap: () => ({ message: 'Escolha um modelo de contrato válido' }),
  }),

  contractorName: texto(3, 120, 'Nome da contratada'),
  contractorDoc: texto(5, 30, 'CPF/CNPJ da contratada'),
  contractorAddress: texto(5, 200, 'Endereço da contratada'),

  clientName: texto(3, 120, 'Nome do contratante'),
  clientDoc: texto(5, 30, 'CPF/CNPJ do contratante'),
  clientAddress: texto(5, 200, 'Endereço do contratante'),

  serviceDescription: texto(10, 2000, 'Descrição do serviço'),

  // Em centavos. O front converte o campo mascarado "R$ 4.500,00" antes de enviar.
  valueCents: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .int('O valor deve ser em centavos, sem casas decimais')
    .positive('O valor precisa ser maior que zero')
    .max(999_999_999_00, 'Valor acima do limite suportado'),

  paymentTerms: texto(3, 300, 'Forma de pagamento'),

  startDate: z
    .string({ required_error: 'Informe a data de início' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início inválida'),

  deadlineDays: z.coerce
    .number({ invalid_type_error: 'Prazo inválido' })
    .int('O prazo deve ser em dias inteiros')
    .positive('O prazo precisa ser maior que zero')
    .max(3650, 'Prazo acima de 10 anos'),

  city: texto(2, 80, 'Cidade do foro'),

  conditions: z.string().trim().max(4000, 'Condições muito longas').optional().default(''),
});

/**
 * Converte o erro do Zod em `{ campo: mensagem }` — formato que o front
 * consome direto para pintar os inputs inválidos.
 */
export function errosPorCampo(erro) {
  const saida = {};
  for (const issue of erro.issues) {
    const campo = issue.path.join('.');
    if (!saida[campo]) saida[campo] = issue.message;
  }
  return saida;
}
