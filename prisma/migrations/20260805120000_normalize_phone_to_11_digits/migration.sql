UPDATE "Pedido"
SET
  "telefone" = CASE
    WHEN length(regexp_replace("telefone", '[^0-9]', '', 'g')) = 8
      THEN '839' || regexp_replace("telefone", '[^0-9]', '', 'g')
    WHEN length(regexp_replace("telefone", '[^0-9]', '', 'g')) = 9
      THEN '83' || regexp_replace("telefone", '[^0-9]', '', 'g')
    WHEN length(regexp_replace("telefone", '[^0-9]', '', 'g')) = 10
      THEN substring(regexp_replace("telefone", '[^0-9]', '', 'g') from 1 for 2)
        || '9' || substring(regexp_replace("telefone", '[^0-9]', '', 'g') from 3)
    WHEN length(regexp_replace("telefone", '[^0-9]', '', 'g')) = 12
      AND regexp_replace("telefone", '[^0-9]', '', 'g') LIKE '55%'
      THEN substring(regexp_replace("telefone", '[^0-9]', '', 'g') from 3 for 2)
        || '9' || substring(regexp_replace("telefone", '[^0-9]', '', 'g') from 5)
    WHEN length(regexp_replace("telefone", '[^0-9]', '', 'g')) = 13
      AND regexp_replace("telefone", '[^0-9]', '', 'g') LIKE '55%'
      THEN substring(regexp_replace("telefone", '[^0-9]', '', 'g') from 3)
    WHEN length(regexp_replace("telefone", '[^0-9]', '', 'g')) = 11
      THEN regexp_replace("telefone", '[^0-9]', '', 'g')
    ELSE "telefone"
  END
WHERE "telefone" IS NOT NULL;

UPDATE "Pedido"
SET "telefoneNormalizado" = "telefone"
WHERE "telefone" ~ '^[0-9]{11}$';
