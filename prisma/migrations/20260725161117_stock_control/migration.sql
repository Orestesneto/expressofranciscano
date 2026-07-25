-- CreateTable
CREATE TABLE "Administrador" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Equipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoriaId" INTEGER,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "imagemUrl" TEXT,
    "preco" DECIMAL NOT NULL,
    "estoque" INTEGER NOT NULL DEFAULT 0,
    "estoqueMinimo" INTEGER NOT NULL DEFAULT 0,
    "disponivelVenda" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "limitePorPedido" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Produto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProdutoVariacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "produtoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "estoque" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProdutoVariacao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nomeCliente" TEXT NOT NULL,
    "sobrenomeCliente" TEXT NOT NULL,
    "telefone" TEXT,
    "equipeId" INTEGER,
    "valorTotal" DECIMAL NOT NULL,
    "statusPagamento" TEXT NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    "statusProducao" TEXT NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    "observacaoCliente" TEXT,
    "observacaoAdministrador" TEXT,
    "mercadoPagoPaymentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" DATETIME,
    "deliveredAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pedido_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PedidoItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pedidoId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "variacaoId" INTEGER,
    "nomeProduto" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valorUnitario" DECIMAL NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    CONSTRAINT "PedidoItem_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PedidoItem_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PedidoItem_variacaoId_fkey" FOREIGN KEY ("variacaoId") REFERENCES "ProdutoVariacao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pedidoId" INTEGER NOT NULL,
    "provedor" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "qrCode" TEXT,
    "qrCodeBase64" TEXT,
    "pixCopiaCola" TEXT,
    "dataExpiracao" DATETIME,
    "dadosRetorno" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pagamento_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoricoPedido" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pedidoId" INTEGER NOT NULL,
    "administradorId" INTEGER NOT NULL,
    "statusAnterior" TEXT NOT NULL,
    "statusNovo" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistoricoPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HistoricoPedido_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "Administrador" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MovimentacaoEstoque" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "produtoId" INTEGER NOT NULL,
    "pedidoId" INTEGER,
    "administradorId" INTEGER,
    "pagamentoId" INTEGER,
    "tipo" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "estoqueAnterior" INTEGER NOT NULL,
    "estoqueNovo" INTEGER NOT NULL,
    "motivo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MovimentacaoEstoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MovimentacaoEstoque_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MovimentacaoEstoque_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "Administrador" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MovimentacaoEstoque_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "Pagamento" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Administrador_email_key" ON "Administrador"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Equipe_nome_key" ON "Equipe"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_codigo_key" ON "Pedido"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Pagamento_pedidoId_key" ON "Pagamento"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "MovimentacaoEstoque_pagamentoId_key" ON "MovimentacaoEstoque"("pagamentoId");
