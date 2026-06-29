# DOCUMENTO DO PROJETO — Conteúdo para o PDF (ABNT)

> **COMO USAR ESTE ARQUIVO:**
> 1. Copie o conteúdo para o Word (ou Google Docs).
> 2. Aplique a formatação ABNT (capa, fonte Arial ou Times New Roman 12, espaçamento 1,5, margens 3cm esquerda/superior e 2cm direita/inferior, sumário automático).
> 3. Substitua os campos `[ENTRE COLCHETES]` pelos seus dados.
> 4. **Reescreva com suas palavras** os trechos marcados com 🖊️ (introdução, análise, conclusão) — não entregue o texto cru.
> 5. Insira as imagens dos diagramas (DER e Casos de Uso) onde indicado.
> 6. Mantenha a **Declaração de Uso de IA** no final.
> 7. Exporte como PDF nomeado: `[SEU_RU]_Projeto_Back_End.PDF`

---

## CAPA (modelo)

```
CENTRO UNIVERSITÁRIO INTERNACIONAL UNINTER
CURSO DE [SEU CURSO]

[SEU NOME COMPLETO]

PROJETO MULTIDISCIPLINAR — TRILHA BACK-END
API REST PARA A REDE "RAÍZES DO NORDESTE"

[POLO DE APOIO]
[ANO — 2026]
```

## FOLHA DE ROSTO (modelo)

```
[SEU NOME COMPLETO] — RU [SEU RU]

PROJETO MULTIDISCIPLINAR — TRILHA BACK-END
API REST PARA A REDE "RAÍZES DO NORDESTE"

Trabalho apresentado como requisito parcial à
disciplina de Projeto Multidisciplinar do curso
de [SEU CURSO] do Centro Universitário
Internacional UNINTER.

Prof.ª Me. Luciane Yanase Kanashiro

[POLO] — 2026
```

---

# SUMÁRIO

1. Introdução
2. Análise e Requisitos
3. Modelagem e Arquitetura
4. API e Endpoints
5. LGPD, Privacidade e Segurança
6. Entrega Técnica
7. Plano de Testes
8. Conclusão
9. Referências
10. Declaração de Uso de Ferramentas de IA

---

# 1. INTRODUÇÃO

> 🖊️ *Reescreva esta seção com suas palavras. Abaixo está uma base com os pontos que devem aparecer.*

A rede **Raízes do Nordeste** é uma rede de lanchonetes de culinária nordestina em
franca expansão, presente em diversas capitais e cidades do interior. Nascida de um
pequeno negócio familiar em Recife, cresceu para um modelo de franquia que precisa
conciliar **tradição** (identidade da marca, produtos regionais e sazonais) com
**escala** (múltiplas unidades, múltiplos canais de atendimento e alto volume em
horários de pico).

Este trabalho, na **trilha Back-End**, projeta e implementa uma **API REST** que
sustenta a operação da rede. O foco está nas regras de negócio, na persistência de
dados, na integração com serviços externos e na segurança — e não em telas.

**Objetivos do projeto:**

- Modelar o domínio e a base de dados da rede (unidades, cardápio, estoque, pedidos,
  pagamentos e fidelidade).
- Implementar uma API REST que cubra o **fluxo crítico** de ponta a ponta:
  **Pedido → Pagamento (mock) → Atualização de status**.
- Tratar a **multicanalidade** (App, Totem, Balcão, Pick-up, Web) como dado de domínio.
- Garantir **segurança e conformidade com a LGPD** (autenticação, autorização por
  perfis, hash de senha, consentimento e auditoria).
- Demonstrar a solução de forma **reproduzível** (repositório público, documentação
  Swagger e coleção de testes).

**Principais usuários (atores):** Cliente (App/Web/Totem), Atendente (Balcão), Cozinha,
Gerente/Administrador e o Sistema Externo de Pagamento (gateway).

---

# 2. ANÁLISE E REQUISITOS

> 🖊️ *O texto introdutório pode ser ajustado; as tabelas refletem o que foi de fato implementado.*

A análise priorizou os requisitos com foco em **regras de negócio, persistência,
integrações e segurança**. Adotou-se uma estratégia de **MVP** (Produto Mínimo Viável):
o fluxo crítico foi implementado de ponta a ponta, enquanto requisitos secundários
(ex.: promoções) foram contemplados de forma conceitual/estrutural.

## 2.1 Requisitos Funcionais (RF)

| ID | Requisito | Situação |
|----|-----------|----------|
| RF01 | Cadastro e autenticação de usuários com perfis/roles | Implementado |
| RF02 | Consulta de cardápio por unidade | Implementado |
| RF03 | Cadastro e consulta de produtos (catálogo) | Implementado |
| RF04 | Controle de estoque por unidade (entrada/saída e saldo) | Implementado |
| RF05 | Criação de pedido com itens, valores e status | Implementado |
| RF06 | Registro do canal de origem do pedido (`canalPedido`) | Implementado |
| RF07 | Filtro/consulta de pedidos por canal e status | Implementado |
| RF08 | Atualização do status do pedido (máquina de estados) | Implementado |
| RF09 | Restrição de venda por indisponibilidade de estoque | Implementado |
| RF10 | Solicitação de pagamento via serviço externo (mock) + registro | Implementado |
| RF11 | Programa de fidelização (acúmulo e resgate de pontos) | Implementado |
| RF12 | Consentimento LGPD no cadastro do cliente | Implementado |
| RF13 | Auditoria de ações sensíveis | Implementado |
| RF14 | Promoções/campanhas | Estrutural (tabela `Promocao` + regra documentada) |

## 2.2 Requisitos Não Funcionais (RNF)

| ID | Requisito | Como foi atendido |
|----|-----------|-------------------|
| RNF01 | Segurança: senha com hash | bcrypt (custo 10) |
| RNF02 | Autenticação por token | JWT (Bearer) |
| RNF03 | Autorização por perfil | Middleware por roles |
| RNF04 | Padrão de erro consistente | JSON padronizado em toda a API |
| RNF05 | Documentação da API | OpenAPI/Swagger em `/docs` |
| RNF06 | Logs/auditoria de ações sensíveis | Tabela `logs_auditoria` |
| RNF07 | Tolerância a falhas na integração de pagamento | Gateway desacoplado + tratamento de recusa |
| RNF08 | Consistência modelo ↔ banco | Prisma ORM + migrations |
| RNF09 | Desempenho/escala (conceitual) | Paginação em listagens; índices em `canalPedido` e `status` |

## 2.3 Multicanalidade (requisito de domínio)

Todo pedido registra obrigatoriamente o campo **`canalPedido`** (ENUM lógico:
`APP`, `TOTEM`, `BALCAO`, `PICKUP`, `WEB`). A criação exige o canal e a API permite
filtrar pedidos por canal (ex.: `GET /api/pedidos?canalPedido=TOTEM`), garantindo
rastreabilidade operacional entre canais.

---

# 3. MODELAGEM E ARQUITETURA

## 3.1 Diagrama de Casos de Uso

> 📌 *Insira aqui a imagem do diagrama de casos de uso (desenhe no draw.io a partir da lista abaixo).*

**Atores e casos de uso:**

| Ator | Casos de uso |
|------|--------------|
| Cliente (App/Web/Totem) | Cadastrar-se, Fazer login, Consultar cardápio, Realizar pedido, Acompanhar status, Solicitar pagamento, Consultar fidelidade, Resgatar pontos |
| Atendente (Balcão) | Fazer login, Realizar pedido (balcão), Atualizar status |
| Cozinha | Fazer login, Atualizar status (em preparo → pronto) |
| Gerente/Administrador | Gerir unidades, Gerir produtos, Movimentar estoque, Consultar pedidos, Atualizar status |
| Sistema Externo de Pagamento | Processar pagamento (retornar aprovado/recusado) |

### 3.1.1 Descrição de Feature (Caso de Uso crítico): Realizar Pedido + Solicitar Pagamento

- **Ator principal:** Cliente
- **Atores secundários:** Cozinha (status), Sistema Externo de Pagamento (mock)
- **Pré-condições:** usuário autenticado (JWT); unidade existente e ativa; produtos com
  estoque disponível na unidade.
- **Fluxo principal:**
  1. O cliente seleciona a unidade e os itens e informa o `canalPedido`.
  2. O sistema valida o token e os dados de entrada (Zod).
  3. O sistema verifica, para cada item, a existência do produto e o saldo de estoque
     na unidade.
  4. O sistema calcula o total (congelando o preço unitário no momento da compra),
     cria o pedido com status `AGUARDANDO_PAGAMENTO`, dá baixa no estoque e registra a
     movimentação de saída.
  5. O sistema registra a ação na auditoria e retorna o pedido criado (HTTP 201).
  6. O cliente solicita o pagamento do pedido.
  7. O sistema aciona o gateway externo (mock), que retorna `APROVADO` ou `RECUSADO`.
  8. Se aprovado: o pedido passa a `PAGO` e o cliente acumula pontos de fidelidade.
  9. A cozinha atualiza o status (`EM_PREPARO` → `PRONTO` → `ENTREGUE`).
- **Pós-condições:** pedido persistido com status coerente; pagamento registrado;
  estoque atualizado; pontos creditados (se aprovado).
- **Fluxos de exceção / regras de negócio:**
  - **Estoque insuficiente:** retorna HTTP 409 (`ESTOQUE_INSUFICIENTE`) e nada é gravado
    (transação revertida).
  - **Produto/unidade inexistente:** retorna HTTP 404 (`NAO_ENCONTRADO`).
  - **`canalPedido` ausente/ inválido:** retorna HTTP 422 (`VALIDACAO`).
  - **Pagamento recusado:** o pedido permanece `AGUARDANDO_PAGAMENTO` e a recusa é
    registrada (tolerância a falha de integração).
  - **Transição de status inválida:** retorna HTTP 409 (`TRANSICAO_INVALIDA`) — a
    máquina de estados impede pular etapas.

## 3.2 DER — Diagrama Entidade-Relacionamento

> 📌 *Insira aqui a imagem do DER (gere em https://mermaid.live a partir do arquivo `docs/DER.md`).*

**Entidades principais:** Usuario, Unidade, Produto, Estoque, MovimentacaoEstoque,
Pedido, ItemPedido, Pagamento, Fidelidade, MovimentacaoFidelidade, Promocao,
LogAuditoria.

**Relacionamentos e cardinalidades:**

| Relação | Cardinalidade | Regra |
|---------|---------------|-------|
| Usuário → Pedido | 1:N | um cliente faz vários pedidos |
| Unidade → Estoque | 1:N | cada unidade tem estoque próprio |
| Produto ↔ Unidade (via Estoque) | N:N | saldo por unidade (`@@unique(unidadeId, produtoId)`) |
| Pedido → ItemPedido | 1:N | um pedido contém vários itens |
| Pedido → Pagamento | 1:1 | pagamento desacoplado (`pedidoId` único) |
| Usuário → Fidelidade | 1:1 | carteira só com consentimento LGPD |
| Fidelidade → MovimentacaoFidelidade | 1:N | histórico de pontos |

**Observação técnica (ENUM no SQLite):** o SQLite, via Prisma, não suporta o tipo ENUM
nativo. Por isso, campos como `canalPedido`, `status` e `perfil` foram modelados como
`String` e validados na camada de aplicação (constantes de domínio + Zod). Em um SGBD
como o PostgreSQL, esses campos seriam ENUMs nativos.

## 3.3 Diagrama de Classes (visão de domínio)

> 📌 *Opcional como imagem; pode gerar o classDiagram abaixo no mermaid.live.*

As classes do domínio espelham as entidades do DER. As principais responsabilidades:

- **Pedido** — agrega `ItemPedido`, conhece seu `canalPedido`, `status` e `total`;
  comporta a regra de transição de status.
- **Pagamento** — desacoplado do `Pedido` (1:1); guarda o retorno do gateway.
- **Estoque** — saldo de um `Produto` em uma `Unidade`; valida disponibilidade.
- **Fidelidade** — saldo de pontos do cliente; registra acúmulos e resgates.

## 3.4 Arquitetura (camadas)

A solução adota separação em camadas, deixando explícita a separação de
responsabilidades:

```
src/
├── domain/          # entidades, enums, regras puras, padrão de erro
├── application/     # services (casos de uso): criar pedido, pagar, etc.
├── infrastructure/  # Prisma, gateway de pagamento (mock), auditoria
└── api/             # rotas, middlewares (auth, validação, erro), Swagger
```

- **Domain** — o que é regra de negócio pura (valores válidos, padrão de erro).
- **Application** — orquestra os casos de uso (ex.: `pedidoService`, `pagamentoService`).
- **Infrastructure** — detalhes técnicos: acesso ao banco (Prisma), integração de
  pagamento (mock) e auditoria.
- **API** — interface HTTP: rotas, autenticação JWT, autorização por perfil, validação
  (Zod) e documentação (Swagger).

**Stack:** Node.js, Express, Prisma ORM, SQLite, JWT, bcrypt, Zod, Swagger.

---

# 4. API E ENDPOINTS

Todas as rotas seguem o prefixo `/api`. URLs no plural, IDs no path, paginação em
listagens e **padrão de erro único** em todas as falhas.

## 4.1 Padrão de erro (todas as falhas)

```json
{
  "error": "ESTOQUE_INSUFICIENTE",
  "message": "Nao ha quantidade suficiente para um ou mais itens.",
  "details": [{ "field": "itens[0].quantidade", "issue": "Disponivel: 1" }],
  "timestamp": "2026-06-29T12:00:00.000Z",
  "path": "/api/pedidos"
}
```

## 4.2 Resumo dos endpoints

| Método | Rota | Auth / Perfil | Descrição |
|--------|------|---------------|-----------|
| POST | `/api/auth/register` | público | Cadastra usuário |
| POST | `/api/auth/login` | público | Login → JWT |
| GET | `/api/usuarios/me` | JWT | Dados do usuário logado |
| GET | `/api/usuarios` | ADMIN/GERENTE | Lista usuários |
| GET | `/api/unidades` | público | Lista unidades |
| GET | `/api/unidades/{id}/cardapio` | público | Cardápio da unidade |
| POST | `/api/unidades` | ADMIN | Cria unidade |
| GET | `/api/produtos` | público | Lista produtos (paginado) |
| POST | `/api/produtos` | ADMIN/GERENTE | Cria produto |
| PUT | `/api/produtos/{id}` | ADMIN/GERENTE | Atualiza produto |
| POST | `/api/estoque/movimentacoes` | ADMIN/GERENTE | Entrada/saída de estoque |
| GET | `/api/estoque/unidades/{id}` | JWT | Saldo por unidade |
| POST | `/api/pedidos` | JWT | Cria pedido (fluxo crítico) |
| GET | `/api/pedidos?canalPedido=&status=` | JWT | Lista/filtra pedidos |
| GET | `/api/pedidos/{id}` | JWT | Detalhe do pedido |
| PATCH | `/api/pedidos/{id}/status` | equipe | Atualiza status |
| POST | `/api/pagamentos/pedidos/{id}` | JWT | Pagamento (mock) |
| GET | `/api/fidelidade/saldo` | JWT | Saldo de pontos |
| GET | `/api/fidelidade/historico` | JWT | Histórico de pontos |
| POST | `/api/fidelidade/resgates` | JWT | Resgata pontos |

## 4.3 Exemplo — Criar pedido (POST /api/pedidos)

**Request:**
```json
{
  "unidadeId": 1,
  "canalPedido": "TOTEM",
  "itens": [
    { "produtoId": 1, "quantidade": 2 },
    { "produtoId": 4, "quantidade": 1 }
  ],
  "metodoPagamento": "MOCK"
}
```

**Response 201:**
```json
{
  "id": 1,
  "status": "AGUARDANDO_PAGAMENTO",
  "canalPedido": "TOTEM",
  "total": 31.0,
  "itens": [
    { "produtoId": 1, "quantidade": 2, "precoUnitario": 12.5 },
    { "produtoId": 4, "quantidade": 1, "precoUnitario": 6.0 }
  ]
}
```

**Status codes:** 201 (criado), 401 (sem token), 404 (unidade/produto inexistente),
409 (estoque insuficiente), 422 (validação).

## 4.4 Exemplo — Pagamento mock (POST /api/pagamentos/pedidos/{id})

**Request:** `{ "metodo": "PIX", "forcarStatus": "APROVADO" }`

**Response 200 (aprovado):**
```json
{
  "aprovado": true,
  "pagamento": { "status": "APROVADO", "transacaoId": "txn_...", "valor": 31.0 },
  "pedido": { "id": 1, "status": "PAGO" }
}
```

> 💡 A documentação interativa completa (todos os endpoints, exemplos e códigos de
> status) está disponível no **Swagger** em `http://localhost:3000/docs`.
> *Sugestão: inclua aqui um print da tela do Swagger.*

---

# 5. LGPD, PRIVACIDADE E SEGURANÇA

> 🖊️ *Pode enxugar/expandir conforme seu entendimento.*

| Aspecto | Implementação |
|---------|---------------|
| **Dados pessoais coletados** | nome, e-mail (identificação e login) |
| **Finalidade** | autenticação, vínculo de pedidos e programa de fidelidade |
| **Base legal** | consentimento (campo `consentimentoLGPD` + data registrada) |
| **Minimização** | coleta-se apenas o necessário; sem dados sensíveis |
| **Armazenamento seguro** | senha com hash bcrypt; `senhaHash` nunca retornado nas respostas |
| **Controle de acesso** | autenticação JWT + autorização por perfil em cada endpoint |
| **Auditoria** | ações sensíveis (login, criação/cancelamento/mudança de status de pedido, pagamento, movimentação de estoque) gravadas em `logs_auditoria` com usuário, ação, entidade e data |
| **Fidelidade condicionada ao consentimento** | a carteira de pontos só é criada se o cliente consentir |

---

# 6. ENTREGA TÉCNICA

- **Repositório (público):** https://github.com/Mateusinho28/raizes-nordeste-api
- **Documentação Swagger:** `http://localhost:3000/docs` (com a API em execução)
- **Coleção Postman:** `postman/Raizes-do-Nordeste.postman_collection.json` (no repositório)

**Como executar (resumo):**
```bash
npm install
cp .env.example .env
npx prisma migrate dev      # cria o banco + roda o seed
npm run dev                 # inicia a API em http://localhost:3000
```

Usuários de teste (senha `Senha@123`): `admin@raizes.com`, `gerente@raizes.com`,
`cozinha@raizes.com`, `cliente@raizes.com`.

---

# 7. PLANO DE TESTES

A validação foi feita com a **coleção Postman** (`postman/`), que reproduz os cenários
abaixo. São **14 cenários** (8 positivos + 6 negativos), cobrindo autenticação,
autorização, validação, regras de negócio, pagamento mock e padrão de erro.

| ID | Cenário | Endpoint | Pré-condição | Entrada | Esperado |
|----|---------|----------|--------------|---------|----------|
| T01 | Login admin válido | POST /api/auth/login | seed aplicado | email+senha | 200 + accessToken |
| T02 | Login cliente válido | POST /api/auth/login | seed aplicado | email+senha | 200 + perfil CLIENTE |
| T03 | Login senha errada | POST /api/auth/login | usuário existe | senha incorreta | 401 + CREDENCIAIS_INVALIDAS |
| T04 | Listar unidades | GET /api/unidades | — | — | 200 + lista |
| T05 | Cardápio da unidade | GET /api/unidades/1/cardapio | seed | path id=1 | 200 + itens |
| T06 | Criar pedido válido | POST /api/pedidos | cliente logado | unidade+itens+canal | 201 + AGUARDANDO_PAGAMENTO |
| T07 | Pagamento aprovado | POST /api/pagamentos/pedidos/{id} | pedido criado | forcarStatus=APROVADO | 200 + pedido PAGO |
| T08 | Atualizar status | PATCH /api/pedidos/{id}/status | pedido PAGO; admin logado | status=EM_PREPARO | 200 + EM_PREPARO |
| T09 | Saldo de fidelidade | GET /api/fidelidade/saldo | cliente pagou pedido | token | 200 + pontos > 0 |
| T10 | Acesso sem token | GET /api/pedidos | — | sem Authorization | 401 + NAO_AUTENTICADO |
| T11 | Pedido sem canalPedido | POST /api/pedidos | cliente logado | body sem canalPedido | 422 + VALIDACAO |
| T12 | Estoque insuficiente | POST /api/pedidos | cliente logado | quantidade 99999 | 409 + ESTOQUE_INSUFICIENTE |
| T13 | Cliente cria unidade | POST /api/unidades | cliente logado | body unidade | 403 + SEM_PERMISSAO |
| T14 | Pagar pedido inexistente | POST /api/pagamentos/pedidos/999999 | cliente logado | id inexistente | 404 + NAO_ENCONTRADO |
| Extra | Pagamento recusado | POST /api/pagamentos/pedidos/{id} | novo pedido | forcarStatus=RECUSADO | 200 + aprovado=false; pedido segue AGUARDANDO_PAGAMENTO |

> ✅ Todos os 15 cenários foram executados com sucesso (8 positivos + 6 negativos + 1 extra).
> *Sugestão: inclua um print do Postman/Collection Runner com os testes passando.*

**Logs/Auditoria:** implementado — cada criação de pedido, mudança de status e
pagamento gera registro em `logs_auditoria` (evidência do requisito de rastreabilidade).

---

# 8. CONCLUSÃO

> 🖊️ *Reescreva com suas palavras. Pontos a abordar:*

- O que foi implementado (fluxo crítico completo, autenticação, estoque, fidelidade,
  auditoria) versus o que ficou conceitual (promoções).
- Como DER, casos de uso e classes se conectam aos endpoints e ao fluxo crítico.
- Como o pagamento mock foi tratado (desacoplado, com sucesso e recusa) e quais
  validações/erros foram padronizados.
- Principais cuidados de segurança/LGPD adotados.
- Como os testes (coleção Postman) evidenciam o funcionamento.
- Reflexão final: a solução se sustentaria em um ambiente real/entrevista técnica?

---

# 9. REFERÊNCIAS

> 🖊️ *Ajuste conforme as fontes que você consultou. Exemplos no formato ABNT:*

- BRASIL. **Lei nº 13.709, de 14 de agosto de 2018**. Lei Geral de Proteção de Dados
  Pessoais (LGPD). Brasília, 2018.
- FIELDING, R. T. **Architectural Styles and the Design of Network-based Software
  Architectures**. Tese (Doutorado) — University of California, Irvine, 2000.
- PRISMA. **Prisma ORM Documentation**. Disponível em: https://www.prisma.io/docs. Acesso em: jun. 2026.
- EXPRESS. **Express.js Documentation**. Disponível em: https://expressjs.com. Acesso em: jun. 2026.
- OPENAPI INITIATIVE. **OpenAPI Specification**. Disponível em: https://spec.openapis.org. Acesso em: jun. 2026.

---

# 10. DECLARAÇÃO DE USO DE FERRAMENTAS DE IA

> 🖊️ *Ajuste com sinceridade ao que você fez. Modelo:*

Declaro, para fins de transparência, que utilizei ferramenta de inteligência artificial
(assistente de programação) como **apoio** no desenvolvimento deste trabalho, nas
seguintes etapas:

- Apoio na estruturação do projeto e na organização do código em camadas;
- Apoio na escrita e revisão de trechos de código e da documentação técnica;
- Explicação de conceitos e boas práticas (REST, JWT, ORM, validação).

Todo o conteúdo foi **revisado, compreendido e adaptado** por mim, e o projeto reflete
meu entendimento das regras de negócio e das decisões técnicas adotadas. As partes de
texto deste documento foram redigidas/ajustadas por mim com base nesse aprendizado.

**Ferramenta utilizada:** [informe a ferramenta].
