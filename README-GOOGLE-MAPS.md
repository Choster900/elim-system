# Google Maps: configuración de API

Esta aplicación centraliza Google Maps en `useGoogleMaps()` para que las pantallas no carguen claves ni scripts por separado. Los mapas actuales de territorios y reuniones continúan usando Leaflet; la integración queda lista para las pantallas que requieran Google Maps, Places o geocodificación en el navegador.

## 1. Crear el proyecto y habilitar facturación

1. Abre [Google Maps Platform](https://console.cloud.google.com/google/maps-apis).
2. Crea o selecciona un proyecto de Google Cloud.
3. Vincula una cuenta de facturación al proyecto.
4. En **APIs & Services > Library**, habilita **Maps JavaScript API**.
5. Habilita solo APIs adicionales que la pantalla vaya a usar, por ejemplo **Places API (New)** para autocompletar direcciones.

Google exige una clave y facturación para Maps JavaScript API. Consulta la [guía oficial de configuración](https://developers.google.com/maps/documentation/javascript/get-api-key).

## 2. Crear y restringir la clave

1. Ve a **Google Maps Platform > Keys & Credentials**.
2. Selecciona **Create credentials > API key**.
3. Abre la nueva clave y, en **Application restrictions**, elige **Websites**.
4. Agrega los orígenes permitidos:

    ```text
    http://127.0.0.1:3001/*
    http://localhost:3001/*
    https://elim-system.vercel.app/*
    https://tu-dominio.com/*
    ```

5. En **API restrictions**, selecciona **Restrict key** y agrega **Maps JavaScript API**. Incluye Places API (New) solo si se utiliza.
6. Guarda los cambios.

La clave del navegador siempre será visible en las solicitudes del cliente. Su protección se logra con restricciones de sitios web y de APIs, nunca tratando de ocultarla. Google recomienda restringirla antes de producción; para Maps JavaScript API la restricción adecuada es por HTTP referrers. Consulta las [recomendaciones oficiales de seguridad](https://developers.google.com/maps/api-security-best-practices#restricting-api-keys).

## 3. Configurar el entorno

Agrega estos valores a `.env` local:

```dotenv
NUXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
# Opcional: solo para Cloud Map Styles o Advanced Markers.
NUXT_PUBLIC_GOOGLE_MAPS_MAP_ID=
```

Para Vercel, registra las mismas variables en **Settings > Environment Variables** para los entornos que correspondan. Después haz un redeploy, ya que los valores públicos se incorporan al build de Nuxt.

No incluyas una clave real en `.env.example`, documentación, commits ni capturas.

## 4. Usarlo desde una pantalla

```ts
const { isConfigured, load, mapId } = useGoogleMaps()

onMounted(async () => {
    if (!isConfigured.value) return

    await load({ libraries: ['places'] })
    // Después de load(), window.google.maps está disponible.
})
```

`load()` reutiliza una única promesa y etiqueta de script para toda la aplicación. No agregues manualmente etiquetas `<script>` de Google Maps en componentes.

## APIs según la necesidad

| Función                                          | API que se habilita                                                   |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| Mapa, marcador y polígonos                       | Maps JavaScript API                                                   |
| Buscar/autocompletar direcciones                 | Places API (New) y la librería `places`                               |
| Geocodificación en el navegador                  | Maps JavaScript API, servicio de geocodificación                      |
| Geocodificación desde Nitro o un proceso privado | Geocoding API con una clave de servidor separada y restringida por IP |

No reutilices una clave web en servicios del servidor. Las claves de backend deben ser distintas y con restricciones por IP o por el mecanismo que Google indique para ese servicio.
