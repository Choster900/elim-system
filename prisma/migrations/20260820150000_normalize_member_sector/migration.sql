-- A member belongs to one sector. District and zone are derived through
-- sec_sector -> zon_zona -> dis_distrito and must not be duplicated on the member row.
WITH "legacy_sector_matches" AS (
    SELECT
        "member"."mie_id",
        MIN("sector"."sec_id") AS "sector_id",
        COUNT(*) AS "match_count"
    FROM "mie_miembro" AS "member"
    INNER JOIN "sec_sector" AS "sector"
        ON LOWER(TRIM("member"."mie_sector")) IN (
            LOWER(TRIM("sector"."sec_codigo")),
            LOWER(TRIM("sector"."sec_nombre"))
        )
    INNER JOIN "zon_zona" AS "zone"
        ON "zone"."zon_id" = "sector"."sec_id_zon"
    INNER JOIN "dis_distrito" AS "district"
        ON "district"."dis_id" = "zone"."zon_id_dis"
    WHERE "member"."mie_id_sec" IS NULL
      AND NULLIF(TRIM("member"."mie_sector"), '') IS NOT NULL
      AND (
          NULLIF(TRIM("member"."mie_zona"), '') IS NULL
          OR LOWER(TRIM("member"."mie_zona")) IN (
              LOWER(TRIM("zone"."zon_codigo")),
              LOWER(TRIM("zone"."zon_nombre"))
          )
      )
      AND (
          NULLIF(TRIM("member"."mie_distrito"), '') IS NULL
          OR LOWER(TRIM("member"."mie_distrito")) IN (
              LOWER(TRIM("district"."dis_codigo")),
              LOWER(TRIM("district"."dis_nombre"))
          )
      )
    GROUP BY "member"."mie_id"
)
UPDATE "mie_miembro" AS "member"
SET "mie_id_sec" = "matches"."sector_id"
FROM "legacy_sector_matches" AS "matches"
WHERE "member"."mie_id" = "matches"."mie_id"
  AND "matches"."match_count" = 1;

-- Stop instead of discarding legacy territory data that could not be mapped safely.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "mie_miembro"
        WHERE "mie_id_sec" IS NULL
          AND (
              NULLIF(TRIM("mie_distrito"), '') IS NOT NULL
              OR NULLIF(TRIM("mie_zona"), '') IS NOT NULL
              OR NULLIF(TRIM("mie_sector"), '') IS NOT NULL
          )
    ) THEN
        RAISE EXCEPTION 'Some members have legacy territory values that cannot be mapped to one sector';
    END IF;
END $$;

DROP INDEX IF EXISTS "ix_mie_territorio";

ALTER TABLE "mie_miembro"
    DROP COLUMN "mie_distrito",
    DROP COLUMN "mie_zona",
    DROP COLUMN "mie_sector";

COMMENT ON COLUMN "mie_miembro"."mie_id_sec" IS
    'Sector assigned to the member; zone and district are derived through the sector hierarchy.';
