-- Anfitrión responsable de recibir la reunión. Es opcional para conservar las reuniones existentes.
ALTER TABLE "reu_reunion"
    ADD COLUMN "reu_id_mie_anfitrion" INTEGER;

ALTER TABLE "reu_reunion"
    ADD CONSTRAINT "fk_reu_id_mie_anfitrion"
    FOREIGN KEY ("reu_id_mie_anfitrion") REFERENCES "mie_miembro"("mie_id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ix_reu_anfitrion" ON "reu_reunion"("reu_id_mie_anfitrion");

COMMENT ON COLUMN "reu_reunion"."reu_id_mie_anfitrion" IS
    'Miembro con rol comunitario HOST que recibe la reunión.';
