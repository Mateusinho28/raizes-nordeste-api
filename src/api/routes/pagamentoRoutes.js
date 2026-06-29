// ============================================================
//  Rotas /pagamentos  (integracao mock - desacoplada do pedido)
// ============================================================
const { Router } = require("express");
const pagamentoService = require("../../application/pagamentoService");
const { autenticar } = require("../middlewares/auth");
const { validar } = require("../middlewares/validate");
const asyncHandler = require("../middlewares/asyncHandler");
const { processarPagamentoSchema } = require("../validators");

const router = Router();

// POST /pagamentos/pedidos/:pedidoId  -> solicita pagamento do pedido
// Body: { metodo?, forcarStatus? }  (forcarStatus serve para os testes)
router.post(
  "/pedidos/:pedidoId",
  autenticar,
  validar(processarPagamentoSchema),
  asyncHandler(async (req, res) => {
    const resultado = await pagamentoService.processar(
      Number(req.params.pedidoId),
      req.body,
      { usuarioId: req.usuario.id, ip: req.ip }
    );

    // 200: a operacao foi processada (mesmo que o pagamento tenha sido recusado).
    // O campo "aprovado" e o status do pagamento indicam o resultado.
    res.status(200).json(resultado);
  })
);

module.exports = router;
