-- Roles comunitarios adicionales para los equipos ministeriales, operativos y administrativos.
INSERT INTO "roc_rol_comunidad" (
    "roc_codigo",
    "roc_nombre",
    "roc_descripcion",
    "roc_activo",
    "roc_sistema",
    "roc_fecha_creacion",
    "roc_fecha_modificacion"
)
VALUES
    ('ASSOCIATE_PASTOR', 'Pastor asociado', 'Pastor que colabora en el cuidado de la comunidad.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('EVANGELIST', 'Evangelista', 'Miembro dedicado a compartir el evangelio.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('MISSIONARY', 'Misionero', 'Miembro enviado o dedicado al trabajo misionero.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('WORSHIP_LEADER', 'Líder de alabanza', 'Responsable de coordinar el equipo de alabanza.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('SMALL_GROUP_LEADER', 'Líder de célula', 'Responsable de acompañar una célula o grupo pequeño.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('DISCIPLESHIP_LEADER', 'Discipulador', 'Miembro que acompaña procesos de discipulado.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('INTERCESSOR', 'Intercesor', 'Miembro que sirve en el ministerio de intercesión.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('COUNSELOR', 'Consejero', 'Miembro que brinda consejería y acompañamiento.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('USHER', 'Ujier', 'Miembro que orienta y recibe durante las reuniones.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('HOSPITALITY', 'Hospitalidad', 'Miembro que sirve en la atención y bienvenida.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('MEDIA_TECHNICIAN', 'Multimedia', 'Miembro que apoya proyección, transmisión y medios.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('SOUND_TECHNICIAN', 'Sonido', 'Miembro que apoya la operación de audio.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('MISSIONS_LEADER', 'Líder de misiones', 'Responsable de coordinar iniciativas misioneras.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('EVANGELISM_LEADER', 'Líder de evangelismo', 'Responsable de coordinar iniciativas evangelísticas.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('TREASURER', 'Tesorero', 'Miembro que apoya la gestión financiera de la comunidad.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('SECRETARY', 'Secretario', 'Miembro que apoya la gestión documental y administrativa.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ADMINISTRATOR', 'Administrador', 'Miembro que apoya la administración de la comunidad.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('AUDITOR', 'Auditor', 'Miembro que apoya la revisión y transparencia administrativa.', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("roc_codigo")
DO UPDATE SET
    "roc_nombre" = EXCLUDED."roc_nombre",
    "roc_descripcion" = EXCLUDED."roc_descripcion",
    "roc_activo" = TRUE,
    "roc_sistema" = TRUE,
    "roc_fecha_modificacion" = CURRENT_TIMESTAMP;
