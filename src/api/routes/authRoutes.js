// ============================================================
//  Rotas /auth  (publicas)
// ============================================================
const { Router } = require("express");
const authService = require("../../application/authService");
const auditoria = require("../../infrastructure/auditoria");
const { validar } = require("../middlewares/validate");
const asyncHandler = require("../middlewares/asyncHandler");
const { registrarSchema, loginSchema } = require("../validators");

const router = Router();

// POST /auth/register  -> cadastra usuario
router.post(
  "/register",
  validar(registrarSchema),
  asyncHandler(async (req, res) => {
    const usuario = await authService.registrar(req.body);
    res.status(201).json(usuario);
  })
);

// POST /auth/login  -> autentica e devolve token JWT
router.post(
  "/login",
  validar(loginSchema),
  asyncHandler(async (req, res) => {
    const resultado = await authService.login(req.body);
    await auditoria.registrar({
      usuarioId: resultado.user.id,
      acao: "LOGIN",
      entidade: "Usuario",
      entidadeId: resultado.user.id,
      ip: req.ip,
    });
    res.json(resultado);
  })
);

module.exports = router;
