# Impresión de etiquetas

El sistema puede imprimir etiquetas térmicas (reuniones, miembros, inventario…) desde el navegador.
La pantalla de prueba está en `/herramientas/impresora-etiquetas`, solo para administradores
(`system.manage`), y se abre desde el menú del usuario.

Todo ocurre en el navegador del usuario: el servidor no ve ni controla impresoras.

## Arquitectura

```text
Pantalla ──► label-printer.store (Pinia) ──► LabelPrinterAdapter
                                               ├─ niimbot-bluetooth  (@mmote/niimbluelib)
                                               ├─ niimbot-serial     (@mmote/niimbluelib)
                                               └─ simulator          (sin hardware)

LabelDocument (datos) ──► label-raster.renderer (canvas + bwip-js) ──► adapter
```

| Carpeta                              | Qué contiene                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| `app/infrastructure/label-printing/` | Tecnología: contrato, adapters, renderer, validación, errores. No conoce pantallas.   |
| `app/presentation/label-printing/`   | Store, modal de configuración, composable `useLabelPrintJob` y la pantalla de prueba. |

- **`LabelDocument`** es solo datos: tamaño en mm y una lista de bloques (`text`, `field`, `barcode`,
  `qr`). Las pantallas nunca tocan canvas ni librerías.
- **El adapter** recibe el `LabelDocument` y decide cómo imprimirlo. Los de NIIMBOT lo dibujan al
  DPI real del modelo y recortan el margen sobrante si la etiqueta es un poco más ancha que el
  cabezal (por ejemplo, 50 mm en un cabezal de 48 mm).
- **La vista previa** usa el mismo renderer que la impresión, así que muestra lo que sale en el
  papel.
- `@mmote/niimbluelib` y `bwip-js` se cargan con `import()` diferido, solo cuando hacen falta.

## Imprimir desde otra pantalla

Ejemplo real: la viñeta de reunión en `/catalogos/distritos` (menú ⋯ de una reunión → «Imprimir
viñeta»).

1. Arma un `LabelPrintJob` (título, tipo y bloques). El tamaño lo pone el papel configurado por el
   usuario. Ejemplo en `app/presentation/meetings/utils/meeting-label.util.ts`:

    ```ts
    export function buildMeetingLabelJob(meeting: MeetingRecord): LabelPrintJob {
        return {
            title: meeting.title,
            kindLabel: 'viñeta',
            blocks: [
                { kind: 'field', label: 'Líder', value: meeting.leaderName ?? 'Sin asignar' },
                { kind: 'barcode', value: meeting.fullCode, symbology: 'code128' },
            ],
        }
    }
    ```

    Bloques disponibles: `text` (una línea), `field` (`Etiqueta:` en negrita + valor), `barcode`
    (`code128` o `ean13`) y `qr`. Las líneas tienen alto fijo y los códigos se reparten el espacio
    que sobra. Si una línea no cabe a lo ancho, su letra se reduce hasta un 60 % antes de cortarse
    con «…».

2. Usa `useLabelPrintJob()` y monta el modal reutilizable:

    ```ts
    const { setupOpen, pendingJob, isPrinterReady, openSetup, printNow } = useLabelPrintJob()

    async function printMeetingLabel(meeting: MeetingRecord) {
        const job = buildMeetingLabelJob(meeting)
        if (isPrinterReady.value) await printNow(job)
        else openSetup(job)
    }
    ```

    ```vue
    <LabelPrinterSetupDialog v-model:open="setupOpen" :job="pendingJob" />
    ```

    - `printNow` imprime una copia y muestra el resultado en un toast. Si falla, el toast trae
      «Configurar», que abre el modal con el mismo trabajo.
    - `LabelPrinterSetupDialog` guía en tres pasos (conectar, papel, imprimir) con vista previa.
      Sin `job`, sirve solo para configurar la impresora.
    - El controlador elegido y el papel cargado se guardan en este navegador
      (`label-printer-preferences`). La conexión sigue abierta mientras no se recargue la página.

## Agregar otra tecnología (SDK oficial, agente local, otra marca)

1. Crea `app/infrastructure/label-printing/adapters/<nombre>/<nombre>.adapter.ts` con una función
   que devuelva un `LabelPrinterAdapter` (`label-printer.types.ts`).
2. Agrega su id a `LabelPrinterAdapterId` y una entrada a `labelPrinterAdapters` en
   `label-printer.registry.ts`.
3. Si la nueva opción necesita un ícono, agrégalo en `ADAPTER_ICONS` de `PrinterConnectionCard.vue`.

Las pantallas y el store no cambian. Lanza `LabelPrinterError` con el código adecuado para que el
usuario vea mensajes en español.

## Limitaciones

- Web Bluetooth y Web Serial solo funcionan en **Chrome o Edge** de escritorio (y Chrome en
  Android para Bluetooth).
- **iPhone y iPad no pueden**, con ningún navegador: Chrome y Edge en iOS usan el motor de Safari,
  que no incluye Bluetooth ni USB para páginas web.
- La página debe abrirse con **HTTPS o desde `localhost`**. Si entras al servidor de desarrollo
  desde otro equipo por `http://192.168.x.x:3000`, el navegador oculta Bluetooth y USB. Para probar
  desde un Android hace falta HTTPS (el despliegue en Vercel o un túnel HTTPS hacia la PC).
- Cuando una opción no está disponible, la pantalla explica el motivo concreto: cada adapter lo
  informa con `checkSupport()`.
- La lista de «impresoras autorizadas» solo muestra las que este navegador ya autorizó. Chrome
  todavía no expone `navigator.bluetooth.getDevices()` sin activar una opción experimental, así que
  por Bluetooth normalmente hay que usar «Buscar impresora».
- `@mmote/niimbluelib` **no es un SDK oficial de NIIMBOT**. Antes de usarlo en producción, revisa
  su licencia y las condiciones del fabricante.
- Modelos compatibles con impresión según la librería (v0.49.1): B1, B21, B21 Pro, D11, D110,
  D101, D11-H y otros. **K2, K3 y B3S aparecen en su catálogo pero no tienen tarea de impresión**:
  la pantalla mostrará «todavía no se puede imprimir». Para esos modelos hace falta otro adapter.
- Antes de culpar al sistema, prueba la impresora en <https://niim.blue/>: si ahí no imprime, aquí
  tampoco.
