// ============================================================
//  Schemas de validacao (Zod)
//
//  Definem o contrato de entrada de cada endpoint. Se os dados
//  nao baterem, o Zod lanca erro e o errorHandler responde 422
//  com a lista de campos invalidos.
// ============================================================
const { z } = require("zod");
const {
  Perfil,
  CanalPedido,
  StatusPedido,
  TipoMovimentacaoEstoque,
  valores,
} = require("../domain/enums");

// helper: transforma um objeto-enum num z.enum
const enumDe = (obj) => z.enum(valores(obj));

// converte string de query ("1") em numero inteiro positivo com padrao
const intQuery = (padrao) =>
  z.coerce.number().int().positive().optional().default(padrao);

// ---------- AUTH ----------
const registrarSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres."),
  email: z.string().email("E-mail invalido."),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres."),
  perfil: enumDe(Perfil).optional(),
  consentimentoLGPD: z.boolean().optional(),
});

const loginSchema = z.object({
  email: z.string().email("E-mail invalido."),
  senha: z.string().min(1, "Senha obrigatoria."),
});

// ---------- UNIDADES ----------
const criarUnidadeSchema = z.object({
  nome: z.string().min(2),
  cidade: z.string().min(2),
  estado: z.string().length(2, "Use a sigla do estado (ex.: PE)."),
  endereco: z.string().optional(),
  tipoCozinha: z.enum(["COMPLETA", "REDUZIDA"]).optional(),
});

// ---------- PRODUTOS ----------
const criarProdutoSchema = z.object({
  nome: z.string().min(2),
  descricao: z.string().optional(),
  categoria: z.string().optional(),
  preco: z.number().positive("Preco deve ser maior que zero."),
  sazonal: z.boolean().optional(),
});

const atualizarProdutoSchema = criarProdutoSchema.partial();

// ---------- ESTOQUE ----------
const movimentarEstoqueSchema = z.object({
  unidadeId: z.number().int().positive(),
  produtoId: z.number().int().positive(),
  tipo: enumDe(TipoMovimentacaoEstoque),
  quantidade: z.number().int().positive("Quantidade deve ser positiva."),
  motivo: z.string().optional(),
});

// ---------- PEDIDOS ----------
const criarPedidoSchema = z.object({
  unidadeId: z.number().int().positive("unidadeId obrigatorio."),
  // canalPedido OBRIGATORIO (requisito de multicanalidade)
  canalPedido: enumDe(CanalPedido),
  itens: z
    .array(
      z.object({
        produtoId: z.number().int().positive(),
        quantidade: z.number().int().positive(),
      })
    )
    .min(1, "O pedido deve ter ao menos 1 item."),
  metodoPagamento: z.string().optional(),
});

const listarPedidosSchema = z.object({
  canalPedido: enumDe(CanalPedido).optional(),
  status: enumDe(StatusPedido).optional(),
  page: intQuery(1),
  limit: intQuery(10),
});

const atualizarStatusSchema = z.object({
  status: enumDe(StatusPedido),
});

// ---------- PAGAMENTO ----------
const processarPagamentoSchema = z.object({
  metodo: z.string().optional(),
  // permite forcar o resultado nos testes (APROVADO/RECUSADO)
  forcarStatus: z.enum(["APROVADO", "RECUSADO"]).optional(),
});

// ---------- FIDELIDADE ----------
const resgatarSchema = z.object({
  pontos: z.number().int().positive("Informe a quantidade de pontos a resgatar."),
  descricao: z.string().optional(),
});

module.exports = {
  registrarSchema,
  loginSchema,
  criarUnidadeSchema,
  criarProdutoSchema,
  atualizarProdutoSchema,
  movimentarEstoqueSchema,
  criarPedidoSchema,
  listarPedidosSchema,
  atualizarStatusSchema,
  processarPagamentoSchema,
  resgatarSchema,
};
