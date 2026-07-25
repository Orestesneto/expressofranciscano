ALTER TABLE "Pedido" ADD COLUMN "telefoneNormalizado" TEXT;

UPDATE "Pedido"
SET "telefoneNormalizado" = regexp_replace("telefone", '[^0-9]', '', 'g')
WHERE "telefone" IS NOT NULL;

CREATE INDEX "Pedido_telefoneNormalizado_idx" ON "Pedido"("telefoneNormalizado");
