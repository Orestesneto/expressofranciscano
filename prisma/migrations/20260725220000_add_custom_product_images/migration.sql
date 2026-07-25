ALTER TABLE "Produto" ADD COLUMN "personalizado" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "PedidoImagem" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PedidoImagem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PedidoImagem_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
