// ============================================================
//  Documento OpenAPI 3.0 (servido em /docs via Swagger UI)
//
//  Reflete os endpoints REAIS implementados. Inclui o esquema
//  de erro padronizado, autenticacao Bearer (JWT) e exemplos
//  de request/response.
// ============================================================

const erroSchema = {
  type: "object",
  properties: {
    error: { type: "string", example: "NAO_ENCONTRADO" },
    message: { type: "string", example: "Recurso nao encontrado." },
    details: {
      type: "array",
      items: {
        type: "object",
        properties: {
          field: { type: "string" },
          issue: { type: "string" },
        },
      },
    },
    timestamp: { type: "string", format: "date-time" },
    path: { type: "string", example: "/api/pedidos" },
  },
};

const respostaErro = (descricao) => ({
  description: descricao,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } },
});

const openapi = {
  openapi: "3.0.3",
  info: {
    title: "API Raizes do Nordeste",
    version: "1.0.0",
    description:
      "API REST da rede de lanchonetes Raizes do Nordeste. Fluxo critico: Pedido -> Pagamento (mock) -> Atualizacao de status. " +
      "Projeto Multidisciplinar - Trilha Back-End (Uninter).",
  },
  servers: [{ url: "http://localhost:3000", description: "Servidor local" }],
  tags: [
    { name: "Auth", description: "Cadastro e autenticacao" },
    { name: "Usuarios", description: "Dados de usuarios" },
    { name: "Unidades", description: "Unidades da rede e cardapio" },
    { name: "Produtos", description: "Catalogo de produtos" },
    { name: "Estoque", description: "Movimentacao e saldo de estoque" },
    { name: "Pedidos", description: "Fluxo critico de pedidos" },
    { name: "Pagamentos", description: "Integracao mock de pagamento" },
    { name: "Fidelidade", description: "Programa de pontos" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: { Erro: erroSchema },
  },
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Cadastra um novo usuario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                nome: "Maria Cliente",
                email: "maria@exemplo.com",
                senha: "Senha@123",
                perfil: "CLIENTE",
                consentimentoLGPD: true,
              },
            },
          },
        },
        responses: {
          201: { description: "Usuario criado" },
          409: respostaErro("E-mail ja cadastrado"),
          422: respostaErro("Dados invalidos"),
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Autentica e retorna o token JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: { email: "maria@exemplo.com", senha: "Senha@123" },
            },
          },
        },
        responses: {
          200: {
            description: "Autenticado",
            content: {
              "application/json": {
                example: {
                  accessToken: "eyJhbGciOi...",
                  tokenType: "Bearer",
                  user: { id: 1, nome: "Maria Cliente", perfil: "CLIENTE" },
                },
              },
            },
          },
          401: respostaErro("Credenciais invalidas"),
        },
      },
    },
    "/api/usuarios/me": {
      get: {
        tags: ["Usuarios"],
        summary: "Dados do usuario logado",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "OK" }, 401: respostaErro("Sem token") },
      },
    },
    "/api/unidades": {
      get: {
        tags: ["Unidades"],
        summary: "Lista unidades",
        responses: { 200: { description: "OK" } },
      },
      post: {
        tags: ["Unidades"],
        summary: "Cria unidade (ADMIN)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: { nome: "Recife Centro", cidade: "Recife", estado: "PE", tipoCozinha: "COMPLETA" },
            },
          },
        },
        responses: {
          201: { description: "Criada" },
          403: respostaErro("Sem permissao"),
          422: respostaErro("Dados invalidos"),
        },
      },
    },
    "/api/unidades/{id}/cardapio": {
      get: {
        tags: ["Unidades"],
        summary: "Cardapio da unidade",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "OK" }, 404: respostaErro("Unidade nao encontrada") },
      },
    },
    "/api/produtos": {
      get: {
        tags: ["Produtos"],
        summary: "Lista produtos (paginado)",
        parameters: [
          { name: "categoria", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: { 200: { description: "OK" } },
      },
      post: {
        tags: ["Produtos"],
        summary: "Cria produto (ADMIN/GERENTE)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: { nome: "Cuscuz com ovo", categoria: "CAFE", preco: 12.5, sazonal: false },
            },
          },
        },
        responses: {
          201: { description: "Criado" },
          403: respostaErro("Sem permissao"),
          422: respostaErro("Dados invalidos"),
        },
      },
    },
    "/api/estoque/movimentacoes": {
      post: {
        tags: ["Estoque"],
        summary: "Registra entrada/saida de estoque (ADMIN/GERENTE)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: { unidadeId: 1, produtoId: 1, tipo: "ENTRADA", quantidade: 50, motivo: "Reposicao" },
            },
          },
        },
        responses: {
          201: { description: "Movimentado" },
          403: respostaErro("Sem permissao"),
          404: respostaErro("Unidade/produto nao encontrado"),
          409: respostaErro("Estoque insuficiente (saida)"),
        },
      },
    },
    "/api/estoque/unidades/{unidadeId}": {
      get: {
        tags: ["Estoque"],
        summary: "Saldo de estoque por unidade",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "unidadeId", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "OK" }, 404: respostaErro("Unidade nao encontrada") },
      },
    },
    "/api/pedidos": {
      get: {
        tags: ["Pedidos"],
        summary: "Lista pedidos (filtra por canalPedido e status)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "canalPedido", in: "query", schema: { type: "string", enum: ["APP", "TOTEM", "BALCAO", "PICKUP", "WEB"] } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: { 200: { description: "OK" }, 401: respostaErro("Sem token") },
      },
      post: {
        tags: ["Pedidos"],
        summary: "Cria pedido (fluxo critico)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                unidadeId: 1,
                canalPedido: "TOTEM",
                itens: [{ produtoId: 1, quantidade: 2 }],
                metodoPagamento: "MOCK",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Pedido criado",
            content: {
              "application/json": {
                example: {
                  id: 1,
                  status: "AGUARDANDO_PAGAMENTO",
                  canalPedido: "TOTEM",
                  total: 25.0,
                  itens: [{ produtoId: 1, quantidade: 2, precoUnitario: 12.5 }],
                },
              },
            },
          },
          401: respostaErro("Sem token"),
          404: respostaErro("Unidade/produto inexistente"),
          409: respostaErro("Estoque insuficiente"),
          422: respostaErro("Dados invalidos (ex.: canalPedido ausente)"),
        },
      },
    },
    "/api/pedidos/{id}": {
      get: {
        tags: ["Pedidos"],
        summary: "Detalhe do pedido",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "OK" }, 403: respostaErro("Pedido de outro cliente"), 404: respostaErro("Nao encontrado") },
      },
    },
    "/api/pedidos/{id}/status": {
      patch: {
        tags: ["Pedidos"],
        summary: "Atualiza status (equipe)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: { "application/json": { example: { status: "EM_PREPARO" } } },
        },
        responses: {
          200: { description: "Status atualizado" },
          403: respostaErro("Sem permissao"),
          404: respostaErro("Nao encontrado"),
          409: respostaErro("Transicao de status invalida"),
        },
      },
    },
    "/api/pagamentos/pedidos/{pedidoId}": {
      post: {
        tags: ["Pagamentos"],
        summary: "Solicita pagamento (mock) do pedido",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "pedidoId", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          content: {
            "application/json": {
              examples: {
                aprovado: { summary: "Forca aprovacao", value: { metodo: "PIX", forcarStatus: "APROVADO" } },
                recusado: { summary: "Forca recusa", value: { metodo: "PIX", forcarStatus: "RECUSADO" } },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Pagamento processado (aprovado ou recusado)",
            content: {
              "application/json": {
                example: {
                  aprovado: true,
                  pagamento: { status: "APROVADO", transacaoId: "txn_...", valor: 25.0 },
                  pedido: { id: 1, status: "PAGO" },
                },
              },
            },
          },
          404: respostaErro("Pedido nao encontrado"),
          409: respostaErro("Pedido nao esta aguardando pagamento"),
        },
      },
    },
    "/api/fidelidade/saldo": {
      get: {
        tags: ["Fidelidade"],
        summary: "Saldo de pontos do cliente logado",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "OK" }, 404: respostaErro("Sem carteira (sem consentimento)") },
      },
    },
    "/api/fidelidade/resgates": {
      post: {
        tags: ["Fidelidade"],
        summary: "Resgata pontos",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { example: { pontos: 10, descricao: "Desconto" } } },
        },
        responses: {
          201: { description: "Resgatado" },
          409: respostaErro("Saldo insuficiente"),
          422: respostaErro("Dados invalidos"),
        },
      },
    },
  },
};

module.exports = openapi;
