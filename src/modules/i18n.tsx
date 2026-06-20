import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'es';

export interface TranslationDictionary {
  [key: string]: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    // Header
    nav_dashboard: "Dashboard",
    app_title: "MINECRAFT SKIN TOOL",
    app_subtitle: "3D Model & Roblox Clothing",
    module_3d_head: "3D Head Model",
    module_roblox: "Roblox Clothing Templates",
    
    // Dashboard
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
    
    // Activity Log
    act_upload: "Uploaded skin: {name}",
    act_export: "Exported {format} file: {name}",
    act_visit: "Visited {tool} workspace",
    
    // Sidebar Upload
    upload_title: "1. Upload Skin",
    upload_desc: "Drag your 64x64 PNG file or browse your computer.",
    upload_btn: "Select Skin PNG",
    upload_format_hint: "PNG format only (64x64 px)",
    skin_original: "Original Skin",
    
    // Extracted faces (3D Head)
    extracted_faces: "Extracted Faces (Official Coordinates)",
    tab_base_layer: "Base Layer (Head)",
    tab_outer_layer: "Outer Layer (Hat)",
    
    // Roblox Sidebar
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
    
    // Right panel (3D Head viewer)
    opt_grid: "Grid",
    opt_rotate: "Rotate",
    btn_front_view: "Front View",
    
    // Right panel (Roblox templates)
    template_shirt_title: "Official Shirt Template",
    template_pants_title: "Official Pants Template",
    btn_download_shirt: "Download Shirt",
    btn_download_pants: "Download Pants",
    
    // Toasts and Alerts
    toast_skin_success: "Skin loaded and processed successfully!",
    toast_load_skin_for_roblox: "Upload a skin to export to Roblox.",
    toast_shirt_success: "Roblox Shirt (shirt.png) downloaded successfully!",
    toast_shirt_error: "Error exporting Roblox Shirt: {error}",
    toast_pants_success: "Roblox Pants (pants.png) downloaded successfully!",
    toast_pants_error: "Error exporting Roblox Pants: {error}",
    toast_bbmodel_success: "cabeza.bbmodel model downloaded successfully!",
    toast_bbmodel_error: "Error exporting .bbmodel: {error}",
    toast_bbmodel_load_skin: "Upload a skin to export to Blockbench.",
    toast_glb_success: "cabeza.glb model downloaded successfully!",
    toast_glb_error: "Error exporting GLB: {error}",
    toast_load_skin_first: "Upload a skin first.",
    toast_no_3d_model: "No 3D model to export.",
    toast_obj_success: "cabeza.obj, cabeza.mtl and textura.png downloaded successfully!",
    toast_obj_error: "Error exporting OBJ: {error}",
    toast_fbx_success: "cabeza.fbx model downloaded successfully!",
    toast_fbx_error: "Error exporting FBX: {error}",
    
    // Parser Errors
    err_not_png: "The file must be a PNG image.",
    err_invalid_resolution: "The skin resolution must be exactly 64x64 pixels. (Detected: {width}x{height})",
    err_invalid_image: "The file is not a valid image or is corrupted.",
    err_read_error: "An error occurred while reading the file.",
    err_generic: "An error occurred.",
  },
  es: {
    // Header
    nav_dashboard: "Panel",
    app_title: "MINECRAFT SKIN TOOL",
    app_subtitle: "Modelo 3D & Ropa Roblox",
    module_3d_head: "Modelo Cabeza 3D",
    module_roblox: "Plantillas Ropa Roblox",
    
    // Dashboard
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
    
    // Activity Log
    act_upload: "Subió la skin: {name}",
    act_export: "Exportó archivo {format}: {name}",
    act_visit: "Visitó el espacio de trabajo de {tool}",
    
    // Sidebar Upload
    upload_title: "1. Subir Skin",
    upload_desc: "Arrastra tu archivo PNG de 64x64 o búscalo en tu equipo.",
    upload_btn: "Seleccionar Skin PNG",
    upload_format_hint: "Solo formato PNG (64x64 px)",
    skin_original: "Skin Original",
    
    // Extracted faces (3D Head)
    extracted_faces: "Caras Extraídas (Coordenadas Oficiales)",
    tab_base_layer: "Capa Base (Head)",
    tab_outer_layer: "Capa Exterior (Hat)",
    
    // Roblox Sidebar
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
    
    // Right panel (3D Head viewer)
    opt_grid: "Rejilla",
    opt_rotate: "Rotar",
    btn_front_view: "Vista Frontal",
    
    // Right panel (Roblox templates)
    template_shirt_title: "Plantilla Oficial Camisa (Shirt)",
    template_pants_title: "Plantilla Oficial Pantalón (Pants)",
    btn_download_shirt: "Descargar Camisa",
    btn_download_pants: "Descargar Pantalón",
    
    // Toasts and Alerts
    toast_skin_success: "¡Skin cargada y procesada con éxito!",
    toast_load_skin_for_roblox: "Carga una skin para poder exportar a Roblox.",
    toast_shirt_success: "¡Roblox Shirt (shirt.png) descargado con éxito!",
    toast_shirt_error: "Error al exportar Roblox Shirt: {error}",
    toast_pants_success: "¡Roblox Pants (pants.png) descargado con éxito!",
    toast_pants_error: "Error al exportar Roblox Pants: {error}",
    toast_bbmodel_success: "¡Modelo cabeza.bbmodel descargado!",
    toast_bbmodel_error: "Error al exportar .bbmodel: {error}",
    toast_bbmodel_load_skin: "Carga una skin para poder exportarla a Blockbench.",
    toast_glb_success: "¡Modelo cabeza.glb descargado!",
    toast_glb_error: "Error al exportar GLB: {error}",
    toast_load_skin_first: "Carga una skin para poder exportar.",
    toast_no_3d_model: "No hay modelo 3D para exportar.",
    toast_obj_success: "¡Archivos cabeza.obj, cabeza.mtl y textura.png descargados!",
    toast_obj_error: "Error al exportar OBJ: {error}",
    toast_fbx_success: "¡Modelo cabeza.fbx descargado!",
    toast_fbx_error: "Error al exportar FBX: {error}",
    
    // Parser Errors
    err_not_png: "El archivo debe ser un formato de imagen PNG.",
    err_invalid_resolution: "La skin debe ser de resolución exacta 64x64 píxeles. (Detectado: {width}x{height})",
    err_invalid_image: "El archivo no es una imagen válida o está dañado.",
    err_read_error: "Ocurrió un error al leer el archivo.",
    err_generic: "Ocurrió un error.",
  }
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // 1. Check localStorage
    const saved = localStorage.getItem('app_lang') as Language;
    if (saved === 'en' || saved === 'es') return saved;
    
    // 2. Detect browser language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'es') return 'es';
    
    // 3. Fallback to English
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_lang', lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const dict = translations[language] || translations['en'];
    let val = dict[key] || translations['en'][key] || key;
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }
    return val;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
