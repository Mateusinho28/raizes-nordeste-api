// ============================================================
//  Enums de dominio
//
//  Como o SQLite nao suporta ENUM nativo, centralizamos aqui
//  os valores validos. Eles sao usados tanto na validacao
//  (Zod) quanto nas regras de negocio. Assim garantimos
//  integridade mesmo sem o ENUM do banco.
// ============================================================

// Perfis de acesso (controle de autorizacao por papel)
const Perfil = {
  ADMIN: "ADMIN",
  GERENTE: "GERENTE",
  ATENDENTE: "ATENDENTE",
  COZINHA: "COZINHA",
  CLIENTE: "CLIENTE",
};

// Canal de origem do pedido (requisito de multicanalidade)
const CanalPedido = {
  APP: "APP",
  TOTEM: "TOTEM",
  BALCAO: "BALCAO",
  PICKUP: "PICKUP",
  WEB: "WEB",
};

// Ciclo de vida do pedido
const StatusPedido = {
  AGUARDANDO_PAGAMENTO: "AGUARDANDO_PAGAMENTO",
  PAGO: "PAGO",
  EM_PREPARO: "EM_PREPARO",
  PRONTO: "PRONTO",
  ENTREGUE: "ENTREGUE",
  CANCELADO: "CANCELADO",
};

// Transicoes de status permitidas (maquina de estados do pedido).
// Evita pular etapas (ex.: ir de AGUARDANDO_PAGAMENTO direto p/ ENTREGUE).
const TransicoesStatusPedido = {
  AGUARDANDO_PAGAMENTO: ["PAGO", "CANCELADO"],
  PAGO: ["EM_PREPARO", "CANCELADO"],
  EM_PREPARO: ["PRONTO", "CANCELADO"],
  PRONTO: ["ENTREGUE", "CANCELADO"],
  ENTREGUE: [],
  CANCELADO: [],
};

// Resultado do pagamento (gateway externo mock)
const StatusPagamento = {
  PENDENTE: "PENDENTE",
  APROVADO: "APROVADO",
  RECUSADO: "RECUSADO",
};

const TipoMovimentacaoEstoque = {
  ENTRADA: "ENTRADA",
  SAIDA: "SAIDA",
};

const TipoMovimentacaoFidelidade = {
  ACUMULO: "ACUMULO",
  RESGATE: "RESGATE",
};

// helper: devolve a lista de valores de um enum (usado no Zod)
const valores = (obj) => Object.values(obj);

module.exports = {
  Perfil,
  CanalPedido,
  StatusPedido,
  TransicoesStatusPedido,
  StatusPagamento,
  TipoMovimentacaoEstoque,
  TipoMovimentacaoFidelidade,
  valores,
};
