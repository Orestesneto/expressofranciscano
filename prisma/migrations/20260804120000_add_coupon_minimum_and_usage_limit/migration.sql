ALTER TABLE "CupomDesconto"
ADD COLUMN "valorMinimo" DECIMAL(65,30),
ADD COLUMN "limiteUsos" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "usosRealizados" INTEGER NOT NULL DEFAULT 0;

UPDATE "CupomDesconto"
SET "usosRealizados" = CASE WHEN "usadoEm" IS NULL THEN 0 ELSE 1 END;

DROP INDEX "Pedido_cupomId_key";

ALTER TABLE "CupomDesconto"
ADD CONSTRAINT "CupomDesconto_limiteUsos_check" CHECK ("limiteUsos" > 0),
ADD CONSTRAINT "CupomDesconto_usosRealizados_check" CHECK ("usosRealizados" >= 0 AND "usosRealizados" <= "limiteUsos"),
ADD CONSTRAINT "CupomDesconto_valorMinimo_check" CHECK ("valorMinimo" IS NULL OR "valorMinimo" > 0);
