# SkinBridge 🚀

**SkinBridge** es una herramienta web interactiva premium que te permite transformar tus skins de Minecraft de 64x64 px en modelos 3D y plantillas de ropa oficiales para Roblox Classic. 

La aplicación está dividida en dos interfaces de trabajo completamente independientes y accesibles desde un navegador en la cabecera superior.

---

## 🌟 Características Principales

### 1. Módulo: Modelo Cabeza 3D (`head3d`)
Convierte la sección de la cabeza de tu skin de Minecraft en un modelo 3D de alta calidad con volumen por capas (Capa Base + Capa Sombrero/Exterior).
* **Visor 3D Interactivo:** Visualiza la cabeza en tiempo real en un entorno virtual oscuro con soporte para rotación orbital, zoom libre, rejilla de ayuda y auto-rotación.
* **Desglose de Caras:** Muestra un grid 2D con las 12 caras de la cabeza recortadas dinámicamente según las coordenadas oficiales de Minecraft.
* **Exportadores Soportados:**
  * **GLB:** Descarga el modelo 3D como archivo binario `.glb` ideal para importar directamente en Blender, Unity o Unreal Engine.
  * **BBMODEL (Blockbench):** Exporta el modelo en formato nativo de Blockbench, organizado jerárquicamente con cubos nativos editables y texturas incrustadas para que puedas modificarlo con facilidad.
  * *Nota: Las exportaciones a OBJ y FBX se encuentran temporalmente desactivadas en esta versión.*

### 2. Módulo: Plantillas Ropa Roblox (`roblox`)
Convierte las extremidades y el torso de tu skin de Minecraft en plantillas de ropa clásicas oficiales de Roblox (resolución exacta de 585x559 px).
* **Remapeado UV Anatómico Correcto:** Mapea las texturas de la skin (torso, brazos y piernas) a las posiciones y orientaciones oficiales de las plantillas clásicas R15 de Roblox, corrigiendo problemas de costados invertidos.
* **Previsualización de Avatar en 2D:** Mira cómo se verá la ropa sobre el avatar de Roblox directamente desde el panel izquierdo con selector de perspectiva interactivo (**Frente**, **Espalda**, **Izquierda**, **Derecha**).
* **Ausencia de Cabeza:** Por seguridad y especificaciones de las plantillas de ropa de Roblox, la cabeza de la skin se omite por completo del módulo (tanto en la previsualización original como en los templates finales).
* **Escalado Pixel-Perfect:** Utiliza un algoritmo de vecino más cercano (Nearest-Neighbor) para redimensionar los píxeles sin interpolar ni suavizar, manteniendo la nitidez del pixel art original.
* **Descarga Rápida:** Descarga los templates individuales (`shirt.png` y `pants.png`) o descarga ambos secuencialmente con un solo clic utilizando el botón de la barra lateral.

---

## 🛠️ Tecnologías Utilizadas

El proyecto está construido sobre un stack moderno y eficiente para desarrollo frontend en web:
* **Framework:** React 19 + TypeScript + Vite
* **Gráficos 3D:** Three.js con OrbitControls y GLTFExporter
* **Iconografía:** Lucide React
* **Estilos:** Vanilla CSS con gradientes dinámicos y Glassmorphism
* **Manipulación de Imagen:** Canvas 2D API para recorte y escalado de píxeles

---

## 💻 Instalación y Ejecución Local

Para instalar y ejecutar este proyecto de forma local, sigue estos pasos:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/skinbridge.git
   cd skinbridge
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre tu navegador en la dirección local indicada por la consola (usualmente `http://localhost:5173`).

4. **Compilar para producción:**
   ```bash
   npm run build
   ```
   Esto generará el paquete optimizado dentro de la carpeta `dist/`.
