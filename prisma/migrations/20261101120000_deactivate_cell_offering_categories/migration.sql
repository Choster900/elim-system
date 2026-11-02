UPDATE  "cof_categoria_ofrenda"
SET     "cof_activo" = FALSE,
        "cof_fecha_modificacion" = CURRENT_TIMESTAMP
WHERE   "cof_codigo" IN ('COF-DIEZMOS', 'COF-MISIONES', 'COF-PRIMICIAS');
