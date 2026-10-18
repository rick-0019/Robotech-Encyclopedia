/**
 * ROBOTECH HISTORICAL ARCHIVE & BATTLE CHRONOLOGY - JAVASCRIPT ENGINE
 * Motor interactivo de la Línea de Tiempo: 1999 (Caída del SDF-1) a 2044+ (Crónicas de las Sombras)
 */

const TIMELINE_I18N = {
  es: {
    system_title: "ROBOTECH <span>HISTORICAL ARCHIVE</span>",
    system_subtitle: "HISTORICAL & BATTLE CHRONOLOGY",
    status_online: "ONLINE // CRONOLOGÍA DE GUERRAS 1999-2044+",
    admin_btn: "⚙ GESTIÓN CRUD LOCAL",
    sound_on: "SFX: ON",
    sound_off: "SFX: OFF",
    back_home: "⮌ INICIO",
    nav_mechas: "⌖ CODEX MECHAS",
    nav_characters: "👤 PERSONAJES",
    nav_ships: "⚓ NAVES CAPITALES",
    
    // Hero
    hero_badge: "REGISTRO CLASIFICADO // RDF HISTORICAL DIVISION",
    hero_title: "CRONOLOGÍA & <span>GRANDES GUERRAS</span>",
    hero_desc: "Línea de tiempo interactiva ultra-detallada que documenta la epopeya de la humanidad y la Robotecnología: desde el impacto de la nave alienígena de Zor en la Isla Macross (1999) hasta el asalto a Punto Réflex y el conflicto contra los Haydonitas en Las Crónicas de las Sombras (2044+).",
    stat_total_events: "HITOS HISTÓRICOS",
    stat_eras: "ERAS TÁCTICAS",
    stat_span: "AÑOS DOCUMENTADOS",

    // Controls
    search_placeholder: "Buscar batalla, planeta, personaje, nave, tecnología...",
    view_stream: "⚡ LÍNEA DE TIEMPO (STREAM)",
    view_grid: "⌖ MALLA TÁCTICA (GRID)",
    records_count: "EVENTOS EN PANTALLA:",
    btn_declassify: "✦ DESCLASIFICAR EXPEDIENTE COMPLETO",
    no_results_title: "SIN COINCIDENCIAS HISTÓRICAS",
    no_results_desc: "Ningún hito operacional coincide con los filtros de búsqueda.",

    // Modal Tabs
    tab_tactical: "INFORME MILITAR & DESARROLLO",
    tab_belligerents: "BELIGERANTES & MANDOS",
    tab_tech: "TECNOLOGÍAS ROBOTECH",
    tab_outcomes: "CONSECUENCIAS & SALDO",
    
    // Modal Labels
    modal_theater: "TEATRO DE OPERACIONES",
    modal_threat_level: "NIVEL DE AMENAZA",
    modal_key_figures: "FIGURAS CLAVE Y MANDOS",
    modal_factions: "FACCIONES Y FLOTAS EN CONFLICTO",
    modal_tech_title: "TECNOLOGÍAS Y SISTEMAS INTRODUCIDOS",
    modal_outcomes_title: "RESOLUCIÓN ESTRATÉGICA & CONSECUENCIAS",
    modal_casualties_title: "EVALUACIÓN DE BAJAS & IMPACTO PLANETARIO",
    modal_zoom_btn: "AMPLIAR EN ALTA RESOLUCIÓN",
    footer_status: "ESTADO DE TELEMETRÍA: ARCHIVO HISTÓRICO GLOBAL // MANDO SUPREMO RDF // TIERRA UNIFICADA"
  },
  en: {
    system_title: "ROBOTECH <span>HISTORICAL ARCHIVE</span>",
    system_subtitle: "HISTORICAL & BATTLE CHRONOLOGY",
    status_online: "ONLINE // WAR CHRONOLOGY 1999-2044+",
    admin_btn: "⚙ LOCAL CRUD STUDIO",
    sound_on: "SFX: ON",
    sound_off: "SFX: OFF",
    back_home: "⮌ HOME",
    nav_mechas: "⌖ MECHA CODEX",
    nav_characters: "👤 CHARACTERS",
    nav_ships: "⚓ CAPITAL FLEET",
    
    // Hero
    hero_badge: "CLASSIFIED DOSSIER // RDF HISTORICAL DIVISION",
    hero_title: "WAR CHRONOLOGY & <span>BATTLE LOG</span>",
    hero_desc: "Ultra-detailed interactive timeline chronicling humanity's saga with Robotechnology: from the cataclysmic crash of Zor's fortress on Macross Island (1999) to the final assault on Reflex Point and the Haydonite conflict in The Shadow Chronicles (2044+).",
    stat_total_events: "HISTORIC MILESTONES",
    stat_eras: "TACTICAL ERAS",
    stat_span: "YEARS COVERED",

    // Controls
    search_placeholder: "Search by battle, planet, pilot, warship, technology...",
    view_stream: "⚡ TIMELINE STREAM",
    view_grid: "⌖ TACTICAL GRID",
    records_count: "EVENTS DISPLAYED:",
    btn_declassify: "✦ DECLASSIFY FULL INTEL",
    no_results_title: "NO HISTORICAL MATCHES FOUND",
    no_results_desc: "No combat milestones match the current tactical search query.",

    // Modal Tabs
    tab_tactical: "MILITARY INTEL & ACTIONS",
    tab_belligerents: "BELLIGERENTS & COMMAND",
    tab_tech: "ROBOTECH HARDWARE",
    tab_outcomes: "OUTCOMES & AFTERMATH",
    
    // Modal Labels
    modal_theater: "THEATER OF OPERATIONS",
    modal_threat_level: "DEFCON THREAT LEVEL",
    modal_key_figures: "KEY FIGURES & LEADERS",
    modal_factions: "COMBATANT FACTIONS & ARMADAS",
    modal_tech_title: "INTRODUCED ROBOTECHNOLOGY & SYSTEMS",
    modal_outcomes_title: "STRATEGIC RESOLUTION & IMPACT",
    modal_casualties_title: "CASUALTY ASSESSMENT & PLANETARY TOLL",
    modal_zoom_btn: "ENLARGE IN HIGH RESOLUTION",
    footer_status: "TELEMETRY STATUS: GLOBAL HISTORICAL ARCHIVE // RDF HIGH COMMAND // UNITED EARTH"
  }
};

window.timelineState = {
  lang: localStorage.getItem('robotech_lang') || 'es',
  selectedEra: 'all',
  searchQuery: '',
  viewMode: 'stream',
  activeEvent: null,
  data: null
};

document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  initSoundToggle();
  initViewToggle();
  setupSearch();
  setupModalEvents();
  checkLocalAdmin();
  loadTimelineData();
});

// --------------------------------------------------------------------------
// CARGA ASÍNCRONA DE DATOS DE LÍNEA DE TIEMPO
// --------------------------------------------------------------------------
async function loadTimelineData() {
  try {
    const res = await fetch('data/timeline.json');
    if (!res.ok) throw new Error("Could not load data/timeline.json");
    window.timelineState.data = await res.json();
    renderHeroStats();
    renderEraScrubber();
    renderTimeline();
  } catch (err) {
    console.error("Error loading timeline data:", err);
    const container = document.getElementById('timeline-stream');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--veritech-red); font-family: var(--font-hud);">
          <h3>ERROR DE CONEXIÓN CON EL ARCHIVO HISTÓRICO</h3>
          <p>No se pudo inicializar la base de datos cronológica.</p>
        </div>
      `;
    }
  }
}

// --------------------------------------------------------------------------
// CONFIGURACIÓN BILINGÜE Y ACCESOS
// --------------------------------------------------------------------------
function initLanguage() {
  const currentLang = window.timelineState.lang;
  updateStaticTexts(currentLang);

  document.querySelectorAll('.lang-switch').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
    btn.addEventListener('click', () => {
      const selected = btn.dataset.lang;
      window.timelineState.lang = selected;
      localStorage.setItem('robotech_lang', selected);
      document.querySelectorAll('.lang-switch').forEach(b => b.classList.toggle('active', b.dataset.lang === selected));
      updateStaticTexts(selected);
      renderEraScrubber();
      renderTimeline();
      if (window.timelineState.activeEvent) {
        populateEventModal(window.timelineState.activeEvent);
      }
      window.tacticalAudio?.click();
    });
  });
}

function updateStaticTexts(lang) {
  const dict = TIMELINE_I18N[lang] || TIMELINE_I18N.es;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.placeholder = dict.search_placeholder;

  const audioBtn = document.getElementById('audio-switch');
  if (audioBtn) {
    const isMuted = window.tacticalAudio?.isMuted();
    audioBtn.textContent = isMuted ? dict.sound_off : dict.sound_on;
  }
}

function initSoundToggle() {
  const btn = document.getElementById('audio-switch');
  if (!btn) return;
  btn.addEventListener('click', () => {
    window.tacticalAudio?.toggleMute();
    window.tacticalAudio?.click();
    const isMuted = window.tacticalAudio?.isMuted();
    const lang = window.timelineState.lang;
    btn.textContent = isMuted ? TIMELINE_I18N[lang].sound_off : TIMELINE_I18N[lang].sound_on;
  });
}

function initViewToggle() {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.view;
      window.timelineState.viewMode = mode;
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const wrapper = document.getElementById('timeline-wrapper');
      if (wrapper) {
        wrapper.classList.toggle('timeline-grid-mode', mode === 'grid');
      }
      window.tacticalAudio?.click();
      renderTimeline();
    });
  });
}

function setupSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.addEventListener('input', (e) => {
    window.timelineState.searchQuery = e.target.value.trim().toLowerCase();
    renderTimeline();
  });
}

function checkLocalAdmin() {
  const isLocal = ['localhost', '127.0.0.1', '0.0.0.0', ''].includes(window.location.hostname) || window.location.protocol === 'file:';
  const adminBtn = document.getElementById('admin-link-btn');
  if (adminBtn && isLocal) {
    adminBtn.style.display = 'inline-flex';
  }
}

// --------------------------------------------------------------------------
// RENDERIZADO DEL HERO Y SCRUBBER DE ERAS
// --------------------------------------------------------------------------
function renderHeroStats() {
  const data = window.timelineState.data;
  if (!data) return;

  const countEvents = document.getElementById('stat-num-events');
  const countEras = document.getElementById('stat-num-eras');
  const countSpan = document.getElementById('stat-num-span');

  if (countEvents) countEvents.textContent = data.events.length;
  if (countEras) countEras.textContent = data.eras.length - 1; // excluir 'all'
  if (countSpan) countSpan.textContent = "45+";
}

function renderEraScrubber() {
  const data = window.timelineState.data;
  const container = document.getElementById('era-scrubber-bar');
  if (!data || !container) return;

  const lang = window.timelineState.lang;
  const selected = window.timelineState.selectedEra;

  container.innerHTML = data.eras.map(era => {
    const isActive = era.id === selected;
    const label = lang === 'es' ? era.label_es : era.label_en;
    return `
      <button class="era-pill-btn ${isActive ? 'active' : ''}" 
              data-era="${era.id}" 
              onclick="selectEra('${era.id}')">
        <span>${label}</span>
      </button>
    `;
  }).join('');
}

function selectEra(eraId) {
  window.timelineState.selectedEra = eraId;
  window.tacticalAudio?.click();
  renderEraScrubber();
  renderTimeline();
}

// --------------------------------------------------------------------------
// RENDERIZADO PRINCIPAL DE LA LÍNEA DE TIEMPO
// --------------------------------------------------------------------------
function renderTimeline() {
  const data = window.timelineState.data;
  const container = document.getElementById('timeline-stream');
  const countEl = document.getElementById('results-count');
  if (!data || !container) return;

  const lang = window.timelineState.lang;
  const dict = TIMELINE_I18N[lang] || TIMELINE_I18N.es;
  const eraFilter = window.timelineState.selectedEra;
  const query = window.timelineState.searchQuery;

  // Filtrar eventos
  const filtered = data.events.filter(ev => {
    if (eraFilter !== 'all' && ev.era !== eraFilter) return false;
    if (query) {
      const title = (ev.title[lang] || ev.title.en || '').toLowerCase();
      const subtitle = (ev.subtitle[lang] || ev.subtitle.en || '').toLowerCase();
      const location = (ev.location[lang] || ev.location.en || '').toLowerCase();
      const summary = (ev.summary[lang] || ev.summary.en || '').toLowerCase();
      const year = ev.year.toLowerCase();
      const figures = (ev.key_figures || []).join(' ').toLowerCase();
      const tech = (ev.technologies || []).join(' ').toLowerCase();

      return title.includes(query) || 
             subtitle.includes(query) || 
             location.includes(query) || 
             summary.includes(query) || 
             year.includes(query) || 
             figures.includes(query) || 
             tech.includes(query);
    }
    return true;
  });

  if (countEl) {
    countEl.textContent = `${filtered.length} / ${data.events.length}`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: rgba(8,18,35,0.7); border: 1px dashed var(--border-tactical); border-radius: 4px;">
        <h3 style="color: var(--skull-amber); font-family: var(--font-hud); letter-spacing: 2px; margin-bottom: 8px;">${dict.no_results_title}</h3>
        <p style="color: var(--text-dim); font-size: 0.9rem;">${dict.no_results_desc}</p>
      </div>
    `;
    return;
  }

  let html = '';
  let currentEra = '';
  let alternateCount = 0;

  filtered.forEach(ev => {
    // Si cambió de era y no estamos en filtro específico, añadir cabecera de era
    if (eraFilter === 'all' && ev.era !== currentEra) {
      currentEra = ev.era;
      const eraObj = data.eras.find(e => e.id === currentEra);
      const eraTitle = eraObj ? (lang === 'es' ? eraObj.label_es : eraObj.label_en) : currentEra.toUpperCase();
      html += `
        <div class="era-section-header">
          <div class="era-section-badge ${currentEra}">
            <span>⌖</span>
            <span>${eraTitle}</span>
          </div>
        </div>
      `;
    }

    const side = alternateCount % 2 === 0 ? 'left' : 'right';
    alternateCount++;

    const dateText = ev.date_display[lang] || ev.date_display.en || ev.year;
    const titleText = ev.title[lang] || ev.title.en;
    const subtitleText = ev.subtitle[lang] || ev.subtitle.en;
    const locationText = ev.location[lang] || ev.location.en;
    const summaryText = ev.summary[lang] || ev.summary.en;
    const badgeText = ev.badge ? (ev.badge[lang] || ev.badge.en) : 'INFORME DE BATALLA';

    html += `
      <div class="timeline-item ${side}" data-id="${ev.id}">
        <div class="timeline-node-dot" title="${dateText}"></div>

        <div class="timeline-card" onclick="openEventDossier('${ev.id}')">
          <div class="card-event-header">
            <div class="event-date-badge">
              <span>📅</span>
              <span>${dateText}</span>
            </div>
            <div class="event-defcon-tag">${ev.defcon || 'DEFCON 1'}</div>
          </div>

          <div class="event-thumb-wrap">
            <img src="${ev.image}" class="event-thumb-img" alt="${titleText}" loading="lazy">
            <div class="event-badge-overlay">${badgeText}</div>
          </div>

          <h3 class="event-card-title">${titleText}</h3>
          <div class="event-card-subtitle">${subtitleText}</div>
          <div class="event-card-location">
            <span>📍</span>
            <span>${locationText}</span>
          </div>

          <p class="event-card-summary">${summaryText}</p>

          <div class="event-tags-row">
            ${(ev.key_figures || []).slice(0, 3).map(f => `<span class="figure-pill">${f}</span>`).join('')}
          </div>

          <button class="btn-timeline-dossier" onclick="event.stopPropagation(); openEventDossier('${ev.id}')">
            <span>${dict.btn_declassify}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Sonidos de hover tácticos
  document.querySelectorAll('.timeline-card').forEach(c => {
    c.addEventListener('mouseenter', () => window.tacticalAudio?.hover());
  });
}

// --------------------------------------------------------------------------
// EXPEDIENTE DETALLADO MODAL DEL EVENTO HISTÓRICO
// --------------------------------------------------------------------------
function openEventDossier(eventId) {
  const data = window.timelineState.data;
  if (!data) return;

  const ev = data.events.find(e => e.id === eventId);
  if (!ev) return;

  window.timelineState.activeEvent = ev;
  window.tacticalAudio?.openDossier ? window.tacticalAudio.openDossier() : window.tacticalAudio?.click();

  populateEventModal(ev);

  const backdrop = document.getElementById('timeline-modal-backdrop');
  if (backdrop) {
    backdrop.classList.add('open');
  }
}

function closeEventDossier() {
  window.tacticalAudio?.click();
  const backdrop = document.getElementById('timeline-modal-backdrop');
  if (backdrop) {
    backdrop.classList.remove('open');
  }
  window.timelineState.activeEvent = null;
}

function populateEventModal(ev) {
  const lang = window.timelineState.lang;
  const dict = TIMELINE_I18N[lang] || TIMELINE_I18N.es;

  // Banner y encabezado
  const bannerImg = document.getElementById('tmodal-banner-img');
  const modalDate = document.getElementById('tmodal-date');
  const modalTitle = document.getElementById('tmodal-title');
  const modalSub = document.getElementById('tmodal-sub');
  const modalDefcon = document.getElementById('tmodal-defcon');
  const modalLoc = document.getElementById('tmodal-location');

  if (bannerImg) bannerImg.src = ev.image;
  if (modalDate) modalDate.textContent = ev.date_display[lang] || ev.date_display.en || ev.year;
  if (modalTitle) modalTitle.textContent = ev.title[lang] || ev.title.en;
  if (modalSub) modalSub.textContent = ev.subtitle[lang] || ev.subtitle.en;
  if (modalDefcon) modalDefcon.textContent = ev.defcon || 'DEFCON 1';
  if (modalLoc) modalLoc.textContent = ev.location[lang] || ev.location.en;

  // Zoom lightbox botón en el banner
  const zoomBtn = document.getElementById('btn-tmodal-zoom');
  if (zoomBtn) {
    zoomBtn.onclick = () => openLightbox(ev.image, ev.title[lang] || ev.title.en);
  }

  // PANE 1: REPORTE TÁCTICO & DESARROLLO
  const paneTactical = document.getElementById('pane-tmodal-tactical');
  if (paneTactical) {
    const reportText = (ev.tactical_report?.[lang] || ev.tactical_report?.en || ev.summary[lang] || ev.summary.en)
      .split('\n\n')
      .map(p => `<p style="margin-bottom: 14px; text-align: justify;">${p}</p>`)
      .join('');

    paneTactical.innerHTML = `
      <div class="tmodal-info-grid">
        <div class="tmodal-info-card">
          <h4>${dict.modal_theater}</h4>
          <p style="color: #fff; font-family: var(--font-hud); font-size: 0.85rem;">${ev.location[lang] || ev.location.en}</p>
        </div>
        <div class="tmodal-info-card">
          <h4>${dict.modal_threat_level}</h4>
          <p style="color: var(--veritech-red); font-family: var(--font-hud); font-size: 0.85rem;">${ev.defcon || 'DEFCON 1'}</p>
        </div>
      </div>
      <div style="background: rgba(4,10,22,0.85); border: 1px solid var(--border-tactical); padding: 20px; border-radius: 3px;">
        <h4 style="font-family: var(--font-hud); color: var(--un-cyan); letter-spacing: 1.5px; margin-bottom: 14px;">
          INFORME OPERACIONAL DE COMBATE // REGISTRO RDF
        </h4>
        ${reportText}
      </div>
    `;
  }

  // PANE 2: BELIGERANTES & MANDOS
  const paneBelligerents = document.getElementById('pane-tmodal-belligerents');
  if (paneBelligerents) {
    let factionsHtml = (ev.factions || []).map(f => {
      const fName = lang === 'es' ? (f.name_es || f.name) : (f.name_en || f.name);
      return `
        <div style="display: flex; align-items: center; gap: 12px; background: rgba(7,16,32,0.8); border: 1px solid rgba(0,240,255,0.2); padding: 12px; border-radius: 2px;">
          <img src="${f.logo || 'assets/images/ui/logo_UNSpacy.png'}" style="width: 38px; height: 38px; object-fit: contain;" alt="${fName}">
          <span style="font-family: var(--font-hud); font-size: 0.85rem; color: #fff;">${fName}</span>
        </div>
      `;
    }).join('');

    let figuresHtml = (ev.key_figures || []).map(fig => `
      <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255,157,0,0.1); border: 1px solid var(--border-amber); color: var(--skull-amber); padding: 6px 12px; border-radius: 2px; font-family: var(--font-mono); font-size: 0.85rem;">
        <span>👤</span>
        <span>${fig}</span>
      </div>
    `).join('');

    paneBelligerents.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h4 style="font-family: var(--font-hud); color: var(--un-cyan); margin-bottom: 12px; letter-spacing: 1.5px;">
          ${dict.modal_factions}
        </h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
          ${factionsHtml}
        </div>
      </div>
      <div>
        <h4 style="font-family: var(--font-hud); color: var(--skull-amber); margin-bottom: 12px; letter-spacing: 1.5px;">
          ${dict.modal_key_figures}
        </h4>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          ${figuresHtml}
        </div>
      </div>
    `;
  }

  // PANE 3: TECNOLOGÍAS ROBOTECH
  const paneTech = document.getElementById('pane-tmodal-tech');
  if (paneTech) {
    let techItems = (ev.technologies || []).map(t => `
      <li style="margin-bottom: 10px; font-size: 0.9rem;">
        <strong style="color: #fff;">${t}</strong>
      </li>
    `).join('');

    paneTech.innerHTML = `
      <div style="background: rgba(5,14,30,0.85); border: 1px solid var(--border-tactical); padding: 20px; border-radius: 3px;">
        <h4 style="font-family: var(--font-hud); color: var(--un-cyan); letter-spacing: 1.5px; margin-bottom: 14px;">
          ${dict.modal_tech_title}
        </h4>
        <ul class="tmodal-list">
          ${techItems}
        </ul>
      </div>
    `;
  }

  // PANE 4: CONSECUENCIAS & SALDO
  const paneOutcomes = document.getElementById('pane-tmodal-outcomes');
  if (paneOutcomes) {
    const outcomesList = (ev.outcomes?.[lang] || ev.outcomes?.en || [])
      .map(o => `<li>${o}</li>`)
      .join('');

    const casualtiesText = ev.casualties_impact?.[lang] || ev.casualties_impact?.en || 'N/A';

    paneOutcomes.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h4 style="font-family: var(--font-hud); color: var(--radar-green); letter-spacing: 1.5px; margin-bottom: 12px;">
          ${dict.modal_outcomes_title}
        </h4>
        <ul class="tmodal-list">
          ${outcomesList}
        </ul>
      </div>
      <div style="background: rgba(255,45,85,0.08); border: 1px solid rgba(255,45,85,0.3); padding: 16px; border-radius: 3px;">
        <h4 style="font-family: var(--font-hud); color: var(--veritech-red); letter-spacing: 1.5px; margin-bottom: 8px;">
          ${dict.modal_casualties_title}
        </h4>
        <p style="color: #fff; font-size: 0.88rem;">${casualtiesText}</p>
      </div>
    `;
  }

  // Restablecer pestaña activa a la primera
  setupModalTabs();
}

function setupModalTabs() {
  document.querySelectorAll('.tmodal-tab-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === 0);
  });
  document.querySelectorAll('.tmodal-pane').forEach((pane, idx) => {
    pane.classList.toggle('active', idx === 0);
  });
}

function setupModalEvents() {
  // Pestañas
  document.querySelectorAll('.tmodal-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.pane;
      document.querySelectorAll('.tmodal-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tmodal-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');

      window.tacticalAudio?.click();
    });
  });

  // Cerrar modal
  const btnClose = document.getElementById('btn-close-tmodal');
  if (btnClose) btnClose.addEventListener('click', closeEventDossier);

  const backdrop = document.getElementById('timeline-modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeEventDossier();
    });
  }

  // Tecla Escape para cerrar modales o lightbox
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const lb = document.getElementById('lightbox-backdrop');
      if (lb && lb.style.display === 'flex') {
        lb.style.display = 'none';
        return;
      }
      closeEventDossier();
    }
  });

  // Lightbox close click
  const lbBackdrop = document.getElementById('lightbox-backdrop');
  if (lbBackdrop) {
    lbBackdrop.addEventListener('click', () => {
      lbBackdrop.style.display = 'none';
      window.tacticalAudio?.click();
    });
  }
}

function openLightbox(url, caption) {
  window.tacticalAudio?.click();
  const lbBackdrop = document.getElementById('lightbox-backdrop');
  const lbImg = document.getElementById('lightbox-image');
  const lbCap = document.getElementById('lightbox-caption');

  if (lbBackdrop && lbImg) {
    lbImg.src = url;
    if (lbCap) lbCap.textContent = caption || '';
    lbBackdrop.style.display = 'flex';
  }
}

// Exportaciones globales
window.selectEra = selectEra;
window.openEventDossier = openEventDossier;
window.closeEventDossier = closeEventDossier;
window.openLightbox = openLightbox;
