UPDATE "Pedido"
SET "codigo" = regexp_replace("codigo", '^ECRI-', 'EJCDAGUIA-')
WHERE "codigo" LIKE 'ECRI-%';
