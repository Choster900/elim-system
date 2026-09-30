-- Dirección general opcional para cada nivel de la jerarquía territorial.
ALTER TABLE "dis_distrito"
    ADD COLUMN "dis_direccion" VARCHAR(300);

ALTER TABLE "zon_zona"
    ADD COLUMN "zon_direccion" VARCHAR(300);

ALTER TABLE "sec_sector"
    ADD COLUMN "sec_direccion" VARCHAR(300);

COMMENT ON COLUMN "dis_distrito"."dis_direccion" IS
    'Dirección general o referencia del distrito.';

COMMENT ON COLUMN "zon_zona"."zon_direccion" IS
    'Dirección general o referencia de la zona.';

COMMENT ON COLUMN "sec_sector"."sec_direccion" IS
    'Dirección general o referencia del sector.';
