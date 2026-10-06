-- Fusiona las variantes de líder en el rol comunitario LEADER y las deja inactivas.
-- A quien todavía no tenía LEADER se le convierte una de sus asignaciones (conserva fechas
-- y nota); las demás asignaciones a variantes se eliminan. No basta un UPDATE directo:
-- `uk_mxr_miembro_rol` falla cuando el miembro ya tenía LEADER además de la variante.
DO $$
DECLARE
    lider_id     INTEGER;
    variante_ids INTEGER[];
BEGIN
    SELECT "roc_id" INTO lider_id
    FROM   "roc_rol_comunidad"
    WHERE  "roc_codigo" = 'LEADER';

    IF lider_id IS NULL THEN
        RAISE EXCEPTION 'No existe el rol comunitario LEADER.';
    END IF;

    SELECT COALESCE(array_agg("roc_id"), '{}') INTO variante_ids
    FROM   "roc_rol_comunidad"
    WHERE  "roc_codigo" IN (
               'YOUTH_LEADER',
               'CHILDREN_LEADER',
               'WORSHIP_LEADER',
               'SMALL_GROUP_LEADER',
               'MISSIONS_LEADER',
               'EVANGELISM_LEADER',
               'DISCIPLESHIP_LEADER'
           );

    -- Una asignación por miembro sin LEADER: primero la vigente, luego la más antigua.
    UPDATE "mxr_miembro_rol"
    SET    "mxr_rol" = lider_id,
           "mxr_fecha_modificacion" = CURRENT_TIMESTAMP
    WHERE  "mxr_id" IN (
               SELECT DISTINCT ON (x."mxr_miembro") x."mxr_id"
               FROM   "mxr_miembro_rol" x
               WHERE  x."mxr_rol" = ANY (variante_ids)
                 AND  NOT EXISTS (
                          SELECT 1
                          FROM   "mxr_miembro_rol" l
                          WHERE  l."mxr_miembro" = x."mxr_miembro"
                            AND  l."mxr_rol" = lider_id
                      )
               ORDER  BY x."mxr_miembro",
                         (x."mxr_fecha_fin" IS NULL) DESC,
                         x."mxr_fecha_inicio" NULLS FIRST,
                         x."mxr_id"
           );

    DELETE FROM "mxr_miembro_rol"
    WHERE  "mxr_rol" = ANY (variante_ids);

    UPDATE "roc_rol_comunidad"
    SET    "roc_activo" = FALSE,
           "roc_fecha_modificacion" = CURRENT_TIMESTAMP
    WHERE  "roc_id" = ANY (variante_ids);
END
$$;
