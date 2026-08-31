ALTER TABLE "Pedido"
ADD COLUMN "pontoRecolhimentoId" INTEGER;

CREATE INDEX "Pedido_pontoRecolhimentoId_idx" ON "Pedido"("pontoRecolhimentoId");

ALTER TABLE "Pedido"
ADD CONSTRAINT "Pedido_pontoRecolhimentoId_fkey"
FOREIGN KEY ("pontoRecolhimentoId") REFERENCES "PontoRecolhimento"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
