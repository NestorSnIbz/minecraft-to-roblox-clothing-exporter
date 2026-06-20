# SkinBridge 🚀

**SkinBridge** es una plataforma web interactiva premium diseñada para creadores. Te permite transformar tus skins de Minecraft (64x64 px) en modelos 3D listos para software de edición (Blender, Blockbench) y en plantillas de ropa oficiales de **Roblox Classic** (Shirt y Pants) con previsualización tridimensional en tiempo real.

🔗 **Sitio web oficial:** [https://minecraft-to-roblox-clothing-export.vercel.app/](https://minecraft-to-roblox-clothing-export.vercel.app/)

---

## 🌟 Características Principales

### 1. Panel de Control & Estadísticas (SaaS Dashboard)
* **Punto de Entrada Centralizado:** La aplicación ofrece un panel moderno que permite explorar las herramientas disponibles y ver tendencias de uso.
* **Métricas y Analíticas en Tiempo Real:** Realiza un seguimiento de las conversiones de skins, archivos exportados, tu formato favorito y la herramienta más utilizada.
* **Gráficos Dinámicos:** Gráfico circular SVG interactivo que muestra la distribución de uso de las herramientas y un gráfico de barras horizontales para el formato de exportación más popular.
* **Historial de Actividad Reciente:** Registra cronológicamente tus últimas 5 acciones (cargas, visitas y exportaciones) con formato de tiempo relativo.
* **Persistencia:** Todos tus datos analíticos e historial se guardan automáticamente en `localStorage`.

### 2. Módulo: Modelo Cabeza 3D (`head3d`)
Convierte la cabeza de tu skin de Minecraft en un modelo 3D con volumen por capas (Capa Base + Capa Sombrero/Exterior).
* **Visor 3D Interactivo:** Explora la cabeza en un entorno virtual oscuro con rotación orbital de 360°, zoom libre, rejilla de ayuda y auto-rotación.
* **Desglose de Caras:** Grid 2D con las 12 caras de la cabeza recortadas dinámicamente según las coordenadas oficiales de Minecraft.
* **Exportadores Soportados:**
  * **GLB:** Descarga el modelo 3D como archivo binario `.glb` compatible con Blender, Unity o Unreal Engine.
  * **BBMODEL (Blockbench):** Exporta el modelo estructurado en carpetas jerárquicas con cubos nativos editables y texturas incrustadas.
  * *Nota: Las exportaciones a OBJ y FBX se encuentran desactivadas temporalmente en esta versión.*

### 3. Módulo: Plantillas Ropa Roblox (`roblox`)
Convierte el torso, los brazos y las piernas de tu skin de Minecraft en plantillas de ropa clásicas oficiales de Roblox (585x559 px).
* **Autodetección de Formato (Steve vs. Alex):** Identifica automáticamente si la skin subida utiliza el formato Classic (brazos de 4px) o el formato Slim/Alex (brazos de 3px), adaptando el remapeado UV en tiempo real.
* **Visualizador 3D de Avatar Roblox (Dummy R6):** Un visor 3D interactivo de cuerpo completo que aplica en tiempo real las texturas de la camisa (`shirt.png`) y del pantalón (`pants.png`) generadas sobre un maniquí R6 de Roblox, con controles orbitales y un botón para restaurar la cámara a la vista frontal por defecto.
* **Remapeado UV Anatómico Correcto:** Mapea las texturas de la skin (torso, brazos y piernas) a las posiciones oficiales R15 de las plantillas clásicas de Roblox, con costados de extremidades y torso corregidos para evitar inversiones visuales.
* **Previsualización de Avatar en 2D:** Panel izquierdo que ensambla la ropa en un canvas superior e inferior con selector de vista interactivo (**Frente**, **Espalda**, **Izquierda**, **Derecha**).
* **Escalado Pixel-Perfect:** Utiliza un algoritmo de vecino más cercano (Nearest-Neighbor) para mantener la nitidez del pixel art original en los templates y visores 3D.
* **Descarga Rápida:** Descarga los templates individuales o ambos secuencialmente con un solo clic.

### 4. Soporte Multilingüe (i18n)
* **Detección Automática:** Detecta automáticamente el idioma de tu navegador y establece el español (`es`) o el inglés (`en`, por defecto) correspondientes.
* **Cambio Dinámico:** Selector visual en el header de la aplicación que traduce toda la interfaz en tiempo real sin necesidad de recargar la página.
* **Persistencia:** Almacena la preferencia de idioma en el navegador.

### 5. Columnas de Anuncios Horizontales/Laterales (Responsivo)
* **Banners de Patrocinadores (160x600 px):** Integra columnas de anuncios tipo "Wide Skyscraper" a los costados de la aplicación diseñados con la estética de vidrio esmerilado del sistema.
* **Diseño No Intrusivo:** Los anuncios se ocultan automáticamente mediante consultas CSS `@media` en resoluciones inferiores a `1600px` para asegurar la total usabilidad de los visores 3D y áreas de trabajo en portátiles y móviles.
* **Interactivos:** Cuenta con un botón de cierre que oculta el anuncio permanentemente durante la sesión.

---

## 🛠️ Tecnologías Utilizadas

* **Framework:** React 19 + TypeScript + Vite
* **Gráficos 3D:** Three.js con OrbitControls y GLTFExporter
* **Iconografía:** Lucide React
* **Estilos:** Vanilla CSS con gradientes dinámicos y Glassmorphism
* **Manipulación de Imagen:** Canvas 2D API para recorte y escalado de píxeles
* **Optimización de Bundle:** Code Splitting con `React.lazy` y `Suspense`, logrando reducir el tamaño inicial del empaquetador de la aplicación en un **80%** (de 1.12 MB a **225 kB**).

---

## 💻 Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/NestorSnIbz/minecraft-to-roblox-clothing-exporter.git
   cd minecraft-to-roblox-clothing-exporter
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre tu navegador en `http://localhost:5173`.

4. **Compilar para producción:**
   ```bash
   npm run build
   ```
   Esto generará el paquete optimizado y dividido en chunks bajo demanda dentro de la carpeta `dist/`.

