CREATE TABLE "CupomDesconto" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "tipo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "usadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CupomDesconto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CupomProduto" (
    "cupomId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    CONSTRAINT "CupomProduto_pkey" PRIMARY KEY ("cupomId", "produtoId")
);

ALTER TABLE "Pedido" ADD COLUMN "cupomId" INTEGER,
ADD COLUMN "codigoCupom" TEXT,
ADD COLUMN "valorDesconto" DECIMAL(65,30) NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "CupomDesconto_codigo_key" ON "CupomDesconto"("codigo");
CREATE UNIQUE INDEX "Pedido_cupomId_key" ON "Pedido"("cupomId");
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_cupomId_fkey" FOREIGN KEY ("cupomId") REFERENCES "CupomDesconto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CupomProduto" ADD CONSTRAINT "CupomProduto_cupomId_fkey" FOREIGN KEY ("cupomId") REFERENCES "CupomDesconto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CupomProduto" ADD CONSTRAINT "CupomProduto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
