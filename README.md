# Ficha Técnica de Medición

App móvil para registrar variables y equipos de medición en cuevas. Funciona **100% offline** una vez instalada — sin conexión a internet, sin servidores, sin cuentas.

🔗 **[Abrir la app](https://hernanx21.github.io/pdf-form-maker)**

---

## ¿Qué hace?

Permite crear y gestionar **fichas técnicas de campo** con la siguiente información:

| Sección | Contenido |
|---|---|
| **1. Detalles de cueva** | Nombre, punto, fecha, horario, presencia y tipo de agua, sección transversal |
| **2. Parámetros ambientales** | Humedad, temperatura, presión, velocidad del viento, CO₂ |
| **3. Equipos de radiación ionizante** | AlphaE, GammaScout, GMQ-GMC+600, Dosímetros, Sonda Beta |
| **4. Equipos adicionales** | Medidor de radiación cósmica |
| **5. Observaciones** | Notas libres de campo |
| **Fotografías** | Fotos adjuntas almacenadas junto a la ficha |

Cada ficha se puede exportar a **PDF** (formato que replica la ficha Excel original) o a **JSON** para respaldo y transferencia entre dispositivos.

---

## Instalación en el dispositivo

La app se puede instalar como una app nativa desde el navegador — sin pasar por ninguna tienda de apps.

### Android (Chrome)
1. Abre la app en Chrome
2. Toca el menú **⋮** (tres puntos arriba a la derecha en el home)
3. Selecciona **"Instalar app"**
4. Confirma en el diálogo que aparece

### iPhone / iPad (Safari)
1. Abre la app en Safari
2. Toca el botón de **Compartir** ⎙ en la barra inferior
3. Desplázate y toca **"Añadir a pantalla de inicio"**
4. Confirma tocando **"Añadir"**

> Una vez instalada, la app funciona completamente sin internet.

---

## Uso básico

### Crear una ficha
1. Toca el botón **+** en la pantalla principal
2. Completa las secciones del formulario (los campos con * son requeridos: Cueva, Punto y Fecha)
3. Los datos se guardan automáticamente mientras escribís — no hay botón "Guardar"

### Navegar las secciones
Cada sección es un panel colapsable. Toca el encabezado para expandirla o cerrarla.

### Indicadores Sí / No
Los equipos y parámetros usan botones de toggle:
- **Verde (SI)** — se está midiendo / usando
- **Rojo (NO)** — no se está midiendo / usando
- **Sin color** — aún no seleccionado

### Agregar fotos
Dentro de la ficha, expande la sección **Fotografías adjuntas** y toca **"Agregar foto"**. Podés tomar una foto con la cámara o elegir una de la galería. Las fotos se almacenan localmente junto con la ficha.

### Exportar PDF
Toca **"Exportar PDF"** al final del formulario, o desde la lista de fichas en el home. El PDF incluye todas las secciones con los valores seleccionados y una página completa por cada foto adjunta.

### Exportar / Importar JSON
Útil para hacer backups o transferir fichas entre dispositivos:
- **Exportar una ficha:** en el menú ⋮ dentro del formulario → "Exportar JSON"
- **Exportar todas:** en el menú ⋮ del home → "Exportar todas (JSON)"
- **Importar:** en el menú ⋮ del home → "Importar fichas (JSON)" → seleccioná el archivo

---

## Pantalla principal

Desde el **home** podés:
- Ver todas las fichas creadas (ordenadas por última modificación)
- Ver el estado de cada ficha: **✓ Completa** (tiene cueva, punto y fecha) o **⏳ Parcial**
- Abrir, exportar a PDF, exportar a JSON o eliminar cualquier ficha
- Acceder al menú ⋮ para importar, exportar todas, instalar la app o limpiar datos

---

## Limpiar caché y datos

Si la app presenta problemas o querés resetearla por completo:

1. Exportá todas tus fichas primero: menú ⋮ → **"Exportar todas (JSON)"**
2. Menú ⋮ → **"Limpiar caché y datos"**
3. Confirmá con **"Limpiar de todas formas"**

Esto elimina todas las fichas, fotos y caché del dispositivo. Podés volver a importar tus fichas desde el JSON exportado.

---

## Indicador de conectividad

El header muestra un punto verde **(Online)** o amarillo **(Offline)**. En modo offline todos los datos siguen disponibles — los cambios se guardan localmente en el dispositivo.

---

## Tecnología

- App web progresiva (PWA) — HTML, CSS y JavaScript sin frameworks ni servidores
- Almacenamiento local con **IndexedDB** (sin límite práctico de fichas)
- Generación de PDF con **jsPDF** — todo procesado en el dispositivo, sin subir datos a internet
- Funciona offline mediante **Service Worker** con estrategia cache-first

---

## Desarrollo

Ver [CLAUDE.md](CLAUDE.md) para instrucciones técnicas de desarrollo.
