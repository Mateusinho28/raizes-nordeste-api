// ============================================================
//  Rotas /usuarios  (protegidas)
// ============================================================
const { Router } = require("express");
const prisma = require("../../infrastructure/prisma");
const { sanitizar } = require("../../application/authService");
const { autenticar, autorizar } = require("../middlewares/auth");
const asyncHandler = require("../middlewares/asyncHandler");
const { Erros } = require("../../domain/errors");
const { Perfil } = require("../../domain/enums");

const router = Router();

// GET /usuarios/me  -> dados do proprio usuario logado
router.get(
  "/me",
  autenticar,
  asyncHandler(async (req, res) => {
    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
    if (!usuario) throw Erros.naoEncontrado("Usuario nao encontrado.");
    res.json(sanitizar(usuario));
  })
);

// GET /usuarios  -> lista usuarios (somente ADMIN/GERENTE)
router.get(
  "/",
  autenticar,
  autorizar(Perfil.ADMIN, Perfil.GERENTE),
  asyncHandler(async (req, res) => {
    const usuarios = await prisma.usuario.findMany({ orderBy: { nome: "asc" } });
    res.json(usuarios.map(sanitizar));
  })
);

module.exports = router;
