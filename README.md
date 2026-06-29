# API Raízes do Nordeste 🌵

API REST para a rede de lanchonetes nordestinas **Raízes do Nordeste**, desenvolvida como Projeto Multidisciplinar — Trilha Back-End (Uninter).

A solução cobre o **fluxo crítico** de ponta a ponta:

> **Pedido → Pagamento (mock) → Atualização de status**

com autenticação JWT, autorização por perfis, controle de estoque por unidade, programa de fidelidade, multicanalidade (`canalPedido`) e auditoria de ações sensíveis (LGPD).

---

## 🧰 Requisitos

| Item | Versão |
|------|--------|
| Node.js | 18+ (testado em 24.17.0) |
| npm | 9+ |
| Banco de dados | SQLite (arquivo local — não precisa instalar servidor) |
| ORM | Prisma 6 |

---

## 🚀 Como rodar (passo a passo)

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Copie o arquivo de exemplo e ajuste se quiser:
```bash
cp .env.example .env
```
Conteúdo do `.env`:
```
DATABASE_URL="file:./dev.db"
PORT=3000
JWT_SECRET="troque-por-um-valor-aleatorio"
JWT_EXPIRES_IN="8h"
```

### 3. Criar o banco e aplicar as migrations
```bash
npx prisma migrate dev --name init
```

### 4. Popular o banco com dados de exemplo (seed)
```bash
npm run seed
```

### 5. Iniciar a API
```bash
npm run dev      # modo desenvolvimento (reinicia ao salvar)
# ou
npm start        # modo normal
```

A API sobe em **http://localhost:3000**.

---

## 📚 Documentação (Swagger / OpenAPI)

Com a API rodando, acesse:

> **http://localhost:3000/docs**

A documentação reflete os endpoints reais, com exemplos de request/response, códigos de status e o padrão de erro. Para testar endpoints protegidos no Swagger, clique em **Authorize** e cole o token retornado no login (`Bearer <token>`).

---

## 🧪 Como rodar os testes (coleção Postman)

A coleção está em `postman/Raizes-do-Nordeste.postman_collection.json`.

1. Importe o arquivo no Postman (ou Insomnia).
2. Garanta que a API está rodando e que o **seed** foi executado.
3. Rode a coleção **na ordem** (de cima para baixo) usando o **Collection Runner** — o login guarda os tokens automaticamente e o fluxo cria/paga/atualiza um pedido.

A coleção tem **14 cenários** (8 positivos + 6 negativos), incluindo 401, 403, 404, 409 e 422. O plano de testes detalhado está no documento PDF do projeto.

---

## 👤 Usuários de exemplo (criados pelo seed)

Senha de todos: **`Senha@123`**

| E-mail | Perfil | Uso |
|--------|--------|-----|
| `admin@raizes.com` | ADMIN | acesso total |
| `gerente@raizes.com` | GERENTE | gestão da unidade Recife |
| `cozinha@raizes.com` | COZINHA | muda status de pedidos |
| `cliente@raizes.com` | CLIENTE | faz pedidos, tem fidelidade |

---

## 🔌 Principais endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/register` | público | Cadastra usuário |
| POST | `/api/auth/login` | público | Login (retorna JWT) |
| GET | `/api/usuarios/me` | JWT | Dados do usuário logado |
| GET | `/api/unidades` | público | Lista unidades |
| GET | `/api/unidades/:id/cardapio` | público | Cardápio da unidade |
| GET/POST | `/api/produtos` | público / ADMIN-GERENTE | Catálogo |
| POST | `/api/estoque/movimentacoes` | ADMIN-GERENTE | Entrada/saída de estoque |
| GET | `/api/estoque/unidades/:id` | JWT | Saldo por unidade |
| POST | `/api/pedidos` | JWT | **Cria pedido** (exige `canalPedido`) |
| GET | `/api/pedidos?canalPedido=&status=` | JWT | Lista/filtra pedidos |
| PATCH | `/api/pedidos/:id/status` | equipe | Atualiza status |
| POST | `/api/pagamentos/pedidos/:id` | JWT | **Pagamento mock** |
| GET | `/api/fidelidade/saldo` | JWT | Saldo de pontos |
| POST | `/api/fidelidade/resgates` | JWT | Resgata pontos |

---

## 🏛️ Arquitetura (separação de responsabilidades)

```
src/
├── domain/          # entidades, enums, regras puras, padrão de erro
├── application/     # services (casos de uso): criar pedido, pagar, etc.
├── infrastructure/  # Prisma, gateway de pagamento (mock), auditoria
└── api/             # rotas, middlewares (auth, validação, erro), Swagger
```

- **Domain** — `enums.js` (valores válidos), `errors.js` (padrão de erro).
- **Application** — regras de negócio (`pedidoService`, `pagamentoService`, ...).
- **Infrastructure** — detalhes técnicos: `prisma.js`, `gatewayPagamento.js` (mock), `auditoria.js`.
- **API** — Express: rotas, autenticação JWT, autorização por perfil, validação Zod, Swagger.

---

## 🔐 Segurança e LGPD

- **Senhas** armazenadas com hash **bcrypt** (nunca em texto puro).
- **Autenticação** via JWT; **autorização** por perfil (ADMIN/GERENTE/ATENDENTE/COZINHA/CLIENTE).
- Respostas **nunca** expõem o campo `senhaHash`.
- **Consentimento LGPD** registrado no cadastro do cliente (campo + data); a carteira de fidelidade só é criada com consentimento.
- **Auditoria**: ações sensíveis (login, criação/cancelamento de pedido, mudança de status, pagamento, movimentação de estoque) são gravadas na tabela `logs_auditoria`.

---

## 💳 Pagamento (mock)

O sistema **não processa pagamento real**. O módulo `gatewayPagamento.js` simula um provedor externo: recebe a solicitação, devolve **APROVADO** ou **RECUSADO** e um payload no estilo de um gateway real. É possível forçar o resultado nos testes com o campo `forcarStatus` (`APROVADO` / `RECUSADO`).

- Pagamento **aprovado** → pedido vira `PAGO` e o cliente acumula pontos de fidelidade.
- Pagamento **recusado** → pedido permanece `AGUARDANDO_PAGAMENTO` e a recusa é registrada.

---

## 📦 Scripts disponíveis

| Script | O que faz |
|--------|-----------|
| `npm run dev` | Inicia em modo desenvolvimento (nodemon) |
| `npm start` | Inicia a API |
| `npm run prisma:migrate` | Cria/aplica migrations |
| `npm run seed` | Popula o banco com dados de exemplo |
| `npm run db:reset` | Reseta o banco e recria do zero |

---

## 📄 Evidências para correção

- **Repositório:** _(inserir link público do GitHub aqui)_
- **Swagger:** `http://localhost:3000/docs` (com a API rodando)
- **Coleção Postman:** `postman/Raizes-do-Nordeste.postman_collection.json`
