CREATE TABLE "PontoRecolhimento" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "whatsappNormalizado" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "fotoPerfilUrl" TEXT,
    "fotoPerfilPathname" TEXT,
    "fotoPerfilNome" TEXT,
    "fotoPerfilContentType" TEXT,
    "autorizado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PontoRecolhimento_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PontoRecolhimento_whatsappNormalizado_idx" ON "PontoRecolhimento"("whatsappNormalizado");
CREATE INDEX "PontoRecolhimento_bairro_idx" ON "PontoRecolhimento"("bairro");
