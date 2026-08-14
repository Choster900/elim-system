---
name: database-standards
description: Enforce this repository's database naming and modeling conventions based on standard version 2017.01.12. Use when creating, changing, or reviewing Prisma schemas, migrations, SQL, tables, columns, keys, constraints, indexes, diagrams, procedures, functions, triggers, or views.
---

# Database Standards

Aplicar el estándar corporativo a los nombres físicos y al SQL de este proyecto sin romper la
API TypeScript existente.

## Fuente obligatoria

Leer completamente
[references/database-standard-2017.md](references/database-standard-2017.md) antes de diseñar,
editar o revisar cualquier objeto de base de datos. Tratar esa referencia como fuente normativa.

## Flujo de trabajo

1. Leer `AGENTS.md`, `prisma/schema.prisma` y las migraciones relacionadas.
2. Identificar el módulo, las entidades de negocio en español y los prefijos ya asignados.
3. Inventariar nombres físicos afectados: tablas, campos, claves, relaciones e índices.
4. Proponer o confirmar prefijos de tres letras antes de reutilizarlos. Evitar colisiones.
5. Actualizar primero el modelo Prisma y después generar o ajustar la migración.
6. Añadir descripciones del negocio en Prisma y comentarios SQL cuando la migración esté en alcance.
7. Ejecutar `npx prisma format`, `npx prisma validate` y `git diff --check`.
8. Ejecutar la validación adicional indicada por `AGENTS.md` y reportar excepciones.

## Aplicación en Prisma

- Mantener los identificadores lógicos de Prisma compatibles con el código existente.
- Hacer obligatoria la nomenclatura 2017 en los nombres físicos mediante `@map` y `@@map`.
- Declarar claves primarias enteras con `@default(autoincrement())` para tablas nuevas.
- Nombrar constraints con `map:`: `@id(map: ...)`, `@unique(map: ...)`,
  `@@unique(..., map: ...)` y `@relation(..., map: ...)`.
- Especificar `@db.VarChar(100|300|600)` y `@db.Decimal(19, 2)` según el dato.
- Implementar `CHECK` y `COMMENT ON` en la migración SQL cuando Prisma no permita expresarlos.
- No suponer que `///` crea comentarios físicos en PostgreSQL.

Ejemplo mínimo:

```prisma
/// Persona que forma parte de la comunidad de la iglesia.
model Member {
  id    Int     @id(map: "pk_mie_miembro") @default(autoincrement()) @map("mie_id")
  code  String  @unique(map: "uk_mie_codigo") @map("mie_codigo") @db.VarChar(100)
  name  String  @map("mie_nombre") @db.VarChar(100)
  notes String? @map("mie_nota") @db.VarChar(600)

  @@map("mie_miembro")
}
```

## Cambios sobre objetos existentes

- No renombrar tablas, columnas, claves UUID ni constraints existentes de manera incidental.
- Tratar una adopción retroactiva como una migración explícita y potencialmente incompatible.
- Presentar el mapa `actual -> propuesto`, el impacto y la estrategia de reversión antes de aplicarla.
- Preservar datos mediante `ALTER ... RENAME` cuando corresponda; evitar recrear tablas sin necesidad.
- No ejecutar una migración destructiva ni modificar una base compartida sin autorización expresa.

## Entrega

Indicar el módulo, prefijos usados, objetos creados o renombrados, validaciones ejecutadas y cualquier
punto pendiente del estándar. Recordar que la versión 2017 deja sin definir los nombres de índices
no únicos; no presentar una convención provisional como si fuera normativa.
