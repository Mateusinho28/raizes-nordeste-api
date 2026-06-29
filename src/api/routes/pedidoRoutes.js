// ============================================================
//  Rotas /pedidos  (fluxo critico)
// ============================================================
const { Router } = require("express");
const pedidoService = require("../../application/pedidoService");
const { autenticar, autorizar } = require("../middlewares/auth");
const { validar } = require("../middlewares/validate");
const asyncHandler = require("../middlewares/asyncHandler");
const { Erros } = require("../../domain/errors");
const { criarPedidoSchema, atualizarStatusSchema } = require("../validators");
const { Perfil } = require("../../domain/enums");

const router = Router();

// POST /pedidos  -> cria pedido (qualquer usuario logado; cliente = o logado)
router.post(
  "/",
  autenticar,
  validar(criarPedidoSchema),
  asyncHandler(async (req, res) => {
    const pedido = await pedidoService.criar(req.usuario.id, req.body, { ip: req.ip });
    res.status(201).json(pedido);
  })
);

// GET /pedidos?canalPedido=&status=&page=&limit=  -> lista com filtros
// Cliente so ve os proprios pedidos; equipe ve todos.
router.get(
  "/",
  autenticar,
  asyncHandler(async (req, res) => {
    const { canalPedido, status } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const filtros = { canalPedido, status, page, limit };
    if (req.usuario.perfil === Perfil.CLIENTE) {
      filtros.clienteId = req.usuario.id;
    }

    res.json(await pedidoService.listar(filtros));
  })
);

// GET /pedidos/:id  -> detalhe (cliente so acessa o proprio)
router.get(
  "/:id",
  autenticar,
  asyncHandler(async (req, res) => {
    const pedido = await pedidoService.buscarPorId(Number(req.params.id));
    if (req.usuario.perfil === Perfil.CLIENTE && pedido.clienteId !== req.usuario.id) {
      throw Erros.semPermissao("Voce so pode acessar os seus proprios pedidos.");
    }
    res.json(pedido);
  })
);

// PATCH /pedidos/:id/status  -> muda status (equipe: nao-cliente)
router.patch(
  "/:id/status",
  autenticar,
  autorizar(Perfil.ADMIN, Perfil.GERENTE, Perfil.ATENDENTE, Perfil.COZINHA),
  validar(atualizarStatusSchema),
  asyncHandler(async (req, res) => {
    const pedido = await pedidoService.atualizarStatus(
      Number(req.params.id),
      req.body.status,
      { usuarioId: req.usuario.id, ip: req.ip }
    );
    res.json(pedido);
  })
);

module.exports = router;
