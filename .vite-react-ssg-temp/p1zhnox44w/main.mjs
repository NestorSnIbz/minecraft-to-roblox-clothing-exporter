import { Head, ViteReactSSG } from "vite-react-ssg";
import { Component, Suspense, createContext, lazy, useContext, useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { AlertTriangle, Box, CheckCircle, ChevronLeft, ChevronRight, LayoutGrid, Loader2, RefreshCw } from "lucide-react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { createClient } from "@supabase/supabase-js";
//#region src/modules/SkinParser.ts
/**
* Validates and loads a Minecraft skin PNG file.
* Checks that it is a valid image, PNG format, and is exactly 64x64 pixels.
* 
* @param file The uploaded file
* @returns Promise resolving to a SkinValidationResult
*/
function validateAndLoadSkin(file) {
	return new Promise((resolve) => {
		if (file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) {
			resolve({
				isValid: false,
				errorKey: "err_not_png"
			});
			return;
		}
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				if (img.width !== 64 || img.height !== 64) {
					resolve({
						isValid: false,
						errorKey: "err_invalid_resolution",
						errorParams: {
							width: img.width,
							height: img.height
						}
					});
					return;
				}
				resolve({
					isValid: true,
					image: img
				});
			};
			img.onerror = () => {
				resolve({
					isValid: false,
					errorKey: "err_invalid_image"
				});
			};
			img.src = e.target?.result;
		};
		reader.onerror = () => {
			resolve({
				isValid: false,
				errorKey: "err_read_error"
			});
		};
		reader.readAsDataURL(file);
	});
}
//#endregion
//#region src/modules/TextureExtractor.ts
/**
* Extracts a specific rectangular region from an image and returns it as a base64 Data URL.
*/
function cropRegion(image, x, y, width, height) {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) return "";
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
	return canvas.toDataURL("image/png");
}
/**
* Extracts all 12 head and overlay faces from the Minecraft skin image.
* 
* @param image The validated 64x64 skin image element
* @returns ExtractedFaces object containing data URLs for each face
*/
function extractFaces(image) {
	return {
		head: {
			top: {
				name: "Superior (Top)",
				dataUrl: cropRegion(image, 8, 0, 8, 8),
				x: 8,
				y: 0
			},
			bottom: {
				name: "Inferior (Bottom)",
				dataUrl: cropRegion(image, 16, 0, 8, 8),
				x: 16,
				y: 0
			},
			left: {
				name: "Izquierda (Left/East)",
				dataUrl: cropRegion(image, 0, 8, 8, 8),
				x: 0,
				y: 8
			},
			front: {
				name: "Frente (Front)",
				dataUrl: cropRegion(image, 8, 8, 8, 8),
				x: 8,
				y: 8
			},
			right: {
				name: "Derecha (Right/West)",
				dataUrl: cropRegion(image, 16, 8, 8, 8),
				x: 16,
				y: 8
			},
			back: {
				name: "Detrás (Back)",
				dataUrl: cropRegion(image, 24, 8, 8, 8),
				x: 24,
				y: 8
			}
		},
		overlay: {
			top: {
				name: "Superior (Top)",
				dataUrl: cropRegion(image, 40, 0, 8, 8),
				x: 40,
				y: 0
			},
			bottom: {
				name: "Inferior (Bottom)",
				dataUrl: cropRegion(image, 48, 0, 8, 8),
				x: 48,
				y: 0
			},
			left: {
				name: "Izquierda (Left/East)",
				dataUrl: cropRegion(image, 32, 8, 8, 8),
				x: 32,
				y: 8
			},
			front: {
				name: "Frente (Front)",
				dataUrl: cropRegion(image, 40, 8, 8, 8),
				x: 40,
				y: 8
			},
			right: {
				name: "Derecha (Right/West)",
				dataUrl: cropRegion(image, 48, 8, 8, 8),
				x: 48,
				y: 8
			},
			back: {
				name: "Detrás (Back)",
				dataUrl: cropRegion(image, 56, 8, 8, 8),
				x: 56,
				y: 8
			}
		}
	};
}
//#endregion
//#region src/modules/i18n.tsx
var translations = {
	en: {
		nav_dashboard: "Dashboard",
		app_title: "SkinBridge",
		app_subtitle: "3D Model & Roblox Clothing",
		module_3d_head: "3D Head Model",
		module_roblox: "Roblox Clothing Templates",
		nav_blockbench: "Blockbench Converter",
		nav_gallery: "Gallery",
		dash_blockbench_title: "Blockbench Model Converter",
		dash_blockbench_desc: "Convert Blockbench JSON (.bbmodel) files to standard OBJ and FBX formats client-side. Automatically parses materials, pivots, and UV mapping.",
		bb_upload_title: "Upload .bbmodel File",
		bb_upload_desc: "Drag your .bbmodel file or click to browse.",
		bb_upload_btn: "Select Blockbench File",
		bb_upload_format_hint: ".bbmodel files only",
		bb_model_info: "Model Information",
		bb_model_name: "Name",
		bb_model_elements: "Elements (Cubes)",
		bb_model_textures: "Textures",
		bb_no_model: "No model loaded. Please upload a .bbmodel file to preview and export.",
		toast_bb_load_success: "Blockbench model loaded successfully!",
		toast_bb_parse_error: "Error parsing Blockbench model: {error}",
		toast_bb_export_success: "Model exported successfully!",
		toast_bb_export_error: "Error exporting model: {error}",
		dash_welcome: "Welcome back, Creator!",
		dash_subtitle: "Manage your skins, export to 3D software, or convert to classic Roblox templates from a single centralized hub.",
		dash_head3d_title: "3D Head Model Creator",
		dash_head3d_desc: "Extract and build a 3D blocky head model with automatic overlay support. Perfect for Blender, Unity, or Blockbench projects.",
		dash_roblox_title: "Roblox Classic Clothing Converter",
		dash_roblox_desc: "Convert Minecraft skins into official Roblox Classic Shirt and Pants templates, with real-time preview on a full 3D R6 dummy character.",
		dash_launch_workspace: "Launch Workspace",
		dash_stats_title: "Application Analytics & Usage Trends",
		dash_stat_conversions: "Total Conversions",
		dash_stat_exports: "Files Exported",
		dash_stat_favorite: "Top Format",
		dash_stat_favorite_tool: "Top Workspace",
		dash_recent_activity: "Recent Activity Log",
		dash_no_activity: "No recent activity recorded yet. Start converting!",
		act_upload: "Uploaded skin: {name}",
		act_export: "Exported {format} file: {name}",
		act_visit: "Visited {tool} workspace",
		upload_title: "1. Upload Skin",
		upload_desc: "Drag your 64x64 PNG file or browse your computer.",
		upload_btn: "Select Skin PNG",
		upload_format_hint: "PNG format only (64x64 px)",
		skin_original: "Original Skin",
		extracted_faces: "Extracted Faces (Official Coordinates)",
		tab_base_layer: "Base Layer (Head)",
		tab_outer_layer: "Outer Layer (Hat)",
		avatar_view: "Avatar View",
		view_front: "Front",
		view_back: "Back",
		view_left: "Left",
		view_right: "Right",
		preview_shirt: "Avatar Preview (Shirt)",
		preview_pants: "Avatar Preview (Pants)",
		export_clothing: "Export Clothing",
		btn_shirt: "Shirt",
		btn_pants: "Pants",
		btn_download_both: "Download Both",
		btn_share_workspace: "Share Workspace",
		share_title: "Share Conversion",
		share_desc: "Generate a public link to share your creation with others. Anyone with the link will be able to see and download your files.",
		share_uploading: "Uploading to Supabase...",
		share_copy_link: "Copy Link",
		share_copied: "Copied!",
		share_btn_confirm: "Generate Link",
		btn_close: "Close",
		btn_cancel: "Cancel",
		share_title_roblox: "Shared Roblox Clothing",
		share_title_head3d: "Shared 3D Head Model",
		share_model_info: "Note: The 3D model formats (GLB, OBJ, FBX, BBMODEL) must be generated inside the editor. Click 'Open in SkinBridge' to load the skin and generate them.",
		share_open_app: "Open in SkinBridge",
		share_download_skin: "Download Original Skin",
		share_lbl_name: "Creator Name",
		share_ph_name: "e.g. Steve",
		share_lbl_desc: "Description",
		share_ph_desc: "Tell others about this creation...",
		share_lbl_puzzle: "Anti-Bot Verification",
		share_puzzle_solve: "Solve: {a} + {b} = ?",
		share_puzzle_ph: "Enter result",
		share_err_puzzle: "Incorrect verification answer.",
		share_cooldown: "Please wait {seconds}s before sharing again.",
		dash_shared_history: "Shared Conversions (Last 7 Days)",
		dash_no_shared: "No shared conversions from creators in the last 7 days.",
		dash_share_type: "Type",
		dash_share_creator: "Creator",
		dash_btn_view: "View Share",
		dash_btn_copy: "Copy Link",
		dash_btn_load: "Load Skin",
		dash_btn_refresh: "Refresh",
		dash_pagination_prev: "Previous",
		dash_pagination_next: "Next",
		dash_pagination_page: "Page {current} of {total}",
		dash_loading_shared: "Loading shared history...",
		dash_error_shared: "Error loading shared history: {error}",
		share_disclaimer: "By sharing, your creation will be published to the public dashboard history visible to everyone, and will automatically expire and be deleted after 1 week.",
		arm_type: "Arm Type",
		arm_classic: "Classic (4px)",
		arm_slim: "Slim (3px)",
		opt_grid: "Grid",
		opt_rotate: "Rotate",
		btn_front_view: "Front View",
		template_shirt_title: "Official Shirt Template",
		template_pants_title: "Official Pants Template",
		btn_download_shirt: "Download Shirt",
		btn_download_pants: "Download Pants",
		toast_skin_success: "Skin loaded and processed successfully!",
		toast_load_skin_for_roblox: "Upload a skin to export to Roblox.",
		toast_shirt_success: "Roblox Shirt (skinbridge_shirt.png) downloaded successfully!",
		toast_shirt_error: "Error exporting Roblox Shirt: {error}",
		toast_pants_success: "Roblox Pants (skinbridge_pants.png) downloaded successfully!",
		toast_pants_error: "Error exporting Roblox Pants: {error}",
		toast_bbmodel_success: "skinbridge_cabeza.bbmodel model downloaded successfully!",
		toast_bbmodel_error: "Error exporting .bbmodel: {error}",
		toast_bbmodel_load_skin: "Upload a skin to export to Blockbench.",
		toast_glb_success: "skinbridge_cabeza.glb model downloaded successfully!",
		toast_glb_error: "Error exporting GLB: {error}",
		toast_load_skin_first: "Upload a skin first.",
		toast_no_3d_model: "No 3D model to export.",
		toast_obj_success: "skinbridge_cabeza.obj, skinbridge_cabeza.mtl and skinbridge_textura.png downloaded successfully!",
		toast_obj_error: "Error exporting OBJ: {error}",
		toast_fbx_success: "skinbridge_cabeza.fbx model downloaded successfully!",
		toast_fbx_error: "Error exporting FBX: {error}",
		err_not_png: "The file must be a PNG image.",
		err_invalid_resolution: "The skin resolution must be exactly 64x64 pixels. (Detected: {width}x{height})",
		err_invalid_image: "The file is not a valid image or is corrupted.",
		err_read_error: "An error occurred while reading the file.",
		err_generic: "An error occurred.",
		ad_advertisement: "Advertisement",
		ad_sponsor_title: "Premium Sponsor",
		ad_sponsor_desc: "Support our free creator tools. Click here to sponsor us!",
		mode_export: "Export Templates",
		mode_editor: "Skin Editor",
		confirm_clear_layer: "Are you sure you want to clear the selected layer?",
		editor_tools: "Tools",
		tool_pencil: "Pencil",
		tool_eraser: "Eraser",
		tool_fill: "Fill",
		tool_picker: "Picker",
		editor_history: "History",
		editor_layer: "Active Layer",
		editor_color: "Color",
		editor_options: "Options",
		editor_mirror: "Face Symmetry",
		editor_guides: "Body Guides",
		editor_grid: "Grid",
		editor_clear: "Clear Layer",
		editing_part: "Editing",
		hover_to_identify: "Hover over the canvas to identify the body part",
		btn_generate_relief: "Generate 3D Relief",
		btn_generating_relief: "Generating Relief...",
		toast_relief_success: "3D voxel relief generated successfully!",
		toast_relief_error: "Error generating relief: {error}",
		relief_description: "Automatically calculates 3D relief from your skin's overlay pixels. Transparent pixels are skipped; opaque ones become raised voxels (flush or floating depending on how different they are from the base layer).",
		relief_export_note: "Note: Exports now use separate classic and relief paths for OBJ, FBX, BBModel, and GLB. When relief is enabled, the exporter uses the relief-specific path.",
		toggle_relief_label: "Show 3D Relief",
		face_right: "Right",
		face_left: "Left",
		face_top: "Top",
		face_bottom: "Bottom",
		face_front: "Front",
		face_back: "Back",
		offset_gap: "Floating",
		offset_flush: "Flush"
	},
	es: {
		nav_dashboard: "Panel",
		app_title: "SkinBridge",
		app_subtitle: "Modelo 3D & Ropa Roblox",
		module_3d_head: "Modelo Cabeza 3D",
		module_roblox: "Plantillas Ropa Roblox",
		nav_blockbench: "Convertidor Blockbench",
		nav_gallery: "Galería",
		dash_blockbench_title: "Convertidor de Modelos Blockbench",
		dash_blockbench_desc: "Convierte archivos JSON de Blockbench (.bbmodel) a formatos estándar OBJ y FBX de forma 100% local. Procesa materiales, pivots y UVs automáticamente.",
		bb_upload_title: "Subir archivo .bbmodel",
		bb_upload_desc: "Arrastra tu archivo .bbmodel o haz clic para buscar.",
		bb_upload_btn: "Seleccionar archivo Blockbench",
		bb_upload_format_hint: "Solo archivos .bbmodel",
		bb_model_info: "Información del Modelo",
		bb_model_name: "Nombre",
		bb_model_elements: "Elementos (Cubos)",
		bb_model_textures: "Texturas",
		bb_no_model: "No hay ningún modelo cargado. Sube un archivo .bbmodel para previsualizar y exportar.",
		toast_bb_load_success: "¡Modelo de Blockbench cargado correctamente!",
		toast_bb_parse_error: "Error al procesar el modelo de Blockbench: {error}",
		toast_bb_export_success: "¡Modelo exportado correctamente!",
		toast_bb_export_error: "Error al exportar el modelo: {error}",
		dash_welcome: "¡Bienvenido, Creador!",
		dash_subtitle: "Administra tus skins, expórtalas a software 3D o conviértelas en plantillas de Roblox desde una misma plataforma centralizada.",
		dash_head3d_title: "Creador de Cabeza 3D",
		dash_head3d_desc: "Extrae y construye un modelo 3D de la cabeza con soporte automático de sombreros. Perfecto para proyectos en Blender, Unity o Blockbench.",
		dash_roblox_title: "Conversor de Ropa Roblox",
		dash_roblox_desc: "Convierte skins de Minecraft en plantillas oficiales de Roblox Shirt y Pants, con vista previa 3D interactiva sobre un dummy R6.",
		dash_launch_workspace: "Iniciar Espacio de Trabajo",
		dash_stats_title: "Análisis de Uso y Tendencias",
		dash_stat_conversions: "Conversiones Totales",
		dash_stat_exports: "Archivos Exportados",
		dash_stat_favorite: "Formato Favorito",
		dash_stat_favorite_tool: "Espacio Favorito",
		dash_recent_activity: "Registro de Actividad Reciente",
		dash_no_activity: "No hay actividad reciente. ¡Comienza a realizar conversiones!",
		act_upload: "Subió la skin: {name}",
		act_export: "Exportó archivo {format}: {name}",
		act_visit: "Visitó el espacio de trabajo de {tool}",
		upload_title: "1. Subir Skin",
		upload_desc: "Arrastra tu archivo PNG de 64x64 o búscalo en tu equipo.",
		upload_btn: "Seleccionar Skin PNG",
		upload_format_hint: "Solo formato PNG (64x64 px)",
		skin_original: "Skin Original",
		extracted_faces: "Caras Extraídas (Coordenadas Oficiales)",
		tab_base_layer: "Capa Base (Head)",
		tab_outer_layer: "Capa Exterior (Hat)",
		avatar_view: "Vista del Avatar",
		view_front: "Frente",
		view_back: "Espalda",
		view_left: "Izquierda",
		view_right: "Derecha",
		preview_shirt: "Vista Previa en Avatar (Shirt)",
		preview_pants: "Vista Previa en Avatar (Pants)",
		export_clothing: "Exportar Ropa",
		btn_shirt: "Camisa",
		btn_pants: "Pantalón",
		btn_download_both: "Descargar Ambos",
		btn_share_workspace: "Compartir Espacio",
		share_title: "Compartir Conversión",
		share_desc: "Genera un enlace público para compartir tu creación. Cualquiera con el enlace podrá ver y descargar tus archivos.",
		share_uploading: "Subiendo a Supabase...",
		share_copy_link: "Copiar Enlace",
		share_copied: "¡Copiado!",
		share_btn_confirm: "Generar Enlace",
		btn_close: "Cerrar",
		btn_cancel: "Cancelar",
		share_title_roblox: "Ropa de Roblox Compartida",
		share_title_head3d: "Modelo 3D de Cabeza Compartido",
		share_model_info: "Nota: Los formatos de modelos 3D (GLB, OBJ, FBX, BBMODEL) deben ser generados dentro del editor. Haz clic en 'Abrir en SkinBridge' para cargar la skin y generarlos.",
		share_open_app: "Abrir en SkinBridge",
		share_download_skin: "Descargar Skin Original",
		share_lbl_name: "Nombre del Creador",
		share_ph_name: "ej. Steve",
		share_lbl_desc: "Descripción",
		share_ph_desc: "Cuéntale a otros sobre tu creación...",
		share_lbl_puzzle: "Verificación Anti-Bot",
		share_puzzle_solve: "Resuelve: {a} + {b} = ?",
		share_puzzle_ph: "Resultado",
		share_err_puzzle: "Respuesta de verificación incorrecta.",
		share_cooldown: "Espera {seconds}s antes de volver a compartir.",
		dash_shared_history: "Conversiones Compartidas (Última Semana)",
		dash_no_shared: "No hay conversiones compartidas de los creadores en los últimos 7 días.",
		dash_share_type: "Tipo",
		dash_share_creator: "Creador",
		dash_btn_view: "Ver Compartido",
		dash_btn_copy: "Copiar Link",
		dash_btn_load: "Cargar Skin",
		dash_btn_refresh: "Refrescar",
		dash_pagination_prev: "Anterior",
		dash_pagination_next: "Siguiente",
		dash_pagination_page: "Página {current} de {total}",
		dash_loading_shared: "Cargando historial compartido...",
		dash_error_shared: "Error al cargar el historial compartido: {error}",
		share_disclaimer: "Al compartir, tu creación se publicará en el historial del panel público visible para todos, y expirará y se eliminará automáticamente después de 1 semana.",
		arm_type: "Tipo de Brazos",
		arm_classic: "Classic (4px)",
		arm_slim: "Slim (3px)",
		opt_grid: "Rejilla",
		opt_rotate: "Rotar",
		btn_front_view: "Vista Frontal",
		template_shirt_title: "Plantilla Oficial Camisa (Shirt)",
		template_pants_title: "Plantilla Oficial Pantalón (Pants)",
		btn_download_shirt: "Descargar Camisa",
		btn_download_pants: "Descargar Pantalón",
		toast_skin_success: "¡Skin cargada y procesada con éxito!",
		toast_load_skin_for_roblox: "Carga una skin para poder exportar a Roblox.",
		toast_shirt_success: "¡Roblox Shirt (skinbridge_shirt.png) descargado con éxito!",
		toast_shirt_error: "Error al exportar Roblox Shirt: {error}",
		toast_pants_success: "¡Roblox Pants (skinbridge_pants.png) descargado con éxito!",
		toast_pants_error: "Error al exportar Roblox Pants: {error}",
		toast_bbmodel_success: "¡Modelo skinbridge_cabeza.bbmodel descargado!",
		toast_bbmodel_error: "Error al exportar .bbmodel: {error}",
		toast_bbmodel_load_skin: "Carga una skin para poder exportarla a Blockbench.",
		toast_glb_success: "¡Modelo skinbridge_cabeza.glb descargado!",
		toast_glb_error: "Error al exportar GLB: {error}",
		toast_load_skin_first: "Carga una skin para poder exportar.",
		toast_no_3d_model: "No hay modelo 3D para exportar.",
		toast_obj_success: "¡Archivos skinbridge_cabeza.obj, skinbridge_cabeza.mtl y skinbridge_textura.png descargados!",
		toast_obj_error: "Error al exportar OBJ: {error}",
		toast_fbx_success: "¡Modelo skinbridge_cabeza.fbx descargado!",
		toast_fbx_error: "Error al exportar FBX: {error}",
		err_not_png: "El archivo debe ser un formato de imagen PNG.",
		err_invalid_resolution: "La skin debe ser de resolución exacta 64x64 píxeles. (Detectado: {width}x{height})",
		err_invalid_image: "El archivo no es una imagen válida o está dañado.",
		err_read_error: "Ocurrió un error al leer el archivo.",
		err_generic: "Ocurrió un error.",
		ad_advertisement: "Publicidad",
		ad_sponsor_title: "Patrocinador Premium",
		ad_sponsor_desc: "Apoya nuestras herramientas gratuitas. ¡Haz clic para patrocinarnos!",
		mode_export: "Exportar Plantillas",
		mode_editor: "Editor de Skin",
		confirm_clear_layer: "¿Estás seguro de que deseas limpiar la capa seleccionada?",
		editor_tools: "Herramientas",
		tool_pencil: "Lápiz",
		tool_eraser: "Borrador",
		tool_fill: "Cubo",
		tool_picker: "Gotero",
		editor_history: "Historial",
		editor_layer: "Capa Activa",
		editor_color: "Color",
		editor_options: "Opciones",
		editor_mirror: "Simetría de Cara",
		editor_guides: "Guías de Cuerpo",
		editor_grid: "Cuadrícula",
		editor_clear: "Limpiar Capa",
		editing_part: "Editando",
		hover_to_identify: "Pasa el mouse sobre el lienzo para identificar la parte del cuerpo",
		btn_generate_relief: "Generar Relieve 3D",
		btn_generating_relief: "Generando Relieve...",
		toast_relief_success: "¡Relieve voxel 3D generado con éxito!",
		toast_relief_error: "Error al generar el relieve: {error}",
		relief_description: "Calcula automáticamente el relieve 3D a partir de los píxeles del overlay de tu skin. Los píxeles transparentes se omiten; los opacos se convierten en vóxeles elevados (flush o flotantes según cuánto difieran de la capa base).",
		relief_export_note: "Nota: Ahora OBJ, FBX, BBModel y GLB usan rutas separadas para exportar en modo clásico y con relieve. Cuando el relieve está activo, se usa la ruta específica de relieve.",
		toggle_relief_label: "Mostrar Relieve 3D",
		face_right: "Derecha",
		face_left: "Izquierda",
		face_top: "Superior",
		face_bottom: "Inferior",
		face_front: "Frontal",
		face_back: "Posterior",
		offset_gap: "Flotante",
		offset_flush: "Alineado"
	}
};
var I18nContext = createContext(void 0);
function I18nProvider({ children }) {
	const [language, setLanguageState] = useState(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("app_lang");
			if (saved === "en" || saved === "es") return saved;
			if (navigator.language?.split("-")[0] === "es") return "es";
		}
		return "en";
	});
	const setLanguage = (lang) => {
		setLanguageState(lang);
		if (typeof window !== "undefined") localStorage.setItem("app_lang", lang);
	};
	const t = (key, params) => {
		let val = (translations[language] || translations["en"])[key] || translations["en"][key] || key;
		if (params) Object.entries(params).forEach(([k, v]) => {
			val = val.replace(`{${k}}`, String(v));
		});
		return val;
	};
	return /* @__PURE__ */ jsx(I18nContext.Provider, {
		value: {
			language,
			setLanguage,
			t
		},
		children
	});
}
function useTranslation() {
	const context = useContext(I18nContext);
	if (!context) throw new Error("useTranslation must be used within an I18nProvider");
	return context;
}
var supabase = createClient("https://ekomnjcvedstogjnzfht.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrb21uamN2ZWRzdG9nam56Zmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwOTAyMDMsImV4cCI6MjA5NzY2NjIwM30.0l2A30Na2uBoj5Dvb4uA-q8ioun1kdE_Udeoo-HfZoU");
//#endregion
//#region src/components/DashboardView.tsx
var getBlockBar = (pct, length = 20) => {
	const filledCount = Math.round(pct / 100 * length);
	const emptyCount = Math.max(0, length - filledCount);
	return "█".repeat(filledCount) + "░".repeat(emptyCount);
};
function DashboardView({ stats, navigateToModule }) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const filteredActivity = stats.activity.filter((item) => item.actionKey !== "act_visit");
	const [history, setHistory] = useState([]);
	const [loadingHistory, setLoadingHistory] = useState(true);
	const [historyError, setHistoryError] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const [copiedSlug, setCopiedSlug] = useState(null);
	const ITEMS_PER_PAGE = 10;
	const fetchSharedHistory = async (page) => {
		setLoadingHistory(true);
		setHistoryError(null);
		try {
			const start = (page - 1) * ITEMS_PER_PAGE;
			const end = start + ITEMS_PER_PAGE - 1;
			const oneWeekAgo = (/* @__PURE__ */ new Date(Date.now() - 10080 * 60 * 1e3)).toISOString();
			const { data, error: fetchErr, count } = await supabase.from("shares_all").select("*", { count: "exact" }).gte("created_at", oneWeekAgo).order("created_at", { ascending: false }).range(start, end);
			if (fetchErr) throw fetchErr;
			setHistory((data || []).map((row) => ({
				slug: row.slug,
				type: row.type,
				creatorName: row.creator_name || "Anonymous",
				description: row.description,
				previewUrl: row.preview_url,
				skinUrl: row.skin_url,
				createdAt: row.created_at
			})));
			setTotalCount(count || 0);
		} catch (err) {
			console.error("Error fetching shared history:", err);
			setHistoryError(err.message || "Failed to load shared history");
		} finally {
			setLoadingHistory(false);
		}
	};
	useEffect(() => {
		fetchSharedHistory(currentPage);
	}, [currentPage]);
	const handleCopyLink = (type, slug) => {
		const url = `${window.location.origin}/share/${type}/${slug}`;
		navigator.clipboard.writeText(url);
		setCopiedSlug(slug);
		setTimeout(() => setCopiedSlug(null), 2e3);
	};
	const handleLoadSkin = (type, skinUrl) => {
		navigate(`/${type}?skinUrl=${encodeURIComponent(skinUrl)}`);
	};
	return /* @__PURE__ */ jsxs("section", {
		className: "dashboard-container",
		style: {
			display: "flex",
			flexDirection: "column",
			gap: "32px",
			width: "100%",
			boxSizing: "border-box"
		},
		children: [
			/* @__PURE__ */ jsxs(Head, { children: [
				/* @__PURE__ */ jsx("title", { children: "SkinBridge | Minecraft Skin to Roblox Converter & 3D Head Exporter" }),
				/* @__PURE__ */ jsx("meta", {
					name: "description",
					content: "Convert Minecraft skins to 3D blocky models and Roblox clothing templates in real-time. Export bbmodel to OBJ/FBX and view your skins dynamically."
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:title",
					content: "SkinBridge | Minecraft Skin to Roblox Converter"
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:description",
					content: "Convert Minecraft skins to 3D blocky models and Roblox clothing templates in real-time."
				}),
				/* @__PURE__ */ jsx("link", {
					rel: "canonical",
					href: "https://skinbridge.vercel.app/"
				})
			] }),
			/* @__PURE__ */ jsxs("div", {
				className: "glass-panel",
				style: {
					padding: "24px",
					display: "flex",
					flexDirection: "column",
					gap: "8px",
					background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(129, 140, 248, 0.05) 100%)"
				},
				children: [/* @__PURE__ */ jsx("h2", {
					style: {
						fontSize: "1.75rem",
						fontWeight: 800,
						margin: 0,
						background: "linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent"
					},
					children: t("dash_welcome")
				}), /* @__PURE__ */ jsx("p", {
					style: {
						margin: 0,
						color: "#a1a1aa",
						fontSize: "0.95rem",
						lineHeight: "1.5",
						maxWidth: "700px"
					},
					children: t("dash_subtitle")
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
					gap: "24px"
				},
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "glass-panel workspace-card",
						style: {
							padding: "24px",
							display: "flex",
							flexDirection: "column",
							gap: "16px"
						},
						children: [
							/* @__PURE__ */ jsxs("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: "12px"
								},
								children: [/* @__PURE__ */ jsx("div", {
									style: {
										background: "rgba(99, 102, 241, 0.15)",
										padding: "10px",
										borderRadius: "10px",
										display: "flex",
										alignItems: "center",
										justifyContent: "center"
									},
									children: /* @__PURE__ */ jsx(Box, {
										size: 24,
										style: { color: "#818cf8" }
									})
								}), /* @__PURE__ */ jsx("h3", {
									style: {
										fontSize: "1.25rem",
										fontWeight: 700,
										margin: 0
									},
									children: t("dash_head3d_title")
								})]
							}),
							/* @__PURE__ */ jsx("p", {
								style: {
									margin: 0,
									color: "#a1a1aa",
									fontSize: "0.875rem",
									lineHeight: "1.5",
									flexGrow: 1
								},
								children: t("dash_head3d_desc")
							}),
							/* @__PURE__ */ jsx("button", {
								className: "glow-btn",
								onClick: () => navigateToModule("head3d"),
								style: {
									padding: "10px 16px",
									fontSize: "0.9rem"
								},
								children: t("dash_launch_workspace")
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "glass-panel workspace-card",
						style: {
							padding: "24px",
							display: "flex",
							flexDirection: "column",
							gap: "16px"
						},
						children: [
							/* @__PURE__ */ jsxs("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: "12px"
								},
								children: [/* @__PURE__ */ jsx("div", {
									style: {
										background: "rgba(239, 68, 68, 0.15)",
										padding: "10px",
										borderRadius: "10px",
										display: "flex",
										alignItems: "center",
										justifyContent: "center"
									},
									children: /* @__PURE__ */ jsxs("svg", {
										viewBox: "0 0 24 24",
										width: "24",
										height: "24",
										stroke: "#f87171",
										strokeWidth: "2",
										fill: "none",
										strokeLinecap: "round",
										strokeLinejoin: "round",
										style: { display: "block" },
										children: [
											/* @__PURE__ */ jsx("path", { d: "M20.37 8.91l-8.17-4.08a1 1 0 0 0-.9 0L3.13 8.91a1 1 0 0 0 0 1.78l8.17 4.08a1 1 0 0 0 .9 0l8.17-4.08a1 1 0 0 0 0-1.78z" }),
											/* @__PURE__ */ jsx("path", { d: "M12 14.88V21" }),
											/* @__PURE__ */ jsx("path", { d: "M3.13 14.91L12 19.34l8.87-4.43" })
										]
									})
								}), /* @__PURE__ */ jsx("h3", {
									style: {
										fontSize: "1.25rem",
										fontWeight: 700,
										margin: 0
									},
									children: t("dash_roblox_title")
								})]
							}),
							/* @__PURE__ */ jsx("p", {
								style: {
									margin: 0,
									color: "#a1a1aa",
									fontSize: "0.875rem",
									lineHeight: "1.5",
									flexGrow: 1
								},
								children: t("dash_roblox_desc")
							}),
							/* @__PURE__ */ jsx("button", {
								className: "glow-btn-roblox",
								onClick: () => navigateToModule("roblox"),
								style: {
									padding: "10px 16px",
									fontSize: "0.9rem"
								},
								children: t("dash_launch_workspace")
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "glass-panel workspace-card",
						style: {
							padding: "24px",
							display: "flex",
							flexDirection: "column",
							gap: "16px"
						},
						children: [
							/* @__PURE__ */ jsxs("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: "12px"
								},
								children: [/* @__PURE__ */ jsx("div", {
									style: {
										background: "rgba(52, 211, 153, 0.15)",
										padding: "10px",
										borderRadius: "10px",
										display: "flex",
										alignItems: "center",
										justifyContent: "center"
									},
									children: /* @__PURE__ */ jsxs("svg", {
										viewBox: "0 0 24 24",
										width: "24",
										height: "24",
										stroke: "#34d399",
										strokeWidth: "2",
										fill: "none",
										strokeLinecap: "round",
										strokeLinejoin: "round",
										style: { display: "block" },
										children: [
											/* @__PURE__ */ jsx("polygon", { points: "12 2 2 7 12 12 22 7 12 2" }),
											/* @__PURE__ */ jsx("polyline", { points: "2 17 12 22 22 17" }),
											/* @__PURE__ */ jsx("polyline", { points: "2 12 12 17 22 12" })
										]
									})
								}), /* @__PURE__ */ jsx("h3", {
									style: {
										fontSize: "1.25rem",
										fontWeight: 700,
										margin: 0
									},
									children: t("dash_blockbench_title")
								})]
							}),
							/* @__PURE__ */ jsx("p", {
								style: {
									margin: 0,
									color: "#a1a1aa",
									fontSize: "0.875rem",
									lineHeight: "1.5",
									flexGrow: 1
								},
								children: t("dash_blockbench_desc")
							}),
							/* @__PURE__ */ jsx("button", {
								className: "glow-btn",
								onClick: () => navigateToModule("blockbench"),
								style: {
									padding: "10px 16px",
									fontSize: "0.9rem",
									background: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
									boxShadow: "0 0 15px rgba(52, 211, 153, 0.3)"
								},
								children: t("dash_launch_workspace")
							})
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "glass-panel",
				style: {
					padding: "24px",
					display: "flex",
					flexDirection: "column",
					gap: "20px"
				},
				children: [
					/* @__PURE__ */ jsxs("h3", {
						style: {
							fontSize: "1.2rem",
							fontWeight: 700,
							margin: 0,
							display: "flex",
							alignItems: "center",
							gap: "8px"
						},
						children: [/* @__PURE__ */ jsxs("svg", {
							viewBox: "0 0 24 24",
							width: "20",
							height: "20",
							stroke: "#818cf8",
							strokeWidth: "2",
							fill: "none",
							strokeLinecap: "round",
							strokeLinejoin: "round",
							children: [
								/* @__PURE__ */ jsx("line", {
									x1: "18",
									y1: "20",
									x2: "18",
									y2: "10"
								}),
								/* @__PURE__ */ jsx("line", {
									x1: "12",
									y1: "20",
									x2: "12",
									y2: "4"
								}),
								/* @__PURE__ */ jsx("line", {
									x1: "6",
									y1: "20",
									x2: "6",
									y2: "14"
								})
							]
						}), t("dash_stats_title")]
					}),
					/* @__PURE__ */ jsxs("div", {
						style: {
							display: "grid",
							gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
							gap: "16px"
						},
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "kpi-card",
								children: [/* @__PURE__ */ jsx("span", {
									className: "voxel-caption",
									children: t("dash_stat_conversions")
								}), /* @__PURE__ */ jsx("span", {
									style: {
										fontSize: "1.75rem",
										fontWeight: 800
									},
									children: stats.conversions
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "kpi-card",
								children: [/* @__PURE__ */ jsx("span", {
									className: "voxel-caption",
									children: t("dash_stat_exports")
								}), /* @__PURE__ */ jsx("span", {
									style: {
										fontSize: "1.75rem",
										fontWeight: 800
									},
									children: stats.exports
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "kpi-card",
								children: [/* @__PURE__ */ jsx("span", {
									className: "voxel-caption",
									children: t("dash_stat_favorite")
								}), /* @__PURE__ */ jsx("span", {
									style: {
										fontSize: "1.25rem",
										fontWeight: 700,
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap"
									},
									children: (() => {
										const sorted = Object.entries(stats.formats).sort((a, b) => b[1] - a[1]);
										return sorted[0] && sorted[0][1] > 0 ? sorted[0][0] : "N/A";
									})()
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "kpi-card",
								children: [/* @__PURE__ */ jsx("span", {
									className: "voxel-caption",
									children: t("dash_stat_favorite_tool")
								}), /* @__PURE__ */ jsx("span", {
									style: {
										fontSize: "1.1rem",
										fontWeight: 700,
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap"
									},
									children: (() => {
										const headVal = stats.headUsage || 0;
										const robloxVal = stats.robloxUsage || 0;
										const bbVal = stats.blockbenchUsage || 0;
										const maxVal = Math.max(headVal, robloxVal, bbVal);
										if (maxVal === 0) return "N/A";
										if (maxVal === bbVal) return t("nav_blockbench");
										if (maxVal === headVal) return t("module_3d_head");
										return t("module_roblox");
									})()
								})]
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						style: {
							display: "grid",
							gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
							gap: "24px",
							marginTop: "12px"
						},
						children: [/* @__PURE__ */ jsxs("div", {
							style: {
								background: "rgba(255,255,255,0.01)",
								border: "1px solid rgba(255,255,255,0.03)",
								borderRadius: "12px",
								padding: "20px",
								display: "flex",
								flexDirection: "column",
								gap: "16px"
							},
							children: [/* @__PURE__ */ jsx("h4", {
								className: "voxel-caption",
								style: { margin: 0 },
								children: t("dash_stat_favorite_tool")
							}), /* @__PURE__ */ jsx("div", {
								style: {
									display: "flex",
									flexDirection: "column",
									gap: "12px",
									justifyContent: "center",
									minHeight: "140px",
									height: "auto",
									fontFamily: "monospace",
									fontSize: "0.8rem"
								},
								children: (() => {
									const headCount = stats.headUsage || 0;
									const robloxCount = stats.robloxUsage || 0;
									const bbCount = stats.blockbenchUsage || 0;
									const total = headCount + robloxCount + bbCount;
									const headPct = total > 0 ? Math.round(headCount / total * 100) : 0;
									const robloxPct = total > 0 ? Math.round(robloxCount / total * 100) : 0;
									const bbPct = total > 0 ? Math.round(bbCount / total * 100) : 0;
									return /* @__PURE__ */ jsxs(Fragment, { children: [
										/* @__PURE__ */ jsxs("div", {
											style: {
												display: "flex",
												flexDirection: "column",
												gap: "4px"
											},
											children: [/* @__PURE__ */ jsxs("div", {
												style: {
													display: "flex",
													justifyContent: "space-between",
													color: "#f4f4f5"
												},
												children: [/* @__PURE__ */ jsx("span", { children: t("module_3d_head") }), /* @__PURE__ */ jsxs("span", {
													style: {
														color: "#8b5cf6",
														fontWeight: "bold"
													},
													children: [
														headPct,
														"% (",
														headCount,
														")"
													]
												})]
											}), /* @__PURE__ */ jsxs("div", {
												style: {
													color: "#8b5cf6",
													letterSpacing: "2px",
													fontSize: "1rem",
													userSelect: "none"
												},
												children: [
													"[",
													getBlockBar(headPct, 20),
													"]"
												]
											})]
										}),
										/* @__PURE__ */ jsxs("div", {
											style: {
												display: "flex",
												flexDirection: "column",
												gap: "4px"
											},
											children: [/* @__PURE__ */ jsxs("div", {
												style: {
													display: "flex",
													justifyContent: "space-between",
													color: "#f4f4f5"
												},
												children: [/* @__PURE__ */ jsx("span", { children: t("module_roblox") }), /* @__PURE__ */ jsxs("span", {
													style: {
														color: "#ef4444",
														fontWeight: "bold"
													},
													children: [
														robloxPct,
														"% (",
														robloxCount,
														")"
													]
												})]
											}), /* @__PURE__ */ jsxs("div", {
												style: {
													color: "#ef4444",
													letterSpacing: "2px",
													fontSize: "1rem",
													userSelect: "none"
												},
												children: [
													"[",
													getBlockBar(robloxPct, 20),
													"]"
												]
											})]
										}),
										/* @__PURE__ */ jsxs("div", {
											style: {
												display: "flex",
												flexDirection: "column",
												gap: "4px"
											},
											children: [/* @__PURE__ */ jsxs("div", {
												style: {
													display: "flex",
													justifyContent: "space-between",
													color: "#f4f4f5"
												},
												children: [/* @__PURE__ */ jsx("span", { children: t("nav_blockbench") }), /* @__PURE__ */ jsxs("span", {
													style: {
														color: "#10b981",
														fontWeight: "bold"
													},
													children: [
														bbPct,
														"% (",
														bbCount,
														")"
													]
												})]
											}), /* @__PURE__ */ jsxs("div", {
												style: {
													color: "#10b981",
													letterSpacing: "2px",
													fontSize: "1rem",
													userSelect: "none"
												},
												children: [
													"[",
													getBlockBar(bbPct, 20),
													"]"
												]
											})]
										})
									] });
								})()
							})]
						}), /* @__PURE__ */ jsxs("div", {
							style: {
								background: "rgba(255,255,255,0.01)",
								border: "1px solid rgba(255,255,255,0.03)",
								borderRadius: "12px",
								padding: "20px",
								display: "flex",
								flexDirection: "column",
								gap: "16px"
							},
							children: [/* @__PURE__ */ jsx("h4", {
								className: "voxel-caption",
								style: { margin: 0 },
								children: t("dash_stat_favorite")
							}), /* @__PURE__ */ jsx("div", {
								style: {
									display: "flex",
									flexDirection: "column",
									gap: "12px",
									justifyContent: "center",
									minHeight: "140px",
									height: "auto",
									fontFamily: "monospace",
									fontSize: "0.8rem"
								},
								children: (() => {
									const formats = [
										"GLB",
										"BBMODEL",
										"Shirt",
										"Pants",
										"OBJ",
										"FBX"
									];
									const maxVal = Math.max(...formats.map((f) => stats.formats[f] || 0), 1);
									if (formats.reduce((s, f) => s + (stats.formats[f] || 0), 0) === 0) return /* @__PURE__ */ jsx("p", {
										style: {
											color: "#71717a",
											textAlign: "center",
											margin: 0
										},
										children: "NO DATA RECORDED"
									});
									return formats.map((f) => {
										const val = stats.formats[f] || 0;
										const pct = Math.round(val / maxVal * 100);
										const color = f === "Shirt" || f === "Pants" ? "#ef4444" : f === "OBJ" || f === "FBX" ? "#10b981" : "#8b5cf6";
										return /* @__PURE__ */ jsxs("div", {
											style: {
												display: "flex",
												flexDirection: "column",
												gap: "2px"
											},
											children: [/* @__PURE__ */ jsxs("div", {
												style: {
													display: "flex",
													justifyContent: "space-between",
													color: "#f4f4f5"
												},
												children: [/* @__PURE__ */ jsx("span", { children: f }), /* @__PURE__ */ jsxs("span", {
													style: {
														color,
														fontWeight: "bold"
													},
													children: [
														val,
														" units (",
														pct,
														"%)"
													]
												})]
											}), /* @__PURE__ */ jsxs("div", {
												style: {
													color,
													letterSpacing: "1px",
													userSelect: "none"
												},
												children: [
													"[",
													getBlockBar(pct, 24),
													"]"
												]
											})]
										}, f);
									});
								})()
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "glass-panel",
				style: {
					padding: "24px",
					display: "flex",
					flexDirection: "column",
					gap: "16px"
				},
				children: [/* @__PURE__ */ jsxs("h3", {
					style: {
						fontSize: "1.2rem",
						fontWeight: 700,
						margin: 0,
						display: "flex",
						alignItems: "center",
						gap: "8px"
					},
					children: [/* @__PURE__ */ jsxs("svg", {
						viewBox: "0 0 24 24",
						width: "20",
						height: "20",
						stroke: "#818cf8",
						strokeWidth: "2",
						fill: "none",
						strokeLinecap: "round",
						strokeLinejoin: "round",
						children: [/* @__PURE__ */ jsx("circle", {
							cx: "12",
							cy: "12",
							r: "10"
						}), /* @__PURE__ */ jsx("polyline", { points: "12 6 12 12 16 14" })]
					}), t("dash_recent_activity")]
				}), filteredActivity.length === 0 ? /* @__PURE__ */ jsx("p", {
					style: {
						margin: 0,
						color: "#71717a",
						fontSize: "0.9rem",
						textAlign: "center",
						padding: "24px 0"
					},
					children: t("dash_no_activity")
				}) : /* @__PURE__ */ jsx("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: "12px"
					},
					children: filteredActivity.map((item) => {
						let badgeBg = "rgba(99, 102, 241, 0.1)";
						let badgeText = "#818cf8";
						let iconStr = "⚡";
						if (item.actionKey === "act_export") {
							badgeBg = "rgba(16, 185, 129, 0.1)";
							badgeText = "#34d399";
							iconStr = "⬇️";
						} else if (item.actionKey === "act_visit") {
							badgeBg = "rgba(245, 158, 11, 0.1)";
							badgeText = "#fbbf24";
							iconStr = "📂";
						}
						const timeStr = new Date(item.timestamp).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit"
						});
						return /* @__PURE__ */ jsxs("div", {
							className: "activity-item",
							children: [/* @__PURE__ */ jsxs("div", {
								style: {
									background: badgeBg,
									color: badgeText,
									padding: "6px 10px",
									borderRadius: "6px",
									fontSize: "0.8rem",
									display: "flex",
									alignItems: "center",
									gap: "6px",
									fontWeight: 600
								},
								children: [/* @__PURE__ */ jsx("span", { children: iconStr }), /* @__PURE__ */ jsx("span", { children: item.actionKey === "act_upload" ? t("act_upload", { name: item.details }) : item.actionKey === "act_export" ? t("act_export", {
									format: item.details.split(".").pop()?.toUpperCase() || "FILE",
									name: item.details
								}) : t("act_visit", { tool: item.details }) })]
							}), /* @__PURE__ */ jsx("span", {
								style: {
									marginLeft: "auto",
									fontSize: "0.8rem",
									color: "#71717a"
								},
								children: timeStr
							})]
						}, item.id);
					})
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "glass-panel",
				style: {
					padding: "24px",
					display: "flex",
					flexDirection: "column",
					gap: "20px"
				},
				children: [/* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						flexWrap: "wrap",
						gap: "12px"
					},
					children: [/* @__PURE__ */ jsxs("h3", {
						style: {
							fontSize: "1.2rem",
							fontWeight: 700,
							margin: 0,
							display: "flex",
							alignItems: "center",
							gap: "8px"
						},
						children: [/* @__PURE__ */ jsxs("svg", {
							viewBox: "0 0 24 24",
							width: "20",
							height: "20",
							stroke: "#818cf8",
							strokeWidth: "2",
							fill: "none",
							strokeLinecap: "round",
							strokeLinejoin: "round",
							children: [
								/* @__PURE__ */ jsx("path", { d: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" }),
								/* @__PURE__ */ jsx("polyline", { points: "16 6 12 2 8 6" }),
								/* @__PURE__ */ jsx("line", {
									x1: "12",
									y1: "2",
									x2: "12",
									y2: "15"
								})
							]
						}), t("dash_shared_history")]
					}), /* @__PURE__ */ jsxs("button", {
						className: "glow-btn-secondary",
						onClick: () => fetchSharedHistory(currentPage),
						disabled: loadingHistory,
						style: {
							display: "flex",
							alignItems: "center",
							gap: "6px",
							padding: "6px 12px",
							fontSize: "0.8rem"
						},
						children: [/* @__PURE__ */ jsx(RefreshCw, {
							size: 14,
							style: { animation: loadingHistory ? "spin 1.5s linear infinite" : "none" }
						}), t("dash_btn_refresh")]
					})]
				}), loadingHistory ? /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: "40px 0",
						gap: "12px"
					},
					children: [/* @__PURE__ */ jsx("div", { style: {
						width: "32px",
						height: "32px",
						borderRadius: "50%",
						border: "3px solid rgba(129, 140, 248, 0.2)",
						borderTopColor: "#818cf8",
						animation: "spin 1s linear infinite"
					} }), /* @__PURE__ */ jsx("p", {
						style: {
							margin: 0,
							color: "#a1a1aa",
							fontSize: "0.9rem"
						},
						children: t("dash_loading_shared")
					})]
				}) : historyError ? /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: "30px 0",
						gap: "12px",
						color: "#f87171"
					},
					children: [/* @__PURE__ */ jsx("p", {
						style: {
							margin: 0,
							fontSize: "0.9rem"
						},
						children: t("dash_error_shared").replace("{error}", historyError)
					}), /* @__PURE__ */ jsx("button", {
						className: "glow-btn-secondary",
						style: { padding: "8px 16px" },
						onClick: () => fetchSharedHistory(currentPage),
						children: t("dash_btn_refresh")
					})]
				}) : history.length === 0 ? /* @__PURE__ */ jsx("p", {
					style: {
						margin: 0,
						color: "#71717a",
						fontSize: "0.9rem",
						textAlign: "center",
						padding: "24px 0"
					},
					children: t("dash_no_shared")
				}) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", {
					style: {
						display: "grid",
						gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
						gap: "16px"
					},
					children: history.map((item) => /* @__PURE__ */ jsxs("div", {
						className: "glass-panel",
						style: {
							padding: "16px",
							display: "flex",
							gap: "12px",
							background: "rgba(255, 255, 255, 0.01)",
							border: "1px solid rgba(255, 255, 255, 0.05)",
							borderRadius: "8px",
							alignItems: "center"
						},
						children: [/* @__PURE__ */ jsx("div", {
							style: {
								width: "64px",
								height: "64px",
								borderRadius: "6px",
								background: "#0c0c0e",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								overflow: "hidden",
								border: "1px solid rgba(255,255,255,0.05)",
								flexShrink: 0
							},
							children: item.previewUrl ? /* @__PURE__ */ jsx("img", {
								src: item.previewUrl,
								alt: "Thumbnail",
								style: {
									width: "100%",
									height: "100%",
									objectFit: "contain",
									imageRendering: "pixelated"
								}
							}) : /* @__PURE__ */ jsx(Box, {
								size: 24,
								style: { color: "#52525b" }
							})
						}), /* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								flexDirection: "column",
								gap: "4px",
								flexGrow: 1,
								minWidth: 0
							},
							children: [
								/* @__PURE__ */ jsx("div", {
									style: {
										display: "flex",
										justifyItems: "center",
										gap: "6px",
										flexWrap: "wrap"
									},
									children: /* @__PURE__ */ jsx("span", {
										className: "badge",
										style: {
											fontSize: "0.65rem",
											padding: "2px 6px",
											background: item.type === "roblox" ? "rgba(239, 68, 68, 0.15)" : "rgba(99, 102, 241, 0.15)",
											color: item.type === "roblox" ? "#f87171" : "#818cf8"
										},
										children: item.type === "roblox" ? "Roblox" : "3D Head"
									})
								}),
								/* @__PURE__ */ jsx("h4", {
									style: {
										margin: "4px 0 0 0",
										fontSize: "0.9rem",
										fontWeight: 700,
										color: "#f3f4f6",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap"
									},
									children: item.creatorName
								}),
								/* @__PURE__ */ jsx("p", {
									style: {
										margin: 0,
										fontSize: "0.8rem",
										color: "#9ca3af",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap"
									},
									children: item.description || "No description"
								}),
								/* @__PURE__ */ jsxs("div", {
									style: {
										display: "flex",
										gap: "8px",
										marginTop: "6px"
									},
									children: [
										/* @__PURE__ */ jsx("a", {
											href: `/share/${item.type}/${item.slug}`,
											target: "_blank",
											rel: "noopener noreferrer",
											style: {
												color: "#818cf8",
												textDecoration: "none",
												fontSize: "0.75rem",
												fontWeight: 600,
												display: "flex",
												alignItems: "center",
												gap: "2px",
												cursor: "pointer"
											},
											children: t("dash_btn_view")
										}),
										/* @__PURE__ */ jsx("button", {
											onClick: () => handleCopyLink(item.type, item.slug),
											style: {
												background: "transparent",
												border: "none",
												padding: 0,
												color: "#34d399",
												fontSize: "0.75rem",
												fontWeight: 600,
												cursor: "pointer",
												outline: "none"
											},
											children: copiedSlug === item.slug ? t("share_copied") : t("dash_btn_copy")
										}),
										item.skinUrl && /* @__PURE__ */ jsx("button", {
											onClick: () => handleLoadSkin(item.type, item.skinUrl),
											style: {
												background: "transparent",
												border: "none",
												padding: 0,
												color: "#fbbf24",
												fontSize: "0.75rem",
												fontWeight: 600,
												cursor: "pointer",
												outline: "none"
											},
											children: t("dash_btn_load")
										})
									]
								})
							]
						})]
					}, item.slug))
				}), totalCount > ITEMS_PER_PAGE && /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						gap: "16px",
						marginTop: "24px",
						borderTop: "1px solid rgba(255,255,255,0.05)",
						paddingTop: "16px"
					},
					children: [
						/* @__PURE__ */ jsxs("button", {
							className: "glow-btn-secondary",
							disabled: currentPage === 1,
							onClick: () => setCurrentPage((prev) => Math.max(1, prev - 1)),
							style: {
								display: "flex",
								alignItems: "center",
								gap: "4px",
								padding: "6px 12px",
								fontSize: "0.8rem"
							},
							children: [/* @__PURE__ */ jsx(ChevronLeft, { size: 14 }), t("dash_pagination_prev")]
						}),
						/* @__PURE__ */ jsx("span", {
							style: {
								fontSize: "0.8rem",
								color: "#a1a1aa",
								fontWeight: 600
							},
							children: t("dash_pagination_page").replace("{current}", currentPage.toString()).replace("{total}", Math.ceil(totalCount / ITEMS_PER_PAGE).toString())
						}),
						/* @__PURE__ */ jsxs("button", {
							className: "glow-btn-secondary",
							disabled: currentPage >= Math.ceil(totalCount / ITEMS_PER_PAGE),
							onClick: () => setCurrentPage((prev) => prev + 1),
							style: {
								display: "flex",
								alignItems: "center",
								gap: "4px",
								padding: "6px 12px",
								fontSize: "0.8rem"
							},
							children: [t("dash_pagination_next"), /* @__PURE__ */ jsx(ChevronRight, { size: 14 })]
						})
					]
				})] })]
			})
		]
	});
}
//#endregion
//#region src/components/LoadingSkeleton.tsx
function LoadingSkeleton() {
	return /* @__PURE__ */ jsx("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
			minHeight: "60vh",
			width: "100%",
			gap: "16px"
		},
		children: /* @__PURE__ */ jsxs("div", {
			className: "glass-panel",
			style: {
				padding: "40px",
				borderRadius: "24px",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "20px",
				background: "rgba(15, 15, 20, 0.8)",
				border: "1px solid rgba(99, 102, 241, 0.15)",
				boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.4)"
			},
			children: [/* @__PURE__ */ jsx(Loader2, {
				size: 48,
				style: {
					color: "#818cf8",
					animation: "spin 1s linear infinite"
				}
			}), /* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "8px"
				},
				children: [/* @__PURE__ */ jsx("h3", {
					style: {
						margin: 0,
						fontSize: "1.1rem",
						fontWeight: 700,
						color: "#e4e4e7"
					},
					children: "Loading Workspace..."
				}), /* @__PURE__ */ jsx("p", {
					style: {
						margin: 0,
						fontSize: "0.8rem",
						color: "#71717a"
					},
					children: "Preparing 3D environment and tools"
				})]
			})]
		})
	});
}
//#endregion
//#region src/components/ErrorBoundary.tsx
var ErrorBoundary = class extends Component {
	state = {
		hasError: false,
		error: null
	};
	static getDerivedStateFromError(error) {
		return {
			hasError: true,
			error
		};
	}
	componentDidCatch(error, errorInfo) {
		console.error("Uncaught error in workspaces:", error, errorInfo);
	}
	render() {
		if (this.state.hasError) return /* @__PURE__ */ jsx("main", {
			className: "main-grid",
			style: { gridTemplateColumns: "1fr" },
			children: /* @__PURE__ */ jsxs("section", {
				className: "glass-panel",
				style: {
					padding: "32px",
					margin: "20px",
					display: "flex",
					flexDirection: "column",
					gap: "16px",
					border: "1px solid rgba(239, 68, 68, 0.2)"
				},
				children: [
					/* @__PURE__ */ jsx("h2", {
						style: {
							margin: 0,
							fontSize: "1.4rem",
							fontWeight: 700,
							color: "#f87171"
						},
						children: "⚠️ Error de Renderizado en Workspace"
					}),
					/* @__PURE__ */ jsx("p", {
						style: {
							margin: 0,
							fontSize: "0.9rem",
							color: "#9ca3af",
							lineHeight: "1.5"
						},
						children: "Se ha producido una excepción crítica al renderizar el componente. A continuación se detallan los datos técnicos del error:"
					}),
					/* @__PURE__ */ jsx("pre", {
						style: {
							background: "rgba(0,0,0,0.4)",
							padding: "16px",
							borderRadius: "8px",
							overflowX: "auto",
							fontSize: "0.8rem",
							fontFamily: "monospace",
							color: "#fca5a5",
							border: "1px solid rgba(255, 255, 255, 0.05)",
							whiteSpace: "pre-wrap"
						},
						children: this.state.error?.stack || this.state.error?.message
					}),
					/* @__PURE__ */ jsx("button", {
						className: "glow-btn",
						onClick: () => window.location.reload(),
						style: {
							alignSelf: "flex-start",
							padding: "10px 20px",
							background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
							boxShadow: "0 0 15px rgba(239, 68, 68, 0.3)"
						},
						children: "Recargar Aplicación"
					})
				]
			})
		});
		return this.props.children;
	}
};
//#endregion
//#region src/App.tsx
var Head3DWorkspace = lazy(() => import("./assets/Head3DWorkspace-BpcNVwzO.js"));
var RobloxWorkspace = lazy(() => import("./assets/RobloxWorkspace-BrAf5j-v.js"));
var BlockbenchWorkspace = lazy(() => import("./assets/BlockbenchWorkspace-BT-THCU3.js"));
var ShareRobloxPage = lazy(() => import("./assets/ShareRobloxPage-BqrZsEK_.js"));
var ShareHead3dPage = lazy(() => import("./assets/ShareHead3dPage-BARK7EG4.js"));
var GalleryPage = lazy(() => import("./assets/GalleryPage-BtDG_Qtq.js"));
function generateSteveSkin() {
	const canvas = document.createElement("canvas");
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext("2d");
	if (!ctx) return new Image();
	ctx.clearRect(0, 0, 64, 64);
	const fillRect = (x, y, w, h, color) => {
		ctx.fillStyle = color;
		ctx.fillRect(x, y, w, h);
	};
	const hair = "#563e26";
	const skin = "#e4a07a";
	const darkSkin = "#c68461";
	const eyeWhite = "#ffffff";
	const eyeBlue = "#4646b5";
	const nose = "#b6724d";
	const mouth = "#5c2214";
	fillRect(8, 0, 8, 8, hair);
	fillRect(16, 0, 8, 8, darkSkin);
	fillRect(0, 8, 8, 3, hair);
	fillRect(0, 11, 8, 5, skin);
	fillRect(0, 11, 2, 2, hair);
	fillRect(6, 11, 2, 2, hair);
	fillRect(8, 8, 8, 8, skin);
	fillRect(8, 8, 8, 2, hair);
	fillRect(8, 10, 1, 1, hair);
	fillRect(15, 10, 1, 1, hair);
	fillRect(9, 12, 1, 1, eyeWhite);
	fillRect(10, 12, 1, 1, eyeBlue);
	fillRect(13, 12, 1, 1, eyeBlue);
	fillRect(14, 12, 1, 1, eyeWhite);
	fillRect(11, 13, 2, 1, nose);
	fillRect(10, 14, 4, 1, mouth);
	fillRect(16, 8, 8, 3, hair);
	fillRect(16, 11, 8, 5, skin);
	fillRect(16, 11, 2, 2, hair);
	fillRect(22, 11, 2, 2, hair);
	fillRect(24, 8, 8, 8, hair);
	const gold = "#eeb609";
	const goldLight = "#ffd54f";
	const ruby = "#e11d48";
	fillRect(40, 13, 8, 3, gold);
	fillRect(40, 12, 1, 1, gold);
	fillRect(42, 12, 1, 1, gold);
	fillRect(43, 11, 2, 1, gold);
	fillRect(43, 12, 2, 1, ruby);
	fillRect(45, 12, 1, 1, gold);
	fillRect(47, 12, 1, 1, gold);
	fillRect(41, 13, 1, 1, goldLight);
	fillRect(46, 13, 1, 1, goldLight);
	fillRect(48, 13, 8, 3, gold);
	fillRect(48, 12, 1, 1, gold);
	fillRect(51, 12, 2, 1, gold);
	fillRect(55, 12, 1, 1, gold);
	fillRect(32, 13, 8, 3, gold);
	fillRect(32, 12, 1, 1, gold);
	fillRect(35, 12, 2, 1, gold);
	fillRect(39, 12, 1, 1, gold);
	fillRect(56, 13, 8, 3, gold);
	const img = new Image();
	img.src = canvas.toDataURL("image/png");
	return img;
}
function AppLayout() {
	return /* @__PURE__ */ jsx(I18nProvider, { children: /* @__PURE__ */ jsx(Outlet, {}) });
}
var routes = [{
	path: "/",
	element: /* @__PURE__ */ jsx(AppLayout, {}),
	children: [
		{
			path: "",
			element: /* @__PURE__ */ jsx(AppContent, { activeTab: "dashboard" })
		},
		{
			path: "dashboard",
			element: /* @__PURE__ */ jsx(AppContent, { activeTab: "dashboard" })
		},
		{
			path: "head3d",
			element: /* @__PURE__ */ jsx(AppContent, { activeTab: "head3d" })
		},
		{
			path: "roblox",
			element: /* @__PURE__ */ jsx(AppContent, { activeTab: "roblox" })
		},
		{
			path: "blockbench",
			element: /* @__PURE__ */ jsx(AppContent, { activeTab: "blockbench" })
		},
		{
			path: "gallery",
			element: /* @__PURE__ */ jsx(Suspense, {
				fallback: /* @__PURE__ */ jsx(LoadingSkeleton, {}),
				children: /* @__PURE__ */ jsx(GalleryPage, {})
			})
		},
		{
			path: "share/roblox/:slug",
			element: /* @__PURE__ */ jsx(Suspense, {
				fallback: /* @__PURE__ */ jsx(LoadingSkeleton, {}),
				children: /* @__PURE__ */ jsx(ShareRobloxPage, {})
			})
		},
		{
			path: "share/head3d/:slug",
			element: /* @__PURE__ */ jsx(Suspense, {
				fallback: /* @__PURE__ */ jsx(LoadingSkeleton, {}),
				children: /* @__PURE__ */ jsx(ShareHead3dPage, {})
			})
		},
		{
			path: "*",
			element: /* @__PURE__ */ jsx(Navigate, {
				to: "/",
				replace: true
			})
		}
	]
}];
function AppContent({ activeTab }) {
	const { t, language, setLanguage } = useTranslation();
	const navigate = useNavigate();
	const [skinImage, setSkinImage] = useState(null);
	const [skinSrc, setSkinSrc] = useState("");
	const [extractedFaces, setExtractedFaces] = useState(null);
	const [dragActive, setDragActive] = useState(false);
	const [activeModule, setActiveModule] = useState(activeTab);
	useEffect(() => {
		setActiveModule(activeTab);
	}, [activeTab]);
	const [toast, setToast] = useState(null);
	const [stats, setStats] = useState(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("app_stats");
			if (saved) try {
				const parsed = JSON.parse(saved);
				if (typeof parsed.conversions === "number" && Array.isArray(parsed.activity)) return parsed;
			} catch (e) {}
		}
		return {
			conversions: 0,
			exports: 0,
			headUsage: 0,
			robloxUsage: 0,
			blockbenchUsage: 0,
			formats: {
				GLB: 0,
				BBMODEL: 0,
				Shirt: 0,
				Pants: 0,
				OBJ: 0,
				FBX: 0
			},
			activity: []
		};
	});
	const saveStats = (newStats) => {
		setStats(newStats);
		if (typeof window !== "undefined") localStorage.setItem("app_stats", JSON.stringify(newStats));
	};
	useEffect(() => {
		const fetchGlobalStats = async () => {
			try {
				const { data: analyticsData, error: analyticsErr } = await supabase.from("app_analytics").select("*").eq("id", "global").single();
				if (analyticsErr) {
					console.warn("Could not fetch global analytics from Supabase, using local fallback:", analyticsErr.message);
					return;
				}
				const { data: activityData, error: activityErr } = await supabase.from("app_activity").select("*").order("timestamp", { ascending: false }).limit(10);
				if (activityErr) {
					console.warn("Could not fetch global activity feed from Supabase, using local fallback:", activityErr.message);
					return;
				}
				const mergedStats = {
					conversions: analyticsData.conversions ?? 0,
					exports: analyticsData.exports ?? 0,
					headUsage: analyticsData.head_usage ?? 0,
					robloxUsage: analyticsData.roblox_usage ?? 0,
					blockbenchUsage: analyticsData.blockbench_usage ?? 0,
					formats: analyticsData.formats ?? {
						GLB: 0,
						BBMODEL: 0,
						Shirt: 0,
						Pants: 0,
						OBJ: 0,
						FBX: 0
					},
					activity: (activityData || []).map((act) => ({
						id: act.id,
						actionKey: act.action_key,
						details: act.details,
						timestamp: Number(act.timestamp)
					}))
				};
				setStats(mergedStats);
				localStorage.setItem("app_stats", JSON.stringify(mergedStats));
			} catch (err) {
				console.error("Error fetching global stats from Supabase:", err);
			}
		};
		fetchGlobalStats();
	}, []);
	const logConversion = (skinName) => {
		const newActivity = {
			id: Math.random().toString(36).substring(2, 9),
			actionKey: "act_upload",
			details: skinName,
			timestamp: Date.now()
		};
		saveStats({
			...stats,
			conversions: stats.conversions + 1,
			activity: [newActivity, ...stats.activity].slice(0, 10)
		});
		supabase.rpc("increment_analytics", { col_name: "conversions" }).then(({ error }) => {
			if (error) console.warn("Supabase increment_analytics rpc error:", error.message);
		});
		supabase.from("app_activity").insert({
			id: newActivity.id,
			action_key: newActivity.actionKey,
			details: newActivity.details,
			timestamp: newActivity.timestamp
		}).then(({ error }) => {
			if (error) console.warn("Supabase app_activity insert error:", error.message);
		});
	};
	const logExport = (format, filename) => {
		const newActivity = {
			id: Math.random().toString(36).substring(2, 9),
			actionKey: "act_export",
			details: filename,
			timestamp: Date.now()
		};
		const updatedFormats = { ...stats.formats };
		updatedFormats[format] = (updatedFormats[format] || 0) + 1;
		saveStats({
			...stats,
			exports: stats.exports + 1,
			formats: updatedFormats,
			activity: [newActivity, ...stats.activity].slice(0, 10)
		});
		supabase.rpc("increment_analytics", {
			col_name: "exports",
			format_name: format
		}).then(({ error }) => {
			if (error) console.warn("Supabase increment_analytics rpc error:", error.message);
		});
		supabase.from("app_activity").insert({
			id: newActivity.id,
			action_key: newActivity.actionKey,
			details: newActivity.details,
			timestamp: newActivity.timestamp
		}).then(({ error }) => {
			if (error) console.warn("Supabase app_activity insert error:", error.message);
		});
	};
	const logToolVisit = (tool) => {
		const colName = tool === "head3d" ? "head_usage" : tool === "roblox" ? "roblox_usage" : "blockbench_usage";
		saveStats({
			...stats,
			headUsage: tool === "head3d" ? stats.headUsage + 1 : stats.headUsage,
			robloxUsage: tool === "roblox" ? stats.robloxUsage + 1 : stats.robloxUsage,
			blockbenchUsage: tool === "blockbench" ? (stats.blockbenchUsage || 0) + 1 : stats.blockbenchUsage || 0
		});
		supabase.rpc("increment_analytics", { col_name: colName }).then(({ error }) => {
			if (error) console.warn("Supabase increment_analytics rpc error:", error.message);
		});
	};
	const navigateToModule = (module) => {
		navigate(`/${module}`);
		if (module === "head3d" || module === "roblox" || module === "blockbench") logToolVisit(module);
	};
	const fileInputRef = useRef(null);
	const showToast = (type, message) => {
		setToast({
			type,
			message
		});
		setTimeout(() => {
			setToast(null);
		}, 4500);
	};
	useEffect(() => {
		if (!skinImage) {
			const defaultSteve = generateSteveSkin();
			defaultSteve.onload = () => {
				setSkinImage(defaultSteve);
				setSkinSrc(defaultSteve.src);
				setExtractedFaces(extractFaces(defaultSteve));
			};
		}
	}, []);
	useEffect(() => {
		const urlParam = new URLSearchParams(window.location.search).get("skinUrl");
		if (urlParam) {
			const loadSharedSkin = async () => {
				try {
					const blob = await (await fetch(urlParam)).blob();
					await handleFile(new File([blob], "shared_skin.png", { type: "image/png" }));
					window.history.replaceState({}, document.title, window.location.pathname);
				} catch (e) {
					console.error("Failed to load skin from query parameter:", e);
				}
			};
			loadSharedSkin();
		}
	}, [activeModule]);
	const handleFile = async (file) => {
		const result = await validateAndLoadSkin(file);
		if (result.isValid && result.image) {
			setSkinImage(result.image);
			setSkinSrc(result.image.src);
			setExtractedFaces(extractFaces(result.image));
			showToast("success", t("toast_skin_success"));
			logConversion(file.name);
		} else showToast("error", result.errorKey ? t(result.errorKey, result.errorParams) : t("err_generic"));
	};
	const handleDrag = (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
		else if (e.type === "dragleave") setDragActive(false);
	};
	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
		if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
	};
	const handleFileChange = (e) => {
		if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
	};
	const triggerUploadClick = () => {
		fileInputRef.current?.click();
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "layout-wrapper",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "app-container",
			children: [/* @__PURE__ */ jsxs("header", {
				className: "glass-panel app-header",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "logo-container",
						onClick: () => navigateToModule("dashboard"),
						style: { cursor: "pointer" },
						children: [/* @__PURE__ */ jsx(Box, {
							className: "logo-icon",
							size: 32,
							style: { color: "#818cf8" }
						}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
							className: "logo-text",
							style: { margin: 0 },
							children: t("app_title")
						}), /* @__PURE__ */ jsx("p", {
							style: {
								margin: 0,
								fontSize: "0.8rem",
								color: "#a1a1aa"
							},
							children: t("app_subtitle")
						})] })]
					}),
					/* @__PURE__ */ jsxs("nav", {
						className: "nav-container",
						children: [
							/* @__PURE__ */ jsx("button", {
								className: `nav-btn ${activeModule === "dashboard" ? "active" : ""}`,
								onClick: () => navigateToModule("dashboard"),
								children: t("nav_dashboard")
							}),
							/* @__PURE__ */ jsx("button", {
								className: `nav-btn ${activeModule === "head3d" ? "active" : ""}`,
								onClick: () => navigateToModule("head3d"),
								children: t("module_3d_head")
							}),
							/* @__PURE__ */ jsx("button", {
								className: `nav-btn ${activeModule === "roblox" ? "active" : ""}`,
								onClick: () => navigateToModule("roblox"),
								children: t("module_roblox")
							}),
							/* @__PURE__ */ jsx("button", {
								className: `nav-btn ${activeModule === "blockbench" ? "active" : ""}`,
								onClick: () => navigateToModule("blockbench"),
								children: t("nav_blockbench")
							}),
							/* @__PURE__ */ jsxs("button", {
								className: "nav-btn",
								onClick: () => navigate("/gallery"),
								style: {
									display: "flex",
									alignItems: "center",
									gap: "6px"
								},
								children: [/* @__PURE__ */ jsx(LayoutGrid, { size: 16 }), t("nav_gallery")]
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: "16px"
						},
						children: [/* @__PURE__ */ jsxs("div", {
							className: "i18n-selector-container",
							style: {
								display: "flex",
								gap: "4px",
								background: "rgba(255, 255, 255, 0.03)",
								padding: "2px",
								borderRadius: "8px",
								border: "1px solid rgba(255, 255, 255, 0.05)"
							},
							children: [/* @__PURE__ */ jsx("button", {
								className: `tab-btn ${language === "en" ? "active" : ""}`,
								onClick: () => setLanguage("en"),
								style: {
									padding: "4px 8px",
									fontSize: "0.75rem",
									minWidth: "32px",
									flex: "none"
								},
								children: "EN"
							}), /* @__PURE__ */ jsx("button", {
								className: `tab-btn ${language === "es" ? "active" : ""}`,
								onClick: () => setLanguage("es"),
								style: {
									padding: "4px 8px",
									fontSize: "0.75rem",
									minWidth: "32px",
									flex: "none"
								},
								children: "ES"
							})]
						}), /* @__PURE__ */ jsx("span", {
							className: "badge",
							children: "v1.1"
						})]
					})
				]
			}), /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsxs(Suspense, {
				fallback: /* @__PURE__ */ jsx(LoadingSkeleton, {}),
				children: [
					activeModule === "dashboard" && /* @__PURE__ */ jsx(DashboardView, {
						stats,
						navigateToModule
					}),
					activeModule === "head3d" && /* @__PURE__ */ jsx(Head3DWorkspace, {
						skinImage,
						skinSrc,
						extractedFaces,
						fileInputRef,
						handleFileChange,
						dragActive,
						handleDrag,
						handleDrop,
						triggerUploadClick,
						showToast,
						logExport
					}),
					activeModule === "roblox" && /* @__PURE__ */ jsx(RobloxWorkspace, {
						skinImage,
						setSkinImage,
						fileInputRef,
						handleFileChange,
						dragActive,
						handleDrag,
						handleDrop,
						triggerUploadClick,
						showToast,
						logExport
					}),
					activeModule === "blockbench" && /* @__PURE__ */ jsx(BlockbenchWorkspace, {
						showToast,
						logExport
					})
				]
			}) })]
		}), toast && /* @__PURE__ */ jsx("div", {
			className: "toast-container",
			children: /* @__PURE__ */ jsxs("div", {
				className: `toast ${toast.type === "success" ? "toast-success" : "toast-error"}`,
				children: [toast.type === "success" ? /* @__PURE__ */ jsx(CheckCircle, { size: 20 }) : /* @__PURE__ */ jsx(AlertTriangle, { size: 20 }), /* @__PURE__ */ jsx("span", { children: toast.message })]
			})
		})]
	});
}
//#endregion
//#region src/main.tsx
if (typeof window !== "undefined") {
	if (window.location.pathname.startsWith("/share/")) {
		const rootEl = document.getElementById("root");
		if (rootEl) {
			rootEl.removeAttribute("data-server-rendered");
			rootEl.innerHTML = "";
		}
	}
}
var createRoot = ViteReactSSG({ routes });
//#endregion
export { createRoot, useTranslation as n, supabase as t };
