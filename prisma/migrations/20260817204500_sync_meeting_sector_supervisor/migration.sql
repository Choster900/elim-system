-- Align existing meetings with the supervisor assigned to their sector.
-- This is a data-only backfill; no rows are removed and rollback can be restored from a backup.
UPDATE "public"."reu_reunion" AS meeting
SET
    "reu_id_mie_supervisor" = sector."sec_id_mie_supervisor",
    "reu_fecha_modificacion" = CURRENT_TIMESTAMP
FROM "public"."sec_sector" AS sector
WHERE
    meeting."reu_id_sec" = sector."sec_id"
    AND sector."sec_id_mie_supervisor" IS NOT NULL
    AND meeting."reu_id_mie_supervisor" IS DISTINCT FROM sector."sec_id_mie_supervisor";
