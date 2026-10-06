-- Renombra los tipos de reunión a los nombres que usa la congregación. Se conserva el segmento
-- (`tir_codigo`), de modo que las reuniones existentes y sus códigos no cambian.
UPDATE "tir_tipo_reunion"
SET    "tir_nombre" = CASE "tir_codigo"
           WHEN 'S' THEN 'Culto General'
           WHEN 'V' THEN 'Vigilia'
       END,
       "tir_fecha_modificacion" = CURRENT_TIMESTAMP
WHERE  "tir_codigo" IN ('S', 'V');
