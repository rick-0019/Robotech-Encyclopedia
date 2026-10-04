/**
 * ROBOTECH TACTICAL MAINFRAME - PORTAL JS
 * Controlador interactivo de la Terminal de Inicio y Gateway Multidisciplinario
 */

const PORTAL_I18N = {
  es: {
    system_title: "ROBOTECH",
    system_subtitle: "TERMINAL CENTRAL SDF-1",
    status_online: "ONLINE // ENLACE GLOBAL ACTIVO",
    admin_btn: "⚙ GESTIÓN CRUD LOCAL",
    sound_on: "SFX: ON",
    sound_off: "SFX: OFF",
    welcome_badge: "TERMINAL MILITAR PRINCIPAL // PROTOCOLO REF-01",
    hero_title: "BASE DE DATOS TÁCTICA <span>ROBOTECH</span>",
    hero_subtitle: "Selecciona el sector de inteligencia militar y registros operacionales para desplegar los archivos clasificados de la Tierra y el espacio profundo.",
    
    // Column 01: Mechas
    col_01_tag: "SECTOR 01 // OPERATIVO",
    col_01_title: "MECHAS & VEHÍCULOS",
    col_01_sub: "DESTROIDS · VERITECHS · ZENTRAEDI",
    col_01_desc: "Banco de datos completo con telemetría de combate, esquemas C.D.M. de blindaje, armamento, configuraciones Veritech triples y comparador balístico.",
    col_01_status: "EN LÍNEA // 5 UNIDADES REGISTRADAS",
    col_01_btn: "INGRESAR AL CODEX →",

    // Column 02: Personajes
    col_02_tag: "SECTOR 02 // OPERATIVO",
    col_02_title: "PERSONAJES & ASES",
    col_02_sub: "PILOTOS RDF · COMANDANTES · HÉROES",
    col_02_desc: "Expedientes biográficos, historiales de servicio, asignación de escuadrones y condecoraciones de los pilotos y líderes de las Guerras Robotech.",
    col_02_status: "EN LÍNEA // EXPEDIENTES DISPONIBLES",
    col_02_btn: "VER EXPEDIENTES →",

    // Column 03: Naves
    col_03_tag: "SECTOR 03 // OPERATIVO",
    col_03_title: "NAVES CAPITALES",
    col_03_sub: "SDF-1 · CRUCEROS ARMD · FLOTAS",
    col_03_desc: "Planos estructurales, capacidades hiperespaciales (Fold Drives), sistemas modulares y hangares de fortalezas y cruceros estelares.",
    col_03_status: "EN LÍNEA // REGISTRO NAVAL ACTIVO",
    col_03_btn: "INGRESAR AL REGISTRO NAVAL →",

    // Column 04: Historia
    col_04_tag: "SECTOR 04 // ARCHIVADO",
    col_04_title: "HISTORIA & GUERRAS",
    col_04_sub: "CRONOLOGÍA 1999-2044 · GUERRAS 1-3",
    col_04_desc: "Línea temporal detallada: El impacto del Macross, la invasión de los Maestros de la Robotecnia y la ocupación Invid en la Nueva Generación.",
    col_04_status: "ARCHIVO MAESTRO // EN DESARROLLO",
    col_04_btn: "LÍNEA TEMPORAL 🔒",

    // Toast
    toast_title: "ACCESO RESTRINGIDO // SECTOR EN PREPARACIÓN",
    toast_msg: "Este sector está listo para recibir fotos y datos. Agrega tus imágenes en la carpeta correspondiente para habilitarlo."
  },
  en: {
    system_title: "ROBOTECH",
    system_subtitle: "SDF-1 CENTRAL TERMINAL",
    status_online: "ONLINE // GLOBAL LINK ACTIVE",
    admin_btn: "⚙ LOCAL CRUD STUDIO",
    sound_on: "SFX: ON",
    sound_off: "SFX: OFF",
    welcome_badge: "MAIN MILITARY TERMINAL // REF-01 PROTOCOL",
    hero_title: "ROBOTECH <span>TACTICAL ARCHIVE</span>",
    hero_subtitle: "Select the military intelligence and operational records sector to deploy classified defense files from Earth and deep space.",

    // Column 01: Mechas
    col_01_tag: "SECTOR 01 // OPERATIONAL",
    col_01_title: "MECHAS & VEHICLES",
    col_01_sub: "DESTROIDS · VERITECHS · ZENTRAEDI",
    col_01_desc: "Comprehensive database featuring combat telemetry, M.D.C. armor breakdown, weapon systems, Veritech triple configurations, and ballistic comparator.",
    col_01_status: "ONLINE // 5 UNITS REGISTERED",
    col_01_btn: "ENTER THE CODEX →",

    // Column 02: Personajes
    col_02_tag: "SECTOR 02 // OPERATIONAL",
    col_02_title: "CHARACTERS & ACES",
    col_02_sub: "RDF PILOTS · COMMANDERS · HEROES",
    col_02_desc: "Biographical files, service records, squadron assignments, and combat honors of pilots and leaders across the Robotech Wars.",
    col_02_status: "ONLINE // DOSSIERS AVAILABLE",
    col_02_btn: "VIEW DOSSIERS →",

    // Column 03: Naves
    col_03_tag: "SECTOR 03 // OPERATIONAL",
    col_03_title: "CAPITAL WARSHIPS",
    col_03_sub: "SDF-1 · ARMD CARRIERS · FLEETS",
    col_03_desc: "Structural schematics, hyperspace fold drives, modular systems, and mecha hangars of space battle fortresses and dreadnoughts.",
    col_03_status: "ONLINE // NAVAL REGISTRY ACTIVE",
    col_03_btn: "ENTER NAVAL REGISTRY →",

    // Column 04: Historia
    col_04_tag: "SECTOR 04 // ARCHIVED",
    col_04_title: "HISTORY & WARS",
    col_04_sub: "TIMELINE 1999-2044 · WARS 1-3",
    col_04_desc: "Detailed historical timeline: The crash of Macross, the invasion of the Robotech Masters, and the Invid occupation in the New Generation.",
    col_04_status: "MASTER ARCHIVE // IN PROGRESS",
    col_04_btn: "TIMELINE ARCHIVE 🔒",

    // Toast
    toast_title: "RESTRICTED ACCESS // SECTOR IN PREPARATION",
    toast_msg: "This sector is ready for photos and records. Place your images in the respective folder to enable it."
  }
};

window.portalState = {
  lang: localStorage.getItem('robotech_lang') || 'es'
};

document.addEventListener('DOMContentLoaded', () => {
  initPortalLanguage();
  initPortalSound();
  initPortalColumns();
  checkLocalAdmin();
});

function initPortalLanguage() {
  const currentLang = window.portalState.lang;
  updatePortalTexts(currentLang);

  document.querySelectorAll('.lang-switch').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
    btn.addEventListener('click', () => {
      const selected = btn.dataset.lang;
      window.portalState.lang = selected;
      localStorage.setItem('robotech_lang', selected);
      document.querySelectorAll('.lang-switch').forEach(b => b.classList.toggle('active', b.dataset.lang === selected));
      updatePortalTexts(selected);
      window.tacticalAudio?.click();
    });
  });
}

function updatePortalTexts(lang) {
  const dict = PORTAL_I18N[lang] || PORTAL_I18N.es;
  document.querySelectorAll('[data-portal-i18n]').forEach(el => {
    const key = el.dataset.portalI18n;
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  const soundBtn = document.getElementById('audio-switch');
  if (soundBtn) {
    const isMuted = window.tacticalAudio?.isMuted();
    soundBtn.textContent = isMuted ? dict.sound_off : dict.sound_on;
  }
}

function initPortalSound() {
  const btn = document.getElementById('audio-switch');
  if (!btn) return;
  btn.addEventListener('click', () => {
    window.tacticalAudio?.toggleMute();
    window.tacticalAudio?.click();
    const isMuted = window.tacticalAudio?.isMuted();
    const lang = window.portalState.lang;
    btn.textContent = isMuted ? PORTAL_I18N[lang].sound_off : PORTAL_I18N[lang].sound_on;
  });
}

function initPortalColumns() {
  document.querySelectorAll('.portal-column').forEach(col => {
    col.addEventListener('mouseenter', () => {
      window.tacticalAudio?.hover();
    });
  });
}

function showClassifiedToast(categoryKey, folderPath) {
  window.tacticalAudio?.click();
  const toast = document.getElementById('portal-toast');
  const lang = window.portalState.lang;
  const dict = PORTAL_I18N[lang] || PORTAL_I18N.es;

  if (toast) {
    const titleEl = toast.querySelector('h4');
    const descEl = toast.querySelector('p');
    if (titleEl) titleEl.textContent = dict.toast_title;
    if (descEl) descEl.innerHTML = `${dict.toast_msg} <br><code style="color:var(--un-cyan); font-size:0.75rem;">${folderPath}</code>`;
    toast.classList.add('show');
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 4500);
  }
}

function checkLocalAdmin() {
  const isLocal = ['localhost', '127.0.0.1', '0.0.0.0', ''].indexOf(window.location.hostname) !== -1 || window.location.protocol === 'file:';
  const adminBtn = document.getElementById('admin-link-btn');
  if (adminBtn && isLocal) {
    adminBtn.style.display = 'inline-flex';
  }
}

window.showClassifiedToast = showClassifiedToast;
