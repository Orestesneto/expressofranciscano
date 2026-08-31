ALTER TABLE "Pedido"
ADD COLUMN "anonimo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "fotoPerfilUrl" TEXT,
ADD COLUMN "fotoPerfilPathname" TEXT,
ADD COLUMN "fotoPerfilNome" TEXT,
ADD COLUMN "fotoPerfilContentType" TEXT;
