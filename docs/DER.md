# DER — Diagrama Entidade-Relacionamento

Modelo de dados da API Raízes do Nordeste (banco SQLite via Prisma).

> **Como gerar a imagem para o PDF:** copie o bloco `mermaid` abaixo, cole em
> [https://mermaid.live](https://mermaid.live) e exporte como PNG/SVG.

```mermaid
erDiagram
    USUARIO ||--o{ PEDIDO : "faz"
    USUARIO ||--o| FIDELIDADE : "possui"
    USUARIO ||--o{ LOG_AUDITORIA : "gera"
    UNIDADE ||--o{ USUARIO : "emprega"
    UNIDADE ||--o{ ESTOQUE : "controla"
    UNIDADE ||--o{ PEDIDO : "recebe"
    UNIDADE ||--o{ MOVIMENTACAO_ESTOQUE : "registra"
    PRODUTO ||--o{ ESTOQUE : "tem saldo em"
    PRODUTO ||--o{ ITEM_PEDIDO : "compoe"
    PRODUTO ||--o{ MOVIMENTACAO_ESTOQUE : "movimenta"
    PEDIDO ||--|{ ITEM_PEDIDO : "contem"
    PEDIDO ||--o| PAGAMENTO : "tem (1:1)"
    FIDELIDADE ||--o{ MOVIMENTACAO_FIDELIDADE : "historico"

    USUARIO {
        int id PK
        string nome
        string email UK
        string senhaHash
        string perfil
        int unidadeId FK
        boolean consentimentoLGPD
        datetime consentimentoEm
        boolean ativo
    }
    UNIDADE {
        int id PK
        string nome
        string cidade
        string estado
        string tipoCozinha
        boolean ativo
    }
    PRODUTO {
        int id PK
        string nome
        string categoria
        float preco
        boolean sazonal
        boolean ativo
    }
    ESTOQUE {
        int id PK
        int unidadeId FK
        int produtoId FK
        int quantidade
        boolean disponivel
    }
    MOVIMENTACAO_ESTOQUE {
        int id PK
        int unidadeId FK
        int produtoId FK
        string tipo
        int quantidade
        string motivo
    }
    PEDIDO {
        int id PK
        int clienteId FK
        int unidadeId FK
        string canalPedido
        string status
        float total
        datetime createdAt
    }
    ITEM_PEDIDO {
        int id PK
        int pedidoId FK
        int produtoId FK
        int quantidade
        float precoUnitario
    }
    PAGAMENTO {
        int id PK
        int pedidoId FK "UNIQUE (1:1)"
        string status
        string metodo
        float valor
        string transacaoId
        string gatewayPayload
    }
    FIDELIDADE {
        int id PK
        int clienteId FK "UNIQUE"
        int saldoPontos
    }
    MOVIMENTACAO_FIDELIDADE {
        int id PK
        int fidelidadeId FK
        string tipo
        int pontos
        int pedidoId
    }
    PROMOCAO {
        int id PK
        string nome
        float percentualDesconto
        boolean ativo
    }
    LOG_AUDITORIA {
        int id PK
        int usuarioId FK
        string acao
        string entidade
        string entidadeId
        datetime createdAt
    }
```

## Relacionamentos e cardinalidades

| Relação | Cardinalidade | Regra |
|---------|---------------|-------|
| Usuário → Pedido | 1:N | um cliente faz vários pedidos |
| Unidade → Estoque | 1:N | cada unidade tem estoque próprio |
| Produto ↔ Unidade (via Estoque) | N:N | saldo por unidade; `@@unique(unidadeId, produtoId)` |
| Pedido → ItemPedido | 1:N | um pedido contém vários itens |
| Pedido → Pagamento | 1:1 | pagamento desacoplado (`pedidoId` UNIQUE) |
| Usuário → Fidelidade | 1:1 | carteira só com consentimento LGPD |
| Fidelidade → MovimentacaoFidelidade | 1:N | histórico de pontos |

## Observação técnica (ENUM no SQLite)

O SQLite (via Prisma) **não suporta o tipo ENUM nativo**. Por isso, campos como
`canalPedido`, `status`, `perfil` e `tipo` são modelados como **String** e
validados na camada de aplicação (constantes de domínio em `src/domain/enums.js`
+ validação Zod). Em um banco como PostgreSQL, esses campos seriam ENUMs nativos.
