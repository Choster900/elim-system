# Database Standard 2017.01.12

Referencia normativa adaptada del documento proporcionado para este proyecto.

## Contenido

1. [Principios generales](#1-principios-generales)
2. [Bases de datos](#2-bases-de-datos)
3. [Tablas](#3-tablas)
4. [Campos](#4-campos)
5. [Tipos de datos](#5-tipos-de-datos)
6. [Claves primarias y checks](#6-claves-primarias-y-checks)
7. [Llaves foráneas y constraints](#7-llaves-foráneas-y-constraints)
8. [Índices](#8-índices)
9. [Consultas SQL](#9-consultas-sql)
10. [Procedimientos, funciones y vistas](#10-procedimientos-funciones-y-vistas)
11. [Adaptación a Prisma y PostgreSQL](#11-adaptación-a-prisma-y-postgresql)

## 1. Principios generales

- Usar PowerDesigner como modelador cuando exista un modelo corporativo disponible.
- Escribir en minúsculas todos los nombres físicos de bases, tablas y campos.
- Nombrar en español con conceptos del negocio del cliente: `ubicacion`, `cliente`, `proveedor`.
- Usar nombres en singular para tablas y campos.
- Describir cada tabla y cada campo durante el modelado.
- Mantener un esquema o diagrama por módulo y compartir en ellos las tablas comunes.
- Realizar cada cambio primero en el modelo y después en el motor de base de datos.

Adaptación técnica local: usar identificadores físicos en español, `snake_case`, sin tildes ni
caracteres que obliguen a entrecomillarlos. Si no existe un archivo PowerDesigner en el repositorio,
usar `prisma/schema.prisma` como modelo ejecutable y señalar que el diagrama corporativo queda
pendiente; no inventar ni afirmar que fue actualizado.

## 2. Bases de datos

- Usar un nombre descriptivo basado en el sistema desarrollado, en minúscula y singular.
- Preferir el acrónimo oficial del sistema, por ejemplo `rnt` o `apvt`.
- No adivinar el acrónimo: conservar el configurado o solicitar el nombre oficial al crear la base.

## 3. Tablas

- Formar cada nombre con un prefijo de tres letras relacionado con la entidad, `_` y la entidad en
  singular: `ubi_ubicacion`, `cli_cliente`, `prv_proveedor`.
- Registrar y reutilizar un solo prefijo por entidad dentro del sistema.
- Conservar el prefijo de unión formado por las iniciales de las dos entidades y `x`, pero separar
  los nombres de las entidades con `_` para cumplir `snake_case`: `uxr_usuario_rol`,
  `mxr_miembro_rol`.
- Resolver colisiones de prefijos de forma explícita y documentar la decisión en el cambio.

## 4. Campos

- Iniciar cada campo con el prefijo de su tabla: `ubi_nombre`.
- Nombrar la clave principal `<prefijo>_id`: `ubi_id`, `cli_id`, `art_id`.
- Separar palabras con `_`: `ubi_direccion_envio`, `art_valor_final`.
- Nombrar una llave foránea normal `<prefijo_secundaria>_id_<prefijo_primaria>`:
  `art_id_suc` para referenciar `suc_sucursal` desde `art_articulo`.
- En tablas de unión, usar el prefijo de la unión y la entidad referida, por ejemplo
  `uxr_usuario`, `uxr_rol`, `mxr_miembro`, `mxr_rol`.
- Para una autorrelación, usar `<prefijo>_id_<concepto>`: `suc_id_padre`.

## 5. Tipos de datos

- Usar `VARCHAR(100)` para descripciones cortas.
- Usar `VARCHAR(300)` para descripciones medias.
- Usar `VARCHAR(600)` para descripciones largas.
- Usar `DECIMAL(19,2)` por defecto; documentar cualquier precisión diferente requerida por negocio.
- Usar claves principales enteras, autonuméricas y con incremento de uno.

No asignar longitudes por costumbre: clasificar el contenido como corto, medio o largo. Para tipos
especializados como fecha, booleano o binario, usar el tipo nativo adecuado; el documento solo fija
longitudes para `VARCHAR`, precisión decimal y tipo de llave primaria.

## 6. Claves primarias y checks

- Nombrar la clave primaria `pk_<nombre_tabla>`: `pk_ctr_categoria_retiro`.
- Nombrar cada check `ck_<nombre_campo>`.
- Si un campo tiene varios checks, agregar correlativo: `ck_art_nombre_1`, `ck_art_nombre_2`.

## 7. Llaves foráneas y constraints

- Nombrar el campo foráneo con la regla de la sección 4.
- Nombrar la relación `fk_<campo_foraneo>`: `fk_art_id_suc`.
- Nombrar una autorrelación según el campo descriptivo: `fk_suc_id_padre`.
- Nombrar un índice o constraint único `uk_<campo>`: `uk_cli_dui`.
- Para una unicidad compuesta, usar un concepto genérico, corto y significativo después de `uk_`.

## 8. Índices

La versión 2017 deja pendiente la nomenclatura de índices no únicos. No atribuirle una regla que no
contiene. Respetar una convención ya establecida en el repositorio; si no existe, documentar el nombre
provisional elegido y señalarlo como extensión local pendiente de aprobación. Los índices únicos sí
usan `uk_` conforme a la sección 7.

## 9. Consultas SQL

- Escribir palabras reservadas SQL en mayúsculas.
- Iniciar cada cláusula principal en una línea nueva.
- Separar y alinear secciones para facilitar lectura e impresión.
- Formatear subconsultas con sangría visible respecto de la consulta principal.
- Evitar líneas extensas y comentar decisiones relevantes, tablas y condiciones especiales.

```sql
SELECT  per.per_id,
        per.per_nombre
FROM    per_persona AS per
WHERE   per.per_id IN
        (
            SELECT  mie.mie_id_per
            FROM    mie_miembro AS mie
            WHERE   mie.mie_activo = TRUE
        );
```

## 10. Procedimientos, funciones y vistas

- Nombrar procedimientos `usp_<prefijo_tabla>_<accion>`: `usp_not_insertar`.
- Nombrar funciones `ufn_<nombre_funcion>`.
- Nombrar vistas `uvw_<nombre_vista>`.
- No inventar un prefijo para triggers: usar el aprobado en el proyecto o solicitar definición.
- Agregar encabezado con nombre, descripción, parámetros de entrada/salida, autor, fecha y cambios.
- Usar variables sencillas, significativas, sin plurales y, cuando sea posible, sin abreviaturas.
- Iniciar cada cláusula en una línea nueva, usar palabras SQL en mayúsculas y comentar ampliamente.

```sql
------------------------------------------------------------------------
-- usp_cli_actualizar_saldo
-- Actualiza el saldo del cliente para el periodo indicado.
-- Entrada: @cliente_id, @periodo_fecha
-- Autor / fecha / cambio: <completar>
------------------------------------------------------------------------
CREATE PROCEDURE usp_cli_actualizar_saldo
    @cliente_id INTEGER,
    @periodo_fecha DATETIME
AS
BEGIN
    UPDATE  cli_cliente
    SET     cli_saldo = cli_saldo
    WHERE   cli_id = @cliente_id;
END;
```

## 11. Adaptación a Prisma y PostgreSQL

Aplicar la norma al nombre físico incluso si el identificador lógico de Prisma permanece en inglés
para conservar compatibilidad con TypeScript.

| Objeto  | Prisma                                 | Nombre físico esperado |
| ------- | -------------------------------------- | ---------------------- |
| Tabla   | `@@map("mie_miembro")`                 | `mie_miembro`          |
| Campo   | `@map("mie_nombre")`                   | `mie_nombre`           |
| PK      | `@id(map: "pk_mie_miembro")`           | `pk_mie_miembro`       |
| Unique  | `@unique(map: "uk_mie_codigo")`        | `uk_mie_codigo`        |
| FK      | `@relation(..., map: "fk_mie_id_est")` | `fk_mie_id_est`        |
| VARCHAR | `@db.VarChar(100)`                     | `VARCHAR(100)`         |
| Decimal | `@db.Decimal(19, 2)`                   | `DECIMAL(19,2)`        |

Ejemplo de relación:

```prisma
model Member {
  id       Int         @id(map: "pk_mie_miembro") @default(autoincrement()) @map("mie_id")
  statusId Int         @map("mie_id_est")
  status   MemberState @relation(fields: [statusId], references: [id], map: "fk_mie_id_est")

  @@map("mie_miembro")
}

model MemberState {
  id      Int      @id(map: "pk_est_estado_miembro") @default(autoincrement()) @map("est_id")
  name    String   @unique(map: "uk_est_nombre") @map("est_nombre") @db.VarChar(100)
  members Member[]

  @@map("est_estado_miembro")
}
```

Usar `///` para documentar modelos y campos dentro de Prisma. Cuando el cambio incluya migración,
agregar también `COMMENT ON TABLE` y `COMMENT ON COLUMN` en PostgreSQL, porque la documentación de
Prisma no garantiza comentarios físicos. Agregar checks mediante SQL de migración cuando Prisma no
los represente de forma declarativa.

No convertir automáticamente UUID existentes a enteros ni renombrar objetos existentes durante una
tarea no relacionada. Preparar una migración específica, mapa de nombres, respaldo y reversión para
adoptar el estándar retroactivamente.
