-- Catálogos activos utilizados por el formulario y la plantilla de importación de miembros.
INSERT INTO "roc_rol_comunidad"
            ("roc_codigo", "roc_nombre", "roc_descripcion", "roc_activo", "roc_sistema", "roc_fecha_modificacion")
VALUES      ('MEMBER', 'Miembro', 'Persona que forma parte de la comunidad.', TRUE, TRUE, CURRENT_TIMESTAMP),
            ('PASTOR', 'Pastor', 'Responsable pastoral de la comunidad.', TRUE, TRUE, CURRENT_TIMESTAMP),
            ('LEADER', 'Líder', 'Miembro autorizado para conducir reuniones.', TRUE, TRUE, CURRENT_TIMESTAMP),
            ('HOST', 'Anfitrión', 'Miembro que recibe reuniones en su hogar o local.', TRUE, TRUE, CURRENT_TIMESTAMP),
            ('SUPERVISOR', 'Supervisor', 'Miembro responsable de supervisar todas las reuniones de un sector.', TRUE, TRUE, CURRENT_TIMESTAMP),
            ('DEACON', 'Diácono', 'Miembro que sirve en funciones de diaconado.', TRUE, TRUE, CURRENT_TIMESTAMP),
            ('VOLUNTEER', 'Voluntario', 'Miembro que apoya actividades de servicio.', TRUE, TRUE, CURRENT_TIMESTAMP),
            ('TEACHER', 'Maestro', 'Miembro responsable de enseñanza.', TRUE, TRUE, CURRENT_TIMESTAMP),
            ('WORSHIP', 'Alabanza', 'Miembro que sirve en el equipo de alabanza.', TRUE, TRUE, CURRENT_TIMESTAMP),
            ('YOUTH_LEADER', 'Líder de jóvenes', 'Responsable del acompañamiento juvenil.', TRUE, TRUE, CURRENT_TIMESTAMP),
            ('CHILDREN_LEADER', 'Líder infantil', 'Responsable del ministerio infantil.', TRUE, TRUE, CURRENT_TIMESTAMP)
ON CONFLICT ("roc_codigo")
DO UPDATE
SET         "roc_nombre" = EXCLUDED."roc_nombre",
            "roc_descripcion" = EXCLUDED."roc_descripcion",
            "roc_activo" = TRUE,
            "roc_sistema" = TRUE,
            "roc_fecha_modificacion" = CURRENT_TIMESTAMP;

INSERT INTO "min_ministerio"
            ("min_codigo", "min_nombre", "min_descripcion", "min_activo", "min_fecha_modificacion")
VALUES      ('ALABANZA', 'Alabanza', 'Ministerio de alabanza.', TRUE, CURRENT_TIMESTAMP),
            ('JOVENES', 'Jóvenes', 'Ministerio de jóvenes.', TRUE, CURRENT_TIMESTAMP),
            ('NINEZ', 'Niñez', 'Ministerio de niñez.', TRUE, CURRENT_TIMESTAMP),
            ('HOSPITALIDAD', 'Hospitalidad', 'Ministerio de hospitalidad.', TRUE, CURRENT_TIMESTAMP),
            ('INTERCESION', 'Intercesión', 'Ministerio de intercesión.', TRUE, CURRENT_TIMESTAMP),
            ('MISIONES', 'Misiones', 'Ministerio de misiones.', TRUE, CURRENT_TIMESTAMP),
            ('EVANGELISMO', 'Evangelismo', 'Ministerio de evangelismo.', TRUE, CURRENT_TIMESTAMP),
            ('DIACONADO', 'Diaconado', 'Ministerio de diaconado.', TRUE, CURRENT_TIMESTAMP)
ON CONFLICT ("min_codigo")
DO UPDATE
SET         "min_nombre" = EXCLUDED."min_nombre",
            "min_descripcion" = EXCLUDED."min_descripcion",
            "min_activo" = TRUE,
            "min_fecha_modificacion" = CURRENT_TIMESTAMP;
