UPDATE  "den_denominacion"
SET     "den_activo" = FALSE,
        "den_fecha_modificacion" = CURRENT_TIMESTAMP
WHERE   "den_codigo" = 'MON-050';
