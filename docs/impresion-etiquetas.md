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

| Carpeta                              | Qué contiene                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| `app/infrastructure/label-printing/` | Tecnología: contrato, adapters, renderer, validación, errores. No conoce pantallas. |
| `app/presentation/label-printing/`   | Pantalla de prueba y el store que mantiene la conexión abierta entre pantallas.     |

- **`LabelDocument`** es solo datos: tamaño en mm y una lista de bloques (`text`, `barcode`,
  `qr`). Las pantallas nunca tocan canvas ni librerías.
- **El adapter** recibe el `LabelDocument` y decide cómo imprimirlo. Los de NIIMBOT lo dibujan al
  DPI real del modelo y recortan el margen sobrante si la etiqueta es un poco más ancha que el
  cabezal (por ejemplo, 50 mm en un cabezal de 48 mm).
- **La vista previa** usa el mismo renderer que la impresión, así que muestra lo que sale en el
  papel.
- `@mmote/niimbluelib` y `bwip-js` se cargan con `import()` diferido, solo cuando hacen falta.

## Imprimir una etiqueta nueva desde otra pantalla

1. Crea una función que arme el documento, como `buildTestLabelDocument` en
   `app/presentation/label-printing/utils/test-label.util.ts`:

    ```ts
    export function buildMeetingLabelDocument(meeting: Meeting): LabelDocument {
        return {
            size: { widthMm: 50, heightMm: 30 },
            blocks: [
                { kind: 'text', value: meeting.name, size: 'lg', bold: true, align: 'center' },
                { kind: 'barcode', value: meeting.code, symbology: 'code128' },
            ],
        }
    }
    ```

2. Imprime con el store, que reutiliza la impresora ya conectada:

    ```ts
    const printerStore = useLabelPrinterStore()
    const printed = await printerStore.print(buildMeetingLabelDocument(meeting), 1)
    if (!printed) toast.error(printerStore.printError ?? 'No se pudo imprimir')
    ```

    Si `printerStore.isConnected` es `false`, envía al usuario a la pantalla de la impresora para
    conectarla.

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
