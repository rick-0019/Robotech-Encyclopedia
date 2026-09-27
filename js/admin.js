/**
 * Robotech Admin Studio Logic
 * Maneja el CRUD local con selectores dinámicos, creación rápida con [+],
 * gestor visual de galería y exportación limpia para GitHub Pages.
 */

let currentManifest = null;
let currentMechaData = null;
let currentTaxonomies = null;
let currentTaxModalType = null;
let currentCharManifest = null;
let currentCharData = null;
let activeAdminModule = 'mechas';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const modParam = params.get('module') || params.get('section') || 'mechas';
  activeAdminModule = (modParam === 'personajes' || modParam === 'characters' || modParam === 'personaje') ? 'characters' : 'mechas';

  setupModuleView(activeAdminModule);
  await loadTaxonomies();

  if (activeAdminModule === 'characters') {
    await loadAdminCharManifest();
    setupCharEventListeners();
    setupCharExportButtons();
    updateLiveCharPreview();
  } else {
    await loadAdminManifest();
    setupFormListeners();
    setupExportButtons();
    const select = document.getElementById('select-mecha-to-edit');
    if (select && select.options.length > 1) {
      select.selectedIndex = 1;
      select.dispatchEvent(new Event('change'));
    }
    updateLivePreview();
  }
});

// --------------------------------------------------------------------------
// 1. TAXONOMÍAS DINÁMICAS (Categorías, Facciones, Tipos, Series)
// --------------------------------------------------------------------------
async function loadTaxonomies() {
  try {
    const res = await fetch(`data/taxonomies.json?_t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      currentTaxonomies = await res.json();
      localStorage.setItem('robotech_taxonomies', JSON.stringify(currentTaxonomies));
    } else {
      const cached = localStorage.getItem('robotech_taxonomies');
      if (cached) currentTaxonomies = JSON.parse(cached);
    }
  } catch (e) {
    console.warn("Could not load taxonomies from server, using fallback:", e);
    const cached = localStorage.getItem('robotech_taxonomies');
    if (cached) currentTaxonomies = JSON.parse(cached);
  }

  if (!currentTaxonomies) {
    currentTaxonomies = {
      categories: [
        { id: "destroid", label_es: "Destroids", label_en: "Destroids" },
        { id: "veritech", label_es: "Veritechs / Valkyries", label_en: "Veritechs / Valkyries" },
        { id: "zentraedi", label_es: "Fuerzas Zentraedi", label_en: "Zentraedi Forces" }
      ],
      factions: [
        { id: "un_spacy", name_es: "U.N. Spacy", name_en: "U.N. Spacy", logo: "assets/images/ui/logo_UNSpacy.png" },
        { id: "skull_squadron", name_es: "U.N. Spacy - Escuadrón Skull", name_en: "U.N. Spacy - Skull Squadron", logo: "assets/images/ui/logo_UNSpacy.png" },
        { id: "zentraedi_main", name_es: "Flota Principal Zentraedi (Boddole Zer)", name_en: "Zentraedi Main Fleet", logo: "assets/images/ui/logo_zentran.png" },
        { id: "ref_pioneer", name_es: "Fuerza Expedicionaria Robotech (REF / Pioneer)", name_en: "Robotech Expeditionary Force (REF)", logo: "assets/images/ui/Mars_Base.png" },
        { id: "mars_base_division", name_es: "REF - División Marte (Mars Base)", name_en: "REF - Mars Base Division", logo: "assets/images/ui/Mars_Base.png" }
      ],
      vehicle_types: [
        { name_es: "Destroid Antiaéreo No Transformable", name_en: "Non-Transformable Anti-Aircraft Destroid" },
        { name_es: "Destroid de Asalto y Artillería Pesada", name_en: "Heavy Battle & Assault Destroid" },
        { name_es: "Caza Variable Aeroespacial / Mecha Transformable", name_en: "Variable Aerospace Fighter / Transformable Mecha" },
        { name_es: "Cápsula de Combate Bípeda Ligera / Espacial", name_en: "Light Bipedal Combat Pod" }
      ],
      series_eras: [
        { id: "macross", name_es: "La Saga Macross (Primera Guerra Robotech)", name_en: "The Macross Saga" },
        { id: "masters", name_es: "Los Maestros de la Robotech (Segunda Guerra)", name_en: "Robotech Masters" },
        { id: "new_generation", name_es: "La Nueva Generación / Era Invid (Tercera Guerra)", name_en: "The New Generation / Invid Era" }
      ]
    };
  }

  populateTaxonomySelects();
}

function populateTaxonomySelects() {
  // 1. Categorías
  const catSel = document.getElementById('m_category_select');
  if (catSel) {
    catSel.innerHTML = currentTaxonomies.categories.map(c => 
      `<option value="${c.id}">${c.label_es} (${c.label_en})</option>`
    ).join('');

    catSel.onchange = () => {
      checkAutoVariableModes();
      updateLivePreview();
    };
  }

  // 2. Facciones con data-logo y auto-asignación instantánea
  const facSel = document.getElementById('m_faction_select');
  if (facSel) {
    facSel.innerHTML = currentTaxonomies.factions.map(f => 
      `<option value="${f.name_es}" data-en="${f.name_en}" data-logo="${f.logo || ''}">${f.name_es}</option>`
    ).join('');

    // Al cambiar la facción militar, auto-selecciona el logo correspondiente
    facSel.onchange = () => {
      const opt = facSel.selectedOptions[0];
      const logo = opt?.dataset?.logo;
      const logoInp = document.getElementById('m_faction_logo');
      if (logoInp) {
        if (logo) {
          logoInp.value = logo;
        } else {
          const txt = facSel.value.toLowerCase();
          if (txt.includes('marte') || txt.includes('mars')) {
            logoInp.value = 'assets/images/ui/Mars_Base.png';
          } else if (txt.includes('zentraedi') || txt.includes('zentran') || txt.includes('meltrandi')) {
            logoInp.value = 'assets/images/ui/logo_zentran.png';
          } else {
            logoInp.value = 'assets/images/ui/logo_UNSpacy.png';
          }
        }
        updateFactionLogoPreview();
        updateLivePreview();
      }
    };
  }

  // 2b. Catálogo de Logos de Facción en Datalist
  const logoList = document.getElementById('faction_logos_list');
  if (logoList) {
    const knownLogos = new Map();
    knownLogos.set('assets/images/ui/logo_UNSpacy.png', 'Robotech Defense Force / U.N. Spacy');
    knownLogos.set('assets/images/ui/logo_zentran.png', 'Fuerzas Zentraedi / Meltrandi');
    knownLogos.set('assets/images/ui/Mars_Base.png', 'REF - División Marte (Mars Base)');
    
    (currentTaxonomies.factions || []).forEach(f => {
      if (f.logo) knownLogos.set(f.logo, f.name_es);
    });

    logoList.innerHTML = Array.from(knownLogos.entries()).map(([path, name]) => 
      `<option value="${path}">${name}</option>`
    ).join('');
  }

  // 3. Tipos de Vehículo
  const typeSel = document.getElementById('m_type_select');
  if (typeSel) {
    typeSel.innerHTML = currentTaxonomies.vehicle_types.map(t => 
      `<option value="${t.name_es}" data-en="${t.name_en}">${t.name_es}</option>`
    ).join('');

    typeSel.onchange = () => {
      checkAutoVariableModes();
      updateLivePreview();
    };
  }

  // 4. Series / Eras
  const serSel = document.getElementById('m_series_select');
  if (serSel) {
    serSel.innerHTML = currentTaxonomies.series_eras.map(s => 
      `<option value="${s.name_es}" data-en="${s.name_en}">${s.name_es}</option>`
    ).join('');
  }
}

window.checkAutoVariableModes = function() {
  const typeVal = (document.getElementById('m_type_select')?.value || '').toLowerCase();
  const catVal = (document.getElementById('m_category_select')?.value || '').toLowerCase();
  const isVar = catVal === 'veritech' || typeVal.includes('variable') || typeVal.includes('transformable');
  
  if (isVar) {
    toggleVariableModes(true);
  }
};

window.toggleVariableModes = function(forceState) {
  const checkbox = document.getElementById('m_is_variable');
  const section = document.getElementById('veritech-modes-section');
  if (!section) return;

  const active = typeof forceState === 'boolean' ? forceState : (checkbox ? checkbox.checked : false);
  if (checkbox) checkbox.checked = active;

  section.style.display = active ? 'block' : 'none';
  updateLivePreview();
};

window.updateModePreview = function(mode) {
  const inp = document.getElementById(`m_mode_${mode}_img`);
  const prev = document.getElementById(`m_mode_${mode}_preview`);
  if (!inp || !prev) return;
  if (inp.value.trim()) {
    prev.src = inp.value.trim();
    prev.style.display = 'block';
  } else {
    prev.style.display = 'none';
  }
};

// Modal [+] para añadir cualquier opción al instante
window.openAddTaxonomyModal = function(type) {
  currentTaxModalType = type;
  const modal = document.getElementById('taxonomy-modal-backdrop');
  const title = document.getElementById('taxonomy-modal-title');
  const inEs = document.getElementById('new_tax_es');
  const inEn = document.getElementById('new_tax_en');
  const logoGroup = document.getElementById('group_new_tax_logo');
  const logoSel = document.getElementById('new_tax_logo');

  inEs.value = '';
  inEn.value = '';

  if (type === 'faction' && logoGroup && logoSel) {
    logoGroup.style.display = 'block';
    const logos = currentTaxonomies.faction_logos || [
      { id: 'un_spacy', name: 'Robotech Defense Force / U.N. Spacy', file: 'assets/images/ui/logo_UNSpacy.png' },
      { id: 'zentraedi', name: 'Fuerzas Zentraedi', file: 'assets/images/ui/logo_zentran.png' }
    ];
    logoSel.innerHTML = logos.map(l => `<option value="${l.file}">${l.name}</option>`).join('');
  } else if (logoGroup) {
    logoGroup.style.display = 'none';
  }

  const titles = {
    category: 'AÑADIR NUEVA CATEGORÍA',
    faction: 'AÑADIR NUEVA FACCIÓN MILITAR',
    vehicle_type: 'AÑADIR NUEVO TIPO DE VEHÍCULO / NAVE',
    series: 'AÑADIR NUEVA SAGA / ERA ROBOTECH'
  };

  title.textContent = titles[type] || 'AÑADIR NUEVO ELEMENTO';
  modal.style.display = 'flex';
  inEs.focus();
  window.tacticalAudio?.hover();
};

window.closeTaxonomyModal = function() {
  document.getElementById('taxonomy-modal-backdrop').style.display = 'none';
  window.tacticalAudio?.click();
};

window.confirmAddTaxonomy = function() {
  const inEs = document.getElementById('new_tax_es').value.trim();
  const inEn = document.getElementById('new_tax_en').value.trim() || inEs;

  if (!inEs) {
    alert("Por favor introduce al menos el nombre en español.");
    return;
  }

  const slug = inEs.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  if (currentTaxModalType === 'category') {
    currentTaxonomies.categories.push({ id: slug, label_es: inEs, label_en: inEn });
    populateTaxonomySelects();
    document.getElementById('m_category_select').value = slug;
  } else if (currentTaxModalType === 'faction') {
    const chosenLogo = document.getElementById('new_tax_logo')?.value || 'assets/images/ui/logo_UNSpacy.png';
    currentTaxonomies.factions.push({ id: slug, name_es: inEs, name_en: inEn, logo: chosenLogo });
    populateTaxonomySelects();
    document.getElementById('m_faction_select').value = inEs;
    document.getElementById('m_faction_logo').value = chosenLogo;
    updateFactionLogoPreview();
  } else if (currentTaxModalType === 'vehicle_type') {
    currentTaxonomies.vehicle_types.push({ name_es: inEs, name_en: inEn });
    populateTaxonomySelects();
    document.getElementById('m_type_select').value = inEs;
  } else if (currentTaxModalType === 'series') {
    currentTaxonomies.series_eras.push({ id: slug, name_es: inEs, name_en: inEn });
    populateTaxonomySelects();
    document.getElementById('m_series_select').value = inEs;
  }

  localStorage.setItem('robotech_taxonomies', JSON.stringify(currentTaxonomies));
  window.closeTaxonomyModal();
  updateLivePreview();
};

// --------------------------------------------------------------------------
// 2. CARGA Y EDICIÓN DE MECHAS
// --------------------------------------------------------------------------
async function loadAdminManifest() {
  try {
    const res = await fetch('data/manifest.json');
    if (!res.ok) throw new Error("Could not load manifest");
    currentManifest = await res.json();
    populateMechaSelect();
  } catch (e) {
    console.error("Error loading manifest:", e);
  }
}

function populateMechaSelect() {
  const select = document.getElementById('select-mecha-to-edit');
  if (!select || !currentManifest) return;

  select.innerHTML = '<option value="">-- SELECCIONAR MECHA EXISTENTE --</option>';
  currentManifest.mechas.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.name} (${m.alias || m.id})`;
    select.appendChild(opt);
  });

  select.addEventListener('change', async (e) => {
    const id = e.target.value;
    if (id) {
      await loadMechaIntoForm(id);
    } else {
      resetForm();
    }
  });

  const btnNew = document.getElementById('btn-new-mecha');
  if (btnNew) {
    btnNew.addEventListener('click', () => {
      resetForm();
      select.value = '';
    });
  }
}

async function loadMechaIntoForm(id) {
  try {
    const res = await fetch(`data/mechas/${id}.json`);
    if (!res.ok) throw new Error("Could not load mecha json");
    const data = await res.json();
    currentMechaData = data;

    // Identificación
    document.getElementById('m_id').value = data.id || '';
    document.getElementById('m_name').value = data.name || '';
    document.getElementById('m_alias').value = data.alias || '';
    
    // Selectores sincronizados
    if (data.category) document.getElementById('m_category_select').value = data.category;
    if (data.faction?.es) document.getElementById('m_faction_select').value = data.faction.es;
    if (data.vehicle_type?.es) document.getElementById('m_type_select').value = data.vehicle_type.es;
    if (data.series?.es) document.getElementById('m_series_select').value = data.series.es;

    document.getElementById('m_crew_es').value = data.crew?.es || '';
    document.getElementById('m_thumbnail').value = data.thumbnail || '';

    const logoSel = document.getElementById('m_faction_logo');
    if (logoSel) {
      logoSel.value = data.faction_logo || (data.category === 'zentraedi' ? 'assets/images/ui/logo_zentran.png' : 'assets/images/ui/logo.png');
      window.updateFactionLogoPreview?.();
    }

    // Unidades reales
    document.getElementById('m_stat_speed_val').value = data.stats?.speed?.value || data.stats?.speed?.rating || 120;
    document.getElementById('m_stat_armor_val').value = data.stats?.armor?.value || data.stats?.armor?.main_body_mdc || data.stats?.armor?.rating || 200;
    document.getElementById('m_stat_firepower_val').value = data.stats?.firepower?.value || data.stats?.firepower?.rating || 80;
    document.getElementById('m_stat_range_val').value = data.stats?.range?.value || data.stats?.range?.rating || 10;
    document.getElementById('m_stat_sensors_val').value = data.stats?.sensors?.value || data.stats?.sensors?.rating || 100;
    document.getElementById('m_stat_mobility_val').value = data.stats?.mobility?.value || data.stats?.mobility?.rating || 40;

    // Dimensiones
    document.getElementById('m_height').value = data.dimensions?.height?.metric || '';
    document.getElementById('m_weight').value = data.dimensions?.weight?.metric || '';
    document.getElementById('m_engine_es').value = data.powerplant?.engine_es || '';
    document.getElementById('m_engine_en').value = data.powerplant?.engine_en || '';

    // Lore
    document.getElementById('m_overview_es').value = data.lore?.overview_es || '';
    document.getElementById('m_overview_en').value = data.lore?.overview_en || '';
    document.getElementById('m_tactical_es').value = data.lore?.tactical_analysis_es || '';
    document.getElementById('m_tactical_en').value = data.lore?.tactical_analysis_en || '';

    // MDC
    const mdcContainer = document.getElementById('mdc-items-container');
    mdcContainer.innerHTML = '';
    (data.mdc_by_location || []).forEach(loc => addMdcRow(loc));

    // Weapons
    const wepContainer = document.getElementById('weapons-items-container');
    wepContainer.innerHTML = '';
    (data.weapons || []).forEach(w => addWeaponRow(w));

    // Veritech / Modos de Transformación
    const isVar = Boolean(data.is_variable || data.category === 'veritech' || (data.vehicle_type?.es && (data.vehicle_type.es.toLowerCase().includes('variable') || data.vehicle_type.es.toLowerCase().includes('transformable'))) || data.modes);
    const varCheck = document.getElementById('m_is_variable');
    if (varCheck) varCheck.checked = isVar;
    toggleVariableModes(isVar);

    if (data.modes) {
      if (data.modes.fighter) {
        document.getElementById('m_mode_fighter_img').value = data.modes.fighter.image || '';
        document.getElementById('m_mode_fighter_length').value = data.modes.fighter.length || '';
        document.getElementById('m_mode_fighter_wingspan').value = data.modes.fighter.wingspan || '';
        document.getElementById('m_mode_fighter_height').value = data.modes.fighter.height || '';
        document.getElementById('m_mode_fighter_speed').value = data.modes.fighter.max_speed || data.modes.fighter.speed || '';
        document.getElementById('m_mode_fighter_notes').value = data.modes.fighter.notes_es || data.modes.fighter.notes || '';
        updateModePreview('fighter');
      }
      if (data.modes.guardian) {
        document.getElementById('m_mode_guardian_img').value = data.modes.guardian.image || '';
        document.getElementById('m_mode_guardian_length').value = data.modes.guardian.length || '';
        document.getElementById('m_mode_guardian_wingspan').value = data.modes.guardian.wingspan || '';
        document.getElementById('m_mode_guardian_height').value = data.modes.guardian.height || '';
        document.getElementById('m_mode_guardian_speed').value = data.modes.guardian.speed || '';
        document.getElementById('m_mode_guardian_notes').value = data.modes.guardian.notes_es || data.modes.guardian.notes || '';
        updateModePreview('guardian');
      }
      if (data.modes.battloid) {
        document.getElementById('m_mode_battloid_img').value = data.modes.battloid.image || '';
        document.getElementById('m_mode_battloid_height').value = data.modes.battloid.height || '';
        document.getElementById('m_mode_battloid_width').value = data.modes.battloid.width || '';
        document.getElementById('m_mode_battloid_depth').value = data.modes.battloid.depth || '';
        document.getElementById('m_mode_battloid_speed').value = data.modes.battloid.ground_speed || data.modes.battloid.speed || '';
        document.getElementById('m_mode_battloid_notes').value = data.modes.battloid.notes_es || data.modes.battloid.notes || '';
        updateModePreview('battloid');
      }
    }

    // Galería de Imágenes
    const galContainer = document.getElementById('gallery-items-container');
    galContainer.innerHTML = '';
    (data.images || []).forEach(img => addGalleryRow(img));

    updateLivePreview();
  } catch (err) {
    console.error("Error loading mecha:", err);
  }
}

function setupFormListeners() {
  document.getElementById('crud-form')?.addEventListener('input', () => {
    updateLivePreview();
  });
}

function resetForm() {
  currentMechaData = null;
  document.getElementById('crud-form').reset();
  document.getElementById('mdc-items-container').innerHTML = '';
  document.getElementById('weapons-items-container').innerHTML = '';
  document.getElementById('gallery-items-container').innerHTML = '';

  const varCheck = document.getElementById('m_is_variable');
  if (varCheck) varCheck.checked = false;
  toggleVariableModes(false);

  ['fighter', 'guardian', 'battloid'].forEach(m => {
    const imgInp = document.getElementById(`m_mode_${m}_img`);
    if (imgInp) imgInp.value = '';
    const prev = document.getElementById(`m_mode_${m}_preview`);
    if (prev) { prev.src = ''; prev.style.display = 'none'; }
    const lenInp = document.getElementById(`m_mode_${m}_length`);
    if (lenInp) lenInp.value = '';
    const speedInp = document.getElementById(`m_mode_${m}_speed`);
    if (speedInp) speedInp.value = '';
    const notesInp = document.getElementById(`m_mode_${m}_notes`);
    if (notesInp) notesInp.value = '';
  });

  addMdcRow({ location_es: 'Cuerpo Principal', location_en: 'Main Body', mdc: 250, notes_es: '', notes_en: '' });
  addWeaponRow({ name_es: 'Arma Primaria', name_en: 'Primary Weapon', damage: '4D10', range: '10 km' });
  
  document.getElementById('m_stat_speed_val').value = 120;
  document.getElementById('m_stat_armor_val').value = 250;
  document.getElementById('m_stat_firepower_val').value = 80;
  document.getElementById('m_stat_range_val').value = 10;
  document.getElementById('m_stat_sensors_val').value = 150;
  document.getElementById('m_stat_mobility_val').value = 40;
  updateLivePreview();
}

function addMdcRow(data = {}) {
  const container = document.getElementById('mdc-items-container');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'dyn-list-item';
  div.innerHTML = `
    <button type="button" class="dyn-list-remove" onclick="this.parentElement.remove(); updateLivePreview();">✕</button>
    <div class="form-grid-3">
      <div class="form-group">
        <label>Localización (ES)</label>
        <input type="text" class="form-input mdc-loc-es" value="${data.location_es || ''}" placeholder="ej: Cuerpo Principal">
      </div>
      <div class="form-group">
        <label>Location (EN)</label>
        <input type="text" class="form-input mdc-loc-en" value="${data.location_en || ''}" placeholder="ej: Main Body">
      </div>
      <div class="form-group">
        <label>Puntos C.D.M. (MDC)</label>
        <input type="number" class="form-input mdc-val" value="${data.mdc || 100}">
      </div>
    </div>
  `;
  container.appendChild(div);
}

function addWeaponRow(data = {}) {
  const container = document.getElementById('weapons-items-container');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'dyn-list-item';
  div.innerHTML = `
    <button type="button" class="dyn-list-remove" onclick="this.parentElement.remove(); updateLivePreview();">✕</button>
    <div class="form-grid-2">
      <div class="form-group">
        <label>Nombre del Arma (ES)</label>
        <input type="text" class="form-input wep-name-es" value="${data.name_es || ''}" placeholder="ej: Cañón Láser Doble">
      </div>
      <div class="form-group">
        <label>Weapon Name (EN)</label>
        <input type="text" class="form-input wep-name-en" value="${data.name_en || ''}" placeholder="ej: Twin Laser Cannon">
      </div>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label>Mega-Daño (Dados)</label>
        <input type="text" class="form-input wep-damage" value="${data.damage || ''}" placeholder="ej: 6D10 por brazo">
      </div>
      <div class="form-group">
        <label>Alcance</label>
        <input type="text" class="form-input wep-range" value="${data.range || ''}" placeholder="ej: 12,7 km (8 millas)">
      </div>
    </div>
  `;
  container.appendChild(div);
}

// --------------------------------------------------------------------------
// 3. GESTOR VISUAL DE GALERÍA DE IMÁGENES
// --------------------------------------------------------------------------
function addGalleryRow(data = {}) {
  const container = document.getElementById('gallery-items-container');
  if (!container) return;

  const currentCover = document.getElementById('m_thumbnail').value;
  const isCover = data.url && data.url === currentCover;

  const div = document.createElement('div');
  div.className = 'gallery-admin-row';
  div.innerHTML = `
    <img src="${data.url || ''}" class="gallery-admin-thumb" alt="Preview" onerror="this.src='assets/images/mechas/destroid_raidar_x/b0eca7d9ebe0c448feae08c391418ea8.jpg'">
    
    <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
      <div style="display: flex; gap: 8px;">
        <input type="text" class="form-input gal-url" value="${data.url || ''}" placeholder="Ruta: assets/images/mechas/... o URL" style="flex: 2;" oninput="syncRowThumb(this)">
        <button type="button" class="btn-action-secondary" style="padding: 6px 10px; font-size: 0.72rem; white-space: nowrap;" onclick="openAssetBrowserForGalleryRow(this)">📁 ELEGIR</button>
        <select class="form-select gal-type" style="flex: 1;">
          <option value="render" ${data.type === 'render' ? 'selected' : ''}>Render 3D</option>
          <option value="blueprint" ${data.type === 'blueprint' ? 'selected' : ''}>Plano Táctico</option>
          <option value="artwork" ${data.type === 'artwork' ? 'selected' : ''}>Ilustración / Arte</option>
          <option value="archive" ${data.type === 'archive' ? 'selected' : ''}>Archivo Militar</option>
          <option value="detail" ${data.type === 'detail' ? 'selected' : ''}>Detalle Técnico</option>
          <option value="weapons" ${data.type === 'weapons' ? 'selected' : ''}>Armamento</option>
        </select>
      </div>

      <div style="display: flex; gap: 8px;">
        <input type="text" class="form-input gal-title-es" value="${data.title_es || ''}" placeholder="Título en Español" style="flex: 1;">
        <input type="text" class="form-input gal-title-en" value="${data.title_en || ''}" placeholder="Title in English" style="flex: 1;">
      </div>
    </div>

    <button type="button" class="btn-set-cover ${isCover ? 'active' : ''}" onclick="setCoverImage(this)">
      ${isCover ? '★ PORTADA ACTUAL' : '☆ HACER PORTADA'}
    </button>

    <button type="button" class="dyn-list-remove" style="position:static; margin-left:8px;" onclick="this.parentElement.remove(); updateLivePreview();">✕</button>
  `;

  container.appendChild(div);
}

window.syncRowThumb = function(inputEl) {
  const row = inputEl.closest('.gallery-admin-row');
  const img = row.querySelector('.gallery-admin-thumb');
  if (img) img.src = inputEl.value;
};

window.setCoverImage = function(btn) {
  const row = btn.closest('.gallery-admin-row');
  const url = row.querySelector('.gal-url').value;
  if (!url) return;

  document.getElementById('m_thumbnail').value = url;
  
  // Actualizar todos los botones de portada
  document.querySelectorAll('.btn-set-cover').forEach(b => {
    b.classList.remove('active');
    b.textContent = '☆ HACER PORTADA';
  });

  btn.classList.add('active');
  btn.textContent = '★ PORTADA ACTUAL';

  updateLivePreview();
  window.tacticalAudio?.scan();
};

function updateLivePreview() {
  const preview = document.getElementById('admin-live-card');
  if (!preview) return;

  const name = document.getElementById('m_name').value || 'NOMBRE DE LA UNIDAD';
  const alias = document.getElementById('m_alias').value || 'DESIGNACIÓN';
  const faction = document.getElementById('m_faction_select')?.value || 'U.N. SPACY';
  const logo = document.getElementById('m_faction_logo')?.value || (faction.toLowerCase().includes('marte') || faction.toLowerCase().includes('mars') ? 'assets/images/ui/Mars_Base.png' : (faction.toLowerCase().includes('zentraedi') || faction.toLowerCase().includes('zentran') ? 'assets/images/ui/logo_zentran.png' : 'assets/images/ui/logo_UNSpacy.png'));
  
  const isVar = document.getElementById('m_is_variable')?.checked || document.getElementById('m_category_select')?.value === 'veritech';
  const fighterImg = document.getElementById('m_mode_fighter_img')?.value.trim();
  const guardianImg = document.getElementById('m_mode_guardian_img')?.value.trim();
  const battloidImg = document.getElementById('m_mode_battloid_img')?.value.trim();

  let thumb = document.getElementById('m_thumbnail').value.trim();
  if (!thumb) {
    thumb = fighterImg || 'assets/images/mechas/destroid_raidar_x/b0eca7d9ebe0c448feae08c391418ea8.jpg';
  }

  const speed = parseFloat(document.getElementById('m_stat_speed_val').value) || 0;
  const armor = parseInt(document.getElementById('m_stat_armor_val').value) || 0;
  const firepower = parseInt(document.getElementById('m_stat_firepower_val').value) || 0;
  const sensors = parseInt(document.getElementById('m_stat_sensors_val').value) || 0;

  const varBadge = isVar ? `<span class="badge-tag" style="border-color: var(--un-cyan); color: var(--un-cyan); margin-left: 6px;">3-MODOS VERITECH</span>` : '';
  
  const modeSwitcher = (isVar && (fighterImg || guardianImg || battloidImg)) ? `
    <div style="display: flex; gap: 4px; justify-content: center; margin-top: 6px; background: rgba(0,0,0,0.7); padding: 4px; border-radius: 4px; border: 1px solid rgba(0,240,255,0.2);">
      <button type="button" style="padding: 2px 6px; font-size: 0.65rem; background: var(--un-cyan); color: #000; border: none; border-radius: 2px; cursor: pointer; font-weight: bold;" onclick="previewSwitchMode(this, '${fighterImg || thumb}')">CAZA</button>
      <button type="button" style="padding: 2px 6px; font-size: 0.65rem; background: rgba(255,255,255,0.1); color: var(--text-muted); border: none; border-radius: 2px; cursor: pointer;" onclick="previewSwitchMode(this, '${guardianImg || thumb}')">GUARDIÁN</button>
      <button type="button" style="padding: 2px 6px; font-size: 0.65rem; background: rgba(255,255,255,0.1); color: var(--text-muted); border: none; border-radius: 2px; cursor: pointer;" onclick="previewSwitchMode(this, '${battloidImg || thumb}')">BATTLOID</button>
    </div>
  ` : '';

  preview.innerHTML = `
    <div class="mecha-card" style="box-shadow: none;">
      <div class="card-header-status">
        <div class="card-faction-badge">
          <img src="${logo}" class="card-faction-icon" alt="${faction}" onerror="this.src='assets/images/ui/logo_UNSpacy.png'">
          <span class="faction-tag">${faction}</span>
        </div>
        <div style="display: flex; align-items: center;">
          ${varBadge}
          <span class="badge-tag" style="margin-left: 4px;">VISTA PREVIA</span>
        </div>
      </div>
      <div class="card-image-wrap" style="height: 180px;">
        <img id="admin-preview-img" src="${thumb}" alt="${name}" onerror="this.src='assets/images/mechas/destroid_raidar_x/b0eca7d9ebe0c448feae08c391418ea8.jpg'">
        <div class="image-overlay-hud"></div>
      </div>
      ${modeSwitcher}
      <div class="card-body">
        <div class="card-title-group">
          <h3 class="card-title">${name}</h3>
          <div class="card-alias">${alias}</div>
        </div>

        <div class="stats-bars-container">
          <div class="stat-row">
            <span class="stat-label">VELOCIDAD</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill speed" style="width: ${Math.min(100, Math.max(10, speed / 30))}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${speed} km/h</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">BLINDAJE</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill armor" style="width: ${Math.min(100, Math.max(10, armor / 5))}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${armor} CDM</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">FUEGO</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill firepower" style="width: ${Math.min(100, firepower)}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${firepower} Pts</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">SENSORES</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill sensors" style="width: ${Math.min(100, Math.max(10, sensors / 3.5))}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${sensors} km</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.previewSwitchMode = function(btn, imgUrl) {
  const imgEl = document.getElementById('admin-preview-img');
  if (imgEl && imgUrl) {
    imgEl.src = imgUrl;
  }
  btn.parentElement.querySelectorAll('button').forEach(b => {
    b.style.background = 'rgba(255,255,255,0.1)';
    b.style.color = 'var(--text-muted)';
    b.style.fontWeight = 'normal';
  });
  btn.style.background = 'var(--un-cyan)';
  btn.style.color = '#000';
  btn.style.fontWeight = 'bold';
  window.tacticalAudio?.scan();
};

function buildCurrentMechaJSON() {
  const id = document.getElementById('m_id').value.trim() || 'mecha_nuevo';
  const name = document.getElementById('m_name').value.trim() || 'Mecha';
  const alias = document.getElementById('m_alias').value.trim();
  
  const catSel = document.getElementById('m_category_select');
  const category = catSel ? catSel.value : 'destroid';

  const facSel = document.getElementById('m_faction_select');
  const faction_es = facSel ? facSel.value : 'U.N. Spacy';
  const faction_en = facSel?.selectedOptions[0]?.dataset?.en || faction_es;

  const typeSel = document.getElementById('m_type_select');
  const type_es = typeSel ? typeSel.value : 'Destroid';
  const type_en = typeSel?.selectedOptions[0]?.dataset?.en || type_es;

  const serSel = document.getElementById('m_series_select');
  const series_es = serSel ? serSel.value : 'La Saga Macross';
  const series_en = serSel?.selectedOptions[0]?.dataset?.en || series_es;

  const crew_es = document.getElementById('m_crew_es').value.trim() || 'Uno o dos';
  const thumbnail = document.getElementById('m_thumbnail').value.trim();

  const isVariable = Boolean(document.getElementById('m_is_variable')?.checked || category === 'veritech' || type_es.toLowerCase().includes('variable') || type_es.toLowerCase().includes('transformable'));

  let modesData = null;
  if (isVariable) {
    modesData = {
      fighter: {
        name_es: "Modo Caza / Jet",
        name_en: "Fighter Mode / Jet",
        image: document.getElementById('m_mode_fighter_img')?.value.trim() || thumbnail,
        length: document.getElementById('m_mode_fighter_length')?.value.trim() || '',
        wingspan: document.getElementById('m_mode_fighter_wingspan')?.value.trim() || '',
        height: document.getElementById('m_mode_fighter_height')?.value.trim() || '',
        max_speed: document.getElementById('m_mode_fighter_speed')?.value.trim() || '',
        notes_es: document.getElementById('m_mode_fighter_notes')?.value.trim() || '',
        notes_en: document.getElementById('m_mode_fighter_notes')?.value.trim() || ''
      },
      guardian: {
        name_es: "Modo Guardián (Gerwalk)",
        name_en: "Guardian Mode (Gerwalk)",
        image: document.getElementById('m_mode_guardian_img')?.value.trim() || thumbnail,
        length: document.getElementById('m_mode_guardian_length')?.value.trim() || '',
        wingspan: document.getElementById('m_mode_guardian_wingspan')?.value.trim() || '',
        height: document.getElementById('m_mode_guardian_height')?.value.trim() || '',
        speed: document.getElementById('m_mode_guardian_speed')?.value.trim() || '',
        notes_es: document.getElementById('m_mode_guardian_notes')?.value.trim() || '',
        notes_en: document.getElementById('m_mode_guardian_notes')?.value.trim() || ''
      },
      battloid: {
        name_es: "Modo Battloid (Humanoide)",
        name_en: "Battloid Mode (Humanoid)",
        image: document.getElementById('m_mode_battloid_img')?.value.trim() || thumbnail,
        height: document.getElementById('m_mode_battloid_height')?.value.trim() || '',
        width: document.getElementById('m_mode_battloid_width')?.value.trim() || '',
        depth: document.getElementById('m_mode_battloid_depth')?.value.trim() || '',
        ground_speed: document.getElementById('m_mode_battloid_speed')?.value.trim() || '',
        notes_es: document.getElementById('m_mode_battloid_notes')?.value.trim() || '',
        notes_en: document.getElementById('m_mode_battloid_notes')?.value.trim() || ''
      }
    };
  }

  const speedVal = parseFloat(document.getElementById('m_stat_speed_val').value) || 0;
  const armorVal = parseInt(document.getElementById('m_stat_armor_val').value) || 0;
  const firepowerVal = parseInt(document.getElementById('m_stat_firepower_val').value) || 0;
  const rangeVal = parseFloat(document.getElementById('m_stat_range_val').value) || 0;
  const sensorsVal = parseInt(document.getElementById('m_stat_sensors_val').value) || 0;
  const mobilityVal = parseInt(document.getElementById('m_stat_mobility_val').value) || 0;

  // MDC
  const mdcList = [];
  document.querySelectorAll('#mdc-items-container .dyn-list-item').forEach(el => {
    mdcList.push({
      location_es: el.querySelector('.mdc-loc-es')?.value || '',
      location_en: el.querySelector('.mdc-loc-en')?.value || '',
      mdc: parseInt(el.querySelector('.mdc-val')?.value || '100')
    });
  });

  // Weapons
  const wepList = [];
  document.querySelectorAll('#weapons-items-container .dyn-list-item').forEach(el => {
    wepList.push({
      name_es: el.querySelector('.wep-name-es')?.value || '',
      name_en: el.querySelector('.wep-name-en')?.value || '',
      damage: el.querySelector('.wep-damage')?.value || '',
      range: el.querySelector('.wep-range')?.value || ''
    });
  });

  // Galería de imágenes completa
  const imagesList = [];
  document.querySelectorAll('#gallery-items-container .gallery-admin-row').forEach(row => {
    const url = row.querySelector('.gal-url')?.value.trim();
    if (url) {
      imagesList.push({
        url: url,
        title_es: row.querySelector('.gal-title-es')?.value.trim() || name,
        title_en: row.querySelector('.gal-title-en')?.value.trim() || name,
        type: row.querySelector('.gal-type')?.value || 'render'
      });
    }
  });

  return {
    id: id,
    name: name,
    alias: alias,
    category: category,
    is_variable: isVariable,
    modes: modesData,
    series: { es: series_es, en: series_en },
    faction: { es: faction_es, en: faction_en },
    vehicle_type: { es: type_es, en: type_en },
    crew: { es: crew_es, en: crew_es },
    thumbnail: thumbnail,
    faction_logo: document.getElementById('m_faction_logo')?.value || (category === 'zentraedi' ? 'assets/images/ui/logo_zentran.png' : 'assets/images/ui/logo_UNSpacy.png'),
    images: imagesList.length > 0 ? imagesList : [{ url: thumbnail, title_es: name, title_en: name, type: "render" }],
    stats: {
      speed: {
        value: speedVal,
        unit_es: "km/h",
        unit_en: "km/h",
        rating: Math.min(100, Math.round(speedVal > 500 ? speedVal / 40 : speedVal / 3)),
        label_es: `${speedVal} km/h`,
        label_en: `${speedVal} km/h`
      },
      armor: {
        value: armorVal,
        unit_es: "C.D.M.",
        unit_en: "M.D.C.",
        rating: Math.min(100, Math.round(armorVal / 5)),
        label_es: `${armorVal} C.D.M. Cuerpo`,
        label_en: `${armorVal} M.D.C. Main Body`
      },
      firepower: {
        value: firepowerVal,
        unit_es: "Pts",
        unit_en: "Pts",
        rating: firepowerVal,
        label_es: `${firepowerVal} Pts`,
        label_en: `${firepowerVal} Pts`
      },
      range: {
        value: rangeVal,
        unit_es: "km",
        unit_en: "km",
        rating: Math.min(100, Math.round(rangeVal * 7)),
        label_es: `${rangeVal} km`,
        label_en: `${rangeVal} km`
      },
      sensors: {
        value: sensorsVal,
        unit_es: "km",
        unit_en: "km",
        rating: Math.min(100, Math.round(sensorsVal / 3.5)),
        label_es: `${sensorsVal} km Radar`,
        label_en: `${sensorsVal} km Radar`
      },
      mobility: {
        value: mobilityVal,
        unit_es: "Pts",
        unit_en: "Pts",
        rating: mobilityVal,
        label_es: `${mobilityVal} Pts`,
        label_en: `${mobilityVal} Pts`
      }
    },
    dimensions: {
      height: { metric: document.getElementById('m_height').value },
      weight: { metric: document.getElementById('m_weight').value }
    },
    powerplant: {
      engine_es: document.getElementById('m_engine_es').value,
      engine_en: document.getElementById('m_engine_en').value
    },
    lore: {
      overview_es: document.getElementById('m_overview_es').value,
      overview_en: document.getElementById('m_overview_en').value,
      tactical_analysis_es: document.getElementById('m_tactical_es').value,
      tactical_analysis_en: document.getElementById('m_tactical_en').value
    },
    mdc_by_location: mdcList,
    weapons: wepList,
    special_equipment: currentMechaData?.special_equipment || []
  };
}

function setupExportButtons() {
  // 1. Botón Guardar Cambios (1 Clic en Disco)
  const btnSaveDirect = document.getElementById('btn-save-all-direct');
  if (btnSaveDirect) {
    btnSaveDirect.addEventListener('click', async () => {
      const data = buildCurrentMechaJSON();
      const consoleBox = document.getElementById('git-status-console');
      if (consoleBox) {
        consoleBox.style.display = 'block';
        consoleBox.innerHTML = '<span style="color:var(--un-cyan);">[*] Guardando cambios en el disco duro local...</span>';
      }

      try {
        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mecha: data, taxonomies: currentTaxonomies })
        });

        if (res.ok) {
          const result = await res.json();
          window.tacticalAudio?.scan();
          if (consoleBox) {
            consoleBox.innerHTML = `
              <span style="color: var(--radar-green); font-weight: bold;">✓ [ÉXITO] Archivos guardados en disco:</span>
              <br>• data/mechas/${data.id}.json
              <br>• data/manifest.json
              <br>• data/taxonomies.json
              <br><span style="color: var(--text-dim);">${result.message || ''}</span>
            `;
          }

          // Refrescar selector de mechas si es nuevo
          await loadAdminManifest();
          const select = document.getElementById('select-mecha-to-edit');
          if (select) select.value = data.id;

        } else {
          throw new Error("El servidor local respondió con error.");
        }
      } catch (err) {
        console.warn("Fallo guardado por API, usando fallback de descarga:", err);
        if (consoleBox) {
          consoleBox.innerHTML = '<span style="color: var(--skull-amber);">[!] Servidor API no disponible. Descargando archivos manualmente...</span>';
        }
        // Fallback: descarga directa si se ejecutó sin server.py
        downloadJSON(data, `${data.id}.json`);
      }
    });
  }

  // 2. Botón Subir a GitHub (Git Push)
  const btnGitPush = document.getElementById('btn-git-push-direct');
  if (btnGitPush) {
    btnGitPush.addEventListener('click', async () => {
      const data = buildCurrentMechaJSON();
      const consoleBox = document.getElementById('git-status-console');
      if (consoleBox) {
        consoleBox.style.display = 'block';
        consoleBox.innerHTML = '<span style="color: var(--skull-amber); font-weight: bold;">[*] Ejecutando protocolo militar Git: add, commit y push a GitHub...</span>\nPor favor espera unos segundos...';
      }

      btnGitPush.disabled = true;
      btnGitPush.style.opacity = '0.5';

      try {
        const res = await fetch('/api/git-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commitMessage: `Update Robotech Codex: ${data.name} (${data.id})` })
        });

        const result = await res.json();
        btnGitPush.disabled = false;
        btnGitPush.style.opacity = '1';

        if (res.ok && result.success) {
          window.tacticalAudio?.openDossier();
          if (consoleBox) {
            consoleBox.innerHTML = `
              <span style="color: var(--radar-green); font-weight: bold;">🚀 [GIT PUSH COMPLETADO CON ÉXITO]</span>
              <br><span style="color: #fff;">Repositorio: github.com/rick-0019/Robotech-Encyclopedia</span>
              <pre style="margin-top:6px; color:var(--text-muted); font-size:0.7rem;">${result.logs || 'Cambios sincronizados con GitHub.'}</pre>
            `;
          }
        } else {
          window.tacticalAudio?.alert();
          if (consoleBox) {
            consoleBox.innerHTML = `
              <span style="color: var(--veritech-red); font-weight: bold;">✕ [AVISO / REPORTE GIT]:</span>
              <pre style="margin-top:6px; color:#ff9999; font-size:0.7rem;">${result.error || result.logs || 'Verifica tus credenciales de Git o conexión.'}</pre>
            `;
          }
        }
      } catch (err) {
        btnGitPush.disabled = false;
        btnGitPush.style.opacity = '1';
        window.tacticalAudio?.alert();
        if (consoleBox) {
          consoleBox.innerHTML = `<span style="color: var(--veritech-red);">✕ Error de comunicación con server.py: ${err.message}</span>`;
        }
      }
    });
  }

  // 3. Toggle de exportación manual
  const btnToggleManual = document.getElementById('btn-toggle-manual-export');
  const manualBlock = document.getElementById('manual-export-block');
  if (btnToggleManual && manualBlock) {
    btnToggleManual.addEventListener('click', () => {
      manualBlock.style.display = manualBlock.style.display === 'none' ? 'flex' : 'none';
    });
  }

  // Descargas manuales opcionales
  document.getElementById('btn-export-mecha')?.addEventListener('click', () => {
    const data = buildCurrentMechaJSON();
    downloadJSON(data, `${data.id}.json`);
  });

  document.getElementById('btn-export-manifest')?.addEventListener('click', () => {
    if (!currentManifest) return;
    downloadJSON(currentManifest, 'manifest.json');
  });
}

function downloadJSON(obj, filename) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  window.tacticalAudio?.scan();
}

function updateFactionLogoPreview() {
  const sel = document.getElementById('m_faction_logo');
  const img = document.getElementById('faction_logo_preview');
  if (!sel || !img) return;
  let val = sel.value;
  if (!val) {
    const cat = document.getElementById('m_category_select')?.value || '';
    const fac = document.getElementById('m_faction_select')?.value || '';
    val = (cat === 'zentraedi' || fac.toLowerCase().includes('zentraedi') || fac.toLowerCase().includes('zentran')) 
      ? 'assets/images/ui/logo_zentran.png' 
      : 'assets/images/ui/logo_UNSpacy.png';
  }
  img.src = val;
}

// --------------------------------------------------------------------------
// 4. EXPLORADOR TÁCTICO DE IMÁGENES / ASSET BROWSER
// --------------------------------------------------------------------------
let currentAssetTarget = null;
let cachedAssetsList = [];
let cachedFoldersList = [];

window.openAssetBrowser = async function(target = 'm_thumbnail') {
  currentAssetTarget = target;
  const modal = document.getElementById('asset-browser-modal');
  if (modal) modal.style.display = 'flex';
  window.tacticalAudio?.hover();
  await loadProjectAssets();
};

window.openAssetBrowserForGalleryRow = function(btn) {
  const row = btn.closest('.gallery-admin-row');
  const input = row ? row.querySelector('.gal-url') : null;
  if (input) {
    window.openAssetBrowser(input);
  }
};

window.openAssetBrowserForNewGalleryItem = function() {
  window.openAssetBrowser('new_gallery_row');
};

window.closeAssetBrowser = function() {
  const modal = document.getElementById('asset-browser-modal');
  if (modal) modal.style.display = 'none';
  window.tacticalAudio?.click();
};

async function loadProjectAssets() {
  const label = document.getElementById('asset-count-label');
  if (label) label.textContent = 'Explorando archivos en assets/images/...';

  try {
    const res = await fetch(`/api/browse-images?_t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.images)) {
        cachedAssetsList = data.images;
        if (Array.isArray(data.folders)) {
          cachedFoldersList = data.folders;
        }
      }
    }
  } catch (err) {
    console.warn("No se pudo conectar a /api/browse-images, usando listado fallback:", err);
  }

  // Si falló o lista vacía, construir catálogo desde manifest
  if (!cachedAssetsList || cachedAssetsList.length === 0) {
    const fallbackImages = new Set();
    fallbackImages.add('assets/images/ui/logo_UNSpacy.png');
    fallbackImages.add('assets/images/ui/logo_zentran.png');
    (currentManifest?.mechas || []).forEach(m => {
      if (m.thumbnail && m.thumbnail.startsWith('assets/')) fallbackImages.add(m.thumbnail);
    });
    cachedAssetsList = Array.from(fallbackImages).map(p => {
      const parts = p.split('/');
      const name = parts[parts.length - 1];
      const folder = parts.slice(2, -1).join('/') || 'raíz';
      return { path: p, name: name, folder: folder, size_kb: 'OK' };
    });
  }

  // Poblar filtro de carpetas
  const folderFilter = document.getElementById('asset-folder-filter');
  if (folderFilter) {
    const foldersSet = new Set(cachedAssetsList.map(a => a.folder).filter(f => f && f !== 'raíz'));
    cachedFoldersList.forEach(f => foldersSet.add(f));
    const folders = Array.from(foldersSet).sort();
    const curVal = folderFilter.value || 'all';
    folderFilter.innerHTML = '<option value="all">📂 Todas las Carpetas</option>' + 
      folders.map(f => `<option value="${f}">📁 ${f}</option>`).join('');
    folderFilter.value = folders.includes(curVal) ? curVal : 'all';
  }

  filterAssetBrowserGrid();
}

window.filterAssetBrowserGrid = function() {
  const container = document.getElementById('asset-grid-container');
  const label = document.getElementById('asset-count-label');
  const folderVal = document.getElementById('asset-folder-filter')?.value || 'all';
  const query = (document.getElementById('asset-search-input')?.value || '').toLowerCase().trim();

  if (!container) return;

  const filtered = cachedAssetsList.filter(item => {
    if (folderVal !== 'all' && item.folder !== folderVal && !item.folder.startsWith(folderVal + '/')) return false;
    if (query && !item.name.toLowerCase().includes(query) && !item.folder.toLowerCase().includes(query)) return false;
    return true;
  });

  if (label) {
    label.textContent = `${filtered.length} imágenes encontradas`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; padding: 30px; text-align: center; color: var(--text-dim);">
        <p style="font-size: 1.1rem; margin-bottom: 6px;">No se encontraron imágenes en este criterio.</p>
        <p style="font-size: 0.8rem;">Podés usar el botón <strong>"Subir desde mi PC (Windows)"</strong> para añadir imágenes nuevas.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div class="asset-item-card" onclick="selectAsset('${item.path}')" title="${item.path}">
      <img src="${item.path}" class="asset-item-thumb" alt="${item.name}" loading="lazy">
      <div class="asset-item-details">
        <span class="asset-item-name" title="${item.name}">${item.name}</span>
        <span class="asset-item-meta">${item.folder}</span>
      </div>
    </div>
  `).join('');
};

window.selectAsset = function(path) {
  if (typeof currentAssetTarget === 'string') {
    if (currentAssetTarget === 'new_gallery_row') {
      const filename = path.split('/').pop().replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      addGalleryRow({
        url: path,
        title_es: filename,
        title_en: filename,
        type: 'render'
      });
      updateLivePreview();
    } else if (currentAssetTarget === 'new_char_gallery_row') {
      const filename = path.split('/').pop().replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      addCharGalleryRow({
        url: path,
        title_es: filename,
        title_en: filename,
        type_es: 'Retrato Oficial',
        type_en: 'Official Portrait'
      });
      updateLiveCharPreview();
    } else {
      const targetInput = document.getElementById(currentAssetTarget);
      if (targetInput) {
        targetInput.value = path;
        if (currentAssetTarget === 'm_faction_logo') {
          updateFactionLogoPreview();
        } else if (currentAssetTarget === 'c_faction_logo') {
          updateCharFactionLogoPreview();
        } else if (currentAssetTarget.startsWith('m_mode_')) {
          const mode = currentAssetTarget.replace('m_mode_', '').replace('_img', '');
          updateModePreview(mode);
        }
        updateLivePreview();
        updateLiveCharPreview();
      }
    }
  } else if (currentAssetTarget && typeof currentAssetTarget === 'object' && currentAssetTarget.tagName === 'INPUT') {
    currentAssetTarget.value = path;
    if (typeof syncCharRowThumb === 'function') syncCharRowThumb(currentAssetTarget);
    if (typeof syncRowThumb === 'function') syncRowThumb(currentAssetTarget);
    updateLivePreview();
    updateLiveCharPreview();
  }

  window.tacticalAudio?.scan();
  closeAssetBrowser();
};

window.handleNativeFileSelected = async function(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const statusEl = document.getElementById('asset-upload-status');
  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.innerHTML = `<span style="color:var(--un-cyan);">[*] Leyendo archivo <strong>${file.name}</strong>...</span>`;
  }

  // Determinar carpeta destino según módulo activo
  const selectedFolder = document.getElementById('asset-folder-filter')?.value;
  const mechaId = document.getElementById('m_id')?.value?.trim();
  const charId = document.getElementById('c_id')?.value?.trim();
  let folder = 'uploads';
  if (selectedFolder && selectedFolder !== 'all') {
    folder = selectedFolder;
  } else if (activeAdminModule === 'characters' && charId) {
    folder = `personajes/${charId}`;
  } else if (mechaId) {
    folder = mechaId;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;

    if (statusEl) {
      statusEl.innerHTML = `<span style="color:var(--skull-amber);">[*] Guardando en disco duro en [${folder}]: ${file.name}...</span>`;
    }

    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: folder,
          filename: file.name,
          data: base64Data
        })
      });

      const json = await res.json();
      if (json.success) {
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:#10b981;">✓ ¡Archivo guardado exitosamente en el disco duro!</span>`;
          setTimeout(() => { statusEl.style.display = 'none'; }, 2500);
        }
        await loadProjectAssets();
        selectAsset(json.path);
      } else {
        throw new Error(json.error || 'Error al guardar');
      }
    } catch (err) {
      console.warn("No se pudo subir vía /api/upload-image (posible entorno estático), usando dataUrl:", err);
      selectAsset(base64Data);
      if (statusEl) statusEl.style.display = 'none';
    }

    event.target.value = '';
  };

  reader.readAsDataURL(file);
};

// ==========================================================================
// 5. GESTIÓN DEL MÓDULO DE PERSONAJES (CRUD COMPLETO)
// ==========================================================================

function setupModuleView(moduleName) {
  activeAdminModule = moduleName;
  const layoutMechas = document.getElementById('admin-layout-mechas');
  const layoutChars = document.getElementById('admin-layout-characters');
  const topMechas = document.getElementById('top-mechas-controls');
  const topChars = document.getElementById('top-characters-controls');
  const titleBadge = document.getElementById('admin-title-badge');
  const subtitle = document.getElementById('admin-subtitle');

  if (moduleName === 'characters') {
    if (layoutMechas) layoutMechas.style.display = 'none';
    if (layoutChars) layoutChars.style.display = 'grid';
    if (topMechas) topMechas.style.display = 'none';
    if (topChars) topChars.style.display = 'flex';
    if (titleBadge) titleBadge.textContent = 'EXPEDIENTES // PERSONAJES';
    if (subtitle) subtitle.textContent = 'GESTIÓN CRUD DE PERSONAJES Y ASES MILITARES SDF-1';
    document.title = 'Robotech Admin Studio // Personajes';
  } else {
    if (layoutChars) layoutChars.style.display = 'none';
    if (layoutMechas) layoutMechas.style.display = 'grid';
    if (topChars) topChars.style.display = 'none';
    if (topMechas) topMechas.style.display = 'flex';
    if (titleBadge) titleBadge.textContent = 'CODEX // MECHAS';
    if (subtitle) subtitle.textContent = 'GESTIÓN CRUD DE MECHAS Y VEHÍCULOS DE COMBATE';
    document.title = 'Robotech Admin Studio // Mechas';
  }
}

window.switchAdminModule = function(moduleName) {
  setupModuleView(moduleName);
  if (moduleName === 'characters') {
    if (!currentCharManifest) loadAdminCharManifest();
    updateLiveCharPreview();
  } else {
    if (!currentManifest) loadAdminManifest();
    updateLivePreview();
  }
  window.tacticalAudio?.click();
};

async function loadAdminCharManifest() {
  try {
    const res = await fetch(`data/manifest_personajes.json?_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Could not load manifest_personajes.json");
    currentCharManifest = await res.json();
    populateCharSelect();
  } catch (err) {
    console.error("Error loading character manifest in admin:", err);
  }
}

function populateCharSelect() {
  const select = document.getElementById('select-character-to-edit');
  if (!select || !currentCharManifest) return;

  select.innerHTML = '<option value="">-- SELECCIONAR PERSONAJE EXISTENTE --</option>';
  (currentCharManifest.characters || []).forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.name} (${c.rank?.es || c.category || c.id})`;
    select.appendChild(opt);
  });

  select.onchange = async (e) => {
    const id = e.target.value;
    if (id) {
      await loadCharacterIntoForm(id);
    } else {
      initNewCharacter();
    }
  };

  const btnNew = document.getElementById('btn-new-character');
  if (btnNew) {
    btnNew.onclick = () => {
      initNewCharacter();
      select.value = '';
    };
  }

  // Preseleccionar primer personaje (ej: Lisa Hayes)
  if (select.options.length > 1 && !currentCharData) {
    select.selectedIndex = 1;
    loadCharacterIntoForm(select.value);
  }
}

async function loadCharacterIntoForm(id) {
  try {
    const res = await fetch(`data/personajes/${id}.json?_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Could not load character data for ${id}`);
    const data = await res.json();
    currentCharData = data;

    // 1. Identificación y Rol
    const elId = document.getElementById('c_id');
    if (elId) elId.value = data.id || '';
    const elName = document.getElementById('c_name');
    if (elName) elName.value = data.name || '';
    const elJp = document.getElementById('c_japanese_name');
    if (elJp) elJp.value = data.japanese_name || '';
    const elCall = document.getElementById('c_callsign');
    if (elCall) elCall.value = data.callsign || '';
    const elCat = document.getElementById('c_category');
    if (elCat && data.category) elCat.value = data.category;
    const elSer = document.getElementById('c_series_select');
    if (elSer && data.series?.es) elSer.value = data.series.es;

    const elRankEs = document.getElementById('c_rank_es');
    if (elRankEs) elRankEs.value = data.rank?.es || '';
    const elRankEn = document.getElementById('c_rank_en');
    if (elRankEn) elRankEn.value = data.rank?.en || '';
    const elRoleEs = document.getElementById('c_role_es');
    if (elRoleEs) elRoleEs.value = data.role?.es || '';
    const elRoleEn = document.getElementById('c_role_en');
    if (elRoleEn) elRoleEn.value = data.role?.en || '';
    const elAssEs = document.getElementById('c_assignment_es');
    if (elAssEs) elAssEs.value = data.assignment?.es || '';
    const elAssEn = document.getElementById('c_assignment_en');
    if (elAssEn) elAssEn.value = data.assignment?.en || '';

    const elFac = document.getElementById('c_faction_select');
    if (elFac && data.faction?.es) elFac.value = data.faction.es;
    const elLogo = document.getElementById('c_faction_logo');
    if (elLogo) {
      elLogo.value = data.faction_logo || 'assets/images/ui/logo_UNSpacy.png';
      window.updateCharFactionLogoPreview();
    }

    const elThumb = document.getElementById('c_thumbnail');
    if (elThumb) elThumb.value = data.thumbnail || '';

    // 2. Aptitudes
    const apt = data.aptitudes || {};
    const stats = data.stats || {};
    const elCmd = document.getElementById('c_stat_command');
    if (elCmd) elCmd.value = apt.command?.value || stats.command || 90;
    const elStr = document.getElementById('c_stat_strategy');
    if (elStr) elStr.value = apt.strategy?.value || stats.strategy || 90;
    const elRes = document.getElementById('c_stat_resolve');
    if (elRes) elRes.value = apt.resolve?.value || stats.resolve || 85;
    const elPil = document.getElementById('c_stat_piloting');
    if (elPil) elPil.value = apt.piloting?.value || stats.piloting || 70;

    // 3. Biométricos
    const elBirth = document.getElementById('c_birth_date');
    if (elBirth) elBirth.value = data.birth_date || '';
    const elBPlaceEs = document.getElementById('c_birth_place_es');
    if (elBPlaceEs) elBPlaceEs.value = data.birth_place?.es || '';
    const elBPlaceEn = document.getElementById('c_birth_place_en');
    if (elBPlaceEn) elBPlaceEn.value = data.birth_place?.en || '';
    const elBlood = document.getElementById('c_blood_type');
    if (elBlood) elBlood.value = data.blood_type || '';
    const elH = document.getElementById('c_height');
    if (elH) elH.value = data.height || '';
    const elW = document.getElementById('c_weight');
    if (elW) elW.value = data.weight || '';

    // 4. Dossier y Resumen
    const elSumEs = document.getElementById('c_summary_es');
    if (elSumEs) elSumEs.value = data.summary?.es || (data.lore?.overview_es ? data.lore.overview_es.substring(0, 160) + '...' : '');
    const elSumEn = document.getElementById('c_summary_en');
    if (elSumEn) elSumEn.value = data.summary?.en || (data.lore?.overview_en ? data.lore.overview_en.substring(0, 160) + '...' : '');
    const elOverEs = document.getElementById('c_overview_es');
    if (elOverEs) elOverEs.value = data.lore?.overview_es || '';
    const elOverEn = document.getElementById('c_overview_en');
    if (elOverEn) elOverEn.value = data.lore?.overview_en || '';
    const elTacEs = document.getElementById('c_tactical_es');
    if (elTacEs) elTacEs.value = data.lore?.tactical_analysis_es || '';
    const elTacEn = document.getElementById('c_tactical_en');
    if (elTacEn) elTacEn.value = data.lore?.tactical_analysis_en || '';

    // 5. Hoja de Servicio
    const srvContainer = document.getElementById('char-service-container');
    if (srvContainer) {
      srvContainer.innerHTML = '';
      (data.service_record || []).forEach(row => addCharServiceRow(row));
    }

    // 6. Relaciones
    const relContainer = document.getElementById('char-relations-container');
    if (relContainer) {
      relContainer.innerHTML = '';
      (data.relationships || []).forEach(row => addCharRelationRow(row));
    }

    // 7. Condecoraciones
    const elDec = document.getElementById('c_decorations');
    if (elDec) elDec.value = (data.decorations || []).join('\n');

    // 8. Galería
    const galContainer = document.getElementById('char-gallery-container');
    if (galContainer) {
      galContainer.innerHTML = '';
      (data.images || []).forEach(row => addCharGalleryRow(row));
    }

    updateLiveCharPreview();
  } catch (err) {
    console.error("Error loading character into form:", err);
  }
}

function initNewCharacter() {
  currentCharData = null;
  const form = document.getElementById('crud-form-char');
  if (form) form.reset();

  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  setVal('c_id', 'nuevo_personaje');
  setVal('c_name', 'Nuevo Personaje');
  setVal('c_japanese_name', '');
  setVal('c_callsign', '');
  setVal('c_category', 'command');
  setVal('c_series_select', 'La Saga Macross (Primera Guerra Robotech)');
  setVal('c_rank_es', 'Oficial / Piloto');
  setVal('c_rank_en', 'Officer / Pilot');
  setVal('c_role_es', 'Operaciones Tácticas');
  setVal('c_role_en', 'Tactical Operations');
  setVal('c_assignment_es', 'Fuerza de Defensa Robotech');
  setVal('c_assignment_en', 'Robotech Defense Force');
  setVal('c_faction_select', 'U.N. Spacy');
  setVal('c_faction_logo', 'assets/images/ui/logo_UNSpacy.png');
  window.updateCharFactionLogoPreview();
  setVal('c_thumbnail', 'assets/images/ui/logo_UNSpacy.png');

  setVal('c_stat_command', 85);
  setVal('c_stat_strategy', 85);
  setVal('c_stat_resolve', 85);
  setVal('c_stat_piloting', 75);

  setVal('c_birth_date', '');
  setVal('c_birth_place_es', 'Tierra');
  setVal('c_birth_place_en', 'Earth');
  setVal('c_blood_type', 'O+');
  setVal('c_height', '');
  setVal('c_weight', '');

  setVal('c_summary_es', '');
  setVal('c_summary_en', '');
  setVal('c_overview_es', '');
  setVal('c_overview_en', '');
  setVal('c_tactical_es', '');
  setVal('c_tactical_en', '');

  const srvContainer = document.getElementById('char-service-container');
  if (srvContainer) {
    srvContainer.innerHTML = '';
    addCharServiceRow({ period: '2009 - 2011', assignment_es: 'Asignación Inicial', assignment_en: 'Initial Assignment' });
  }

  const relContainer = document.getElementById('char-relations-container');
  if (relContainer) relContainer.innerHTML = '';
  setVal('c_decorations', '');

  const galContainer = document.getElementById('char-gallery-container');
  if (galContainer) {
    galContainer.innerHTML = '';
    addCharGalleryRow({
      url: 'assets/images/ui/logo_UNSpacy.png',
      title_es: 'Retrato de Servicio',
      title_en: 'Service Portrait',
      type_es: 'Retrato Oficial',
      type_en: 'Official Portrait'
    });
  }

  updateLiveCharPreview();
}

window.addCharServiceRow = function(data = {}) {
  const container = document.getElementById('char-service-container');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'dyn-list-item';
  div.innerHTML = `
    <button type="button" class="dyn-list-remove" onclick="this.closest('.dyn-list-item').remove();" title="Eliminar fila">✕</button>
    <div class="form-grid-3">
      <div class="form-group">
        <label>Período / Año</label>
        <input type="text" class="form-input srv-period" placeholder="ej: 2009 - 2011" value="${data.period || ''}">
      </div>
      <div class="form-group">
        <label>Asignación (Español)</label>
        <input type="text" class="form-input srv-es" placeholder="Destino militar en español" value="${data.assignment_es || ''}">
      </div>
      <div class="form-group">
        <label>Asignación (English)</label>
        <input type="text" class="form-input srv-en" placeholder="Assignment in English" value="${data.assignment_en || ''}">
      </div>
    </div>
  `;
  container.appendChild(div);
};

window.addCharRelationRow = function(data = {}) {
  const container = document.getElementById('char-relations-container');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'dyn-list-item';
  div.innerHTML = `
    <button type="button" class="dyn-list-remove" onclick="this.closest('.dyn-list-item').remove();" title="Eliminar fila">✕</button>
    <div class="form-grid-3">
      <div class="form-group">
        <label>Nombre del Personaje</label>
        <input type="text" class="form-input rel-name" placeholder="ej: Rick Hunter" value="${data.name || ''}">
      </div>
      <div class="form-group">
        <label>Vínculo (Español)</label>
        <input type="text" class="form-input rel-type-es" placeholder="ej: Compañero de Armas // Esposo" value="${data.relation_es || ''}">
      </div>
      <div class="form-group">
        <label>Vínculo (English)</label>
        <input type="text" class="form-input rel-type-en" placeholder="ej: Combat Partner // Husband" value="${data.relation_en || ''}">
      </div>
    </div>
    <div class="form-group" style="margin-bottom: 0;">
      <label>Notas de la Relación (Español)</label>
      <textarea class="form-textarea rel-notes" style="min-height: 50px;" placeholder="Detalles de la interacción militar o personal...">${data.notes_es || ''}</textarea>
    </div>
  `;
  container.appendChild(div);
};

window.addCharGalleryRow = function(data = {}) {
  const container = document.getElementById('char-gallery-container');
  if (!container) return;
  const thumbUrl = data.url || 'assets/images/ui/logo_UNSpacy.png';
  const isCover = document.getElementById('c_thumbnail')?.value === thumbUrl;
  const div = document.createElement('div');
  div.className = 'gallery-admin-row';
  div.innerHTML = `
    <img src="${thumbUrl}" class="gallery-admin-thumb" alt="Preview" onerror="this.src='assets/images/ui/logo_UNSpacy.png'">
    <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
      <div style="display: flex; gap: 8px;">
        <input type="text" class="form-input gal-char-url" placeholder="assets/images/personajes/... o URL" value="${data.url || ''}" oninput="syncCharRowThumb(this); updateLiveCharPreview();">
        <button type="button" class="btn-action-secondary" onclick="openAssetBrowserForCharGalleryRow(this)" style="padding: 4px 10px; font-size: 0.72rem; white-space: nowrap;">
          📁 ELEGIR
        </button>
      </div>
      <div class="form-grid-3" style="gap: 6px;">
        <input type="text" class="form-input gal-char-title-es" placeholder="Título foto (Español)" value="${data.title_es || ''}">
        <input type="text" class="form-input gal-char-title-en" placeholder="Title (English)" value="${data.title_en || ''}">
        <select class="form-select gal-char-type-es">
          <option value="Retrato Oficial" ${data.type_es === 'Retrato Oficial' ? 'selected' : ''}>Retrato Oficial</option>
          <option value="Misión Operativa" ${data.type_es === 'Misión Operativa' ? 'selected' : ''}>Misión Operativa</option>
          <option value="Registro Personal" ${data.type_es === 'Registro Personal' ? 'selected' : ''}>Registro Personal</option>
          <option value="Historial Temprano" ${data.type_es === 'Historial Temprano' ? 'selected' : ''}>Historial Temprano</option>
          <option value="Archivo Táctico" ${data.type_es === 'Archivo Táctico' ? 'selected' : ''}>Archivo Táctico</option>
          <option value="En Operación" ${data.type_es === 'En Operación' ? 'selected' : ''}>En Operación</option>
          <option value="Condecoración" ${data.type_es === 'Condecoración' ? 'selected' : ''}>Condecoración</option>
          <option value="Vigilancia Radar" ${data.type_es === 'Vigilancia Radar' ? 'selected' : ''}>Vigilancia Radar</option>
        </select>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
      <button type="button" class="btn-set-cover ${isCover ? 'active' : ''}" onclick="setAsCharThumbnail(this)">
        ${isCover ? '★ PORTADA ACTUAL' : '☆ HACER PORTADA'}
      </button>
      <button type="button" class="dyn-list-remove" style="position: static;" onclick="this.closest('.gallery-admin-row').remove(); updateLiveCharPreview();">✕</button>
    </div>
  `;
  container.appendChild(div);
};

window.syncCharRowThumb = function(input) {
  const row = input.closest('.gallery-admin-row');
  const img = row ? row.querySelector('.gallery-admin-thumb') : null;
  if (img) img.src = input.value || 'assets/images/ui/logo_UNSpacy.png';
};

window.setAsCharThumbnail = function(btn) {
  const row = btn.closest('.gallery-admin-row');
  const urlInp = row ? row.querySelector('.gal-char-url') : null;
  if (!urlInp || !urlInp.value) return;

  const thumbInput = document.getElementById('c_thumbnail');
  if (thumbInput) thumbInput.value = urlInp.value;

  document.querySelectorAll('#char-gallery-container .btn-set-cover').forEach(b => {
    b.classList.remove('active');
    b.textContent = '☆ HACER PORTADA';
  });
  btn.classList.add('active');
  btn.textContent = '★ PORTADA ACTUAL';

  updateLiveCharPreview();
  window.tacticalAudio?.scan();
};

window.openAssetBrowserForCharGalleryRow = function(btn) {
  const row = btn.closest('.gallery-admin-row');
  const input = row ? row.querySelector('.gal-char-url') : null;
  if (input) {
    window.openAssetBrowser(input);
  }
};

window.openAssetBrowserForNewCharGalleryItem = function() {
  window.openAssetBrowser('new_char_gallery_row');
};

window.updateCharFactionFromSelect = function() {
  const sel = document.getElementById('c_faction_select');
  const logoInp = document.getElementById('c_faction_logo');
  if (!sel || !logoInp) return;
  const opt = sel.selectedOptions[0];
  const logo = opt?.dataset?.logo;
  if (logo) {
    logoInp.value = logo;
  } else {
    const val = sel.value.toLowerCase();
    if (val.includes('marte') || val.includes('mars')) {
      logoInp.value = 'assets/images/ui/Mars_Base.png';
    } else if (val.includes('zentraedi') || val.includes('zentran')) {
      logoInp.value = 'assets/images/ui/logo_zentran.png';
    } else {
      logoInp.value = 'assets/images/ui/logo_UNSpacy.png';
    }
  }
  updateCharFactionLogoPreview();
  updateLiveCharPreview();
};

window.updateCharFactionLogoPreview = function() {
  const inp = document.getElementById('c_faction_logo');
  const img = document.getElementById('char_faction_logo_preview');
  if (inp && img) {
    img.src = inp.value || 'assets/images/ui/logo_UNSpacy.png';
  }
};

function updateLiveCharPreview() {
  const preview = document.getElementById('admin-live-char-card');
  if (!preview) return;

  const name = document.getElementById('c_name')?.value || 'NOMBRE DEL PERSONAJE';
  const rank = document.getElementById('c_rank_es')?.value || 'RANGO MILITAR';
  const assignment = document.getElementById('c_assignment_es')?.value || 'ASIGNACIÓN OPERATIVA';
  const faction = document.getElementById('c_faction_select')?.value || 'U.N. Spacy';
  const logo = document.getElementById('c_faction_logo')?.value || 'assets/images/ui/logo_UNSpacy.png';
  const thumb = document.getElementById('c_thumbnail')?.value || 'assets/images/ui/logo_UNSpacy.png';
  const summary = document.getElementById('c_summary_es')?.value || 'Resumen biográfico táctico del personaje...';

  const cmd = parseInt(document.getElementById('c_stat_command')?.value) || 85;
  const str = parseInt(document.getElementById('c_stat_strategy')?.value) || 85;
  const res = parseInt(document.getElementById('c_stat_resolve')?.value) || 85;
  const pil = parseInt(document.getElementById('c_stat_piloting')?.value) || 75;

  preview.innerHTML = `
    <div class="mecha-card" style="box-shadow: none;">
      <div class="card-header-status">
        <div class="card-faction-badge" title="${faction}">
          <img src="${logo}" class="card-faction-icon" alt="${faction}" onerror="this.src='assets/images/ui/logo_UNSpacy.png'">
          <span class="faction-tag">${faction}</span>
        </div>
        <div style="display: flex; align-items: center;">
          <span class="badge-tag" style="border-color: var(--skull-amber); color: var(--skull-amber);">EXPEDIENTE</span>
        </div>
      </div>

      <div class="card-image-wrap" style="height: 220px; position: relative;">
        <img src="${thumb}" alt="${name}" onerror="this.src='assets/images/ui/logo_UNSpacy.png'" style="object-position: center 15%;">
        <div class="image-overlay-hud"></div>
      </div>

      <div class="card-body">
        <div class="card-title-group">
          <h3 class="card-title">${name}</h3>
          <div class="card-alias">${rank}</div>
        </div>

        <div style="margin-bottom: 8px; font-family: var(--font-mono); font-size: 0.72rem; color: var(--un-cyan); letter-spacing: 0.8px;">
          ⌖ ${assignment}
        </div>

        <p class="card-summary">${summary}</p>

        <div class="stats-bars-container">
          <div class="stat-row">
            <span class="stat-label">MANDO</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill speed" style="width: ${cmd}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${cmd}</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">ESTRATEGIA</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill armor" style="width: ${str}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${str}</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">RESOLUCIÓN</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill sensors" style="width: ${res}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${res}</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">PILOTAJE</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill firepower" style="width: ${pil}%;"></div>
            </div>
            <span class="stat-value" style="width: auto;">${pil}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildCurrentCharJSON() {
  const id = document.getElementById('c_id')?.value.trim() || 'nuevo_personaje';
  const name = document.getElementById('c_name')?.value.trim() || 'Nuevo Personaje';
  const jp = document.getElementById('c_japanese_name')?.value.trim() || '';
  const callsign = document.getElementById('c_callsign')?.value.trim() || '';
  const category = document.getElementById('c_category')?.value || 'command';

  const serSel = document.getElementById('c_series_select');
  const series_es = serSel ? serSel.value : 'La Saga Macross (Primera Guerra Robotech)';
  const series_en = serSel?.selectedOptions[0]?.dataset?.en || series_es;

  const rank_es = document.getElementById('c_rank_es')?.value.trim() || '';
  const rank_en = document.getElementById('c_rank_en')?.value.trim() || rank_es;

  const role_es = document.getElementById('c_role_es')?.value.trim() || '';
  const role_en = document.getElementById('c_role_en')?.value.trim() || role_es;

  const assign_es = document.getElementById('c_assignment_es')?.value.trim() || '';
  const assign_en = document.getElementById('c_assignment_en')?.value.trim() || assign_es;

  const facSel = document.getElementById('c_faction_select');
  const faction_es = facSel ? facSel.value : 'U.N. Spacy';
  const faction_en = facSel?.selectedOptions[0]?.dataset?.en || faction_es;
  const faction_logo = document.getElementById('c_faction_logo')?.value || 'assets/images/ui/logo_UNSpacy.png';

  const thumbnail = document.getElementById('c_thumbnail')?.value.trim() || 'assets/images/ui/logo_UNSpacy.png';

  const cmdVal = parseInt(document.getElementById('c_stat_command')?.value) || 85;
  const strVal = parseInt(document.getElementById('c_stat_strategy')?.value) || 85;
  const resVal = parseInt(document.getElementById('c_stat_resolve')?.value) || 85;
  const pilVal = parseInt(document.getElementById('c_stat_piloting')?.value) || 75;

  const birth_date = document.getElementById('c_birth_date')?.value.trim() || '';
  const birth_place_es = document.getElementById('c_birth_place_es')?.value.trim() || '';
  const birth_place_en = document.getElementById('c_birth_place_en')?.value.trim() || birth_place_es;
  const blood_type = document.getElementById('c_blood_type')?.value.trim() || '';
  const height = document.getElementById('c_height')?.value.trim() || '';
  const weight = document.getElementById('c_weight')?.value.trim() || '';

  const summary_es = document.getElementById('c_summary_es')?.value.trim() || '';
  const summary_en = document.getElementById('c_summary_en')?.value.trim() || summary_es;
  const overview_es = document.getElementById('c_overview_es')?.value.trim() || '';
  const overview_en = document.getElementById('c_overview_en')?.value.trim() || overview_es;
  const tactical_es = document.getElementById('c_tactical_es')?.value.trim() || '';
  const tactical_en = document.getElementById('c_tactical_en')?.value.trim() || tactical_es;

  // Hoja de Servicio
  const serviceList = [];
  document.querySelectorAll('#char-service-container .dyn-list-item').forEach(el => {
    const period = el.querySelector('.srv-period')?.value.trim();
    const ass_es = el.querySelector('.srv-es')?.value.trim();
    const ass_en = el.querySelector('.srv-en')?.value.trim();
    if (period || ass_es) {
      serviceList.push({
        period: period,
        assignment_es: ass_es,
        assignment_en: ass_en || ass_es
      });
    }
  });

  // Relaciones
  const relList = [];
  document.querySelectorAll('#char-relations-container .dyn-list-item').forEach(el => {
    const relName = el.querySelector('.rel-name')?.value.trim();
    const rel_es = el.querySelector('.rel-type-es')?.value.trim();
    const rel_en = el.querySelector('.rel-type-en')?.value.trim();
    const notes = el.querySelector('.rel-notes')?.value.trim();
    if (relName) {
      relList.push({
        name: relName,
        relation_es: rel_es,
        relation_en: rel_en || rel_es,
        notes_es: notes
      });
    }
  });

  // Condecoraciones
  const decRaw = document.getElementById('c_decorations')?.value || '';
  const decorations = decRaw.split('\n').map(d => d.trim()).filter(d => d.length > 0);

  // Galería
  const imagesList = [];
  document.querySelectorAll('#char-gallery-container .gallery-admin-row').forEach(row => {
    const url = row.querySelector('.gal-char-url')?.value.trim();
    if (url) {
      const typeEs = row.querySelector('.gal-char-type-es')?.value || 'Retrato Oficial';
      const typeMapEn = {
        'Retrato Oficial': 'Official Portrait',
        'Misión Operativa': 'Field Mission',
        'Registro Personal': 'Personal Log',
        'Historial Temprano': 'Early Career',
        'Archivo Táctico': 'Tactical File',
        'En Operación': 'In Operation',
        'Condecoración': 'Commendation',
        'Vigilancia Radar': 'Radar Surveillance'
      };
      imagesList.push({
        url: url,
        title_es: row.querySelector('.gal-char-title-es')?.value.trim() || name,
        title_en: row.querySelector('.gal-char-title-en')?.value.trim() || name,
        type_es: typeEs,
        type_en: typeMapEn[typeEs] || typeEs
      });
    }
  });

  return {
    id: id,
    name: name,
    japanese_name: jp,
    callsign: callsign,
    rank: { es: rank_es, en: rank_en },
    role: { es: role_es, en: role_en },
    category: category,
    faction: { es: faction_es, en: faction_en },
    faction_logo: faction_logo,
    series: { es: series_es, en: series_en },
    assignment: { es: assign_es, en: assign_en },
    birth_date: birth_date,
    birth_place: { es: birth_place_es, en: birth_place_en },
    blood_type: blood_type,
    height: height,
    weight: weight,
    thumbnail: thumbnail,
    images: imagesList.length > 0 ? imagesList : [{ url: thumbnail, title_es: name, title_en: name, type_es: "Retrato Oficial", type_en: "Official Portrait" }],
    summary: { es: summary_es, en: summary_en },
    lore: {
      overview_es: overview_es,
      overview_en: overview_en,
      tactical_analysis_es: tactical_es,
      tactical_analysis_en: tactical_en
    },
    aptitudes: {
      command: {
        value: cmdVal,
        label_es: "Mando y Liderazgo Táctico",
        label_en: "Command & Tactical Leadership",
        desc_es: "Capacidad para comandar flotas y operaciones tácticas a gran escala."
      },
      strategy: {
        value: strVal,
        label_es: "Estrategia e Inteligencia Militar",
        label_en: "Strategic Intelligence & Planning",
        desc_es: "Maestría en análisis balístico, predicción de movimientos y logística bélica."
      },
      resolve: {
        value: resVal,
        label_es: "Resolución y Templanza bajo Fuego",
        label_en: "Poise & Crisis Resolution",
        desc_es: "Serenidad mental y toma de decisiones crítica en condiciones extremas."
      },
      piloting: {
        value: pilVal,
        label_es: "Habilidad de Vuelo y Pilotaje",
        label_en: "Flight & Piloting Proficiency",
        desc_es: "Aptitud de pilotaje de cazas aeroespaciales y maniobras de evasión."
      }
    },
    stats: {
      command: cmdVal,
      strategy: strVal,
      resolve: resVal,
      piloting: pilVal
    },
    service_record: serviceList,
    relationships: relList,
    decorations: decorations
  };
}

function setupCharEventListeners() {
  document.getElementById('crud-form-char')?.addEventListener('input', () => {
    updateLiveCharPreview();
  });
}

function setupCharExportButtons() {
  const btnSaveChar = document.getElementById('btn-save-char-direct');
  if (btnSaveChar) {
    btnSaveChar.addEventListener('click', async () => {
      const data = buildCurrentCharJSON();
      const consoleBox = document.getElementById('git-status-console-char');
      if (consoleBox) {
        consoleBox.style.display = 'block';
        consoleBox.innerHTML = '<span style="color:var(--un-cyan);">[*] Guardando expediente militar en el disco duro local...</span>';
      }

      try {
        const res = await fetch('/api/save-character', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ character: data })
        });

        if (res.ok) {
          const result = await res.json();
          window.tacticalAudio?.scan();
          if (consoleBox) {
            consoleBox.innerHTML = `
              <span style="color: var(--radar-green); font-weight: bold;">✓ [ÉXITO] Expediente guardado en disco:</span>
              <br>• data/personajes/${data.id}.json
              <br>• data/manifest_personajes.json
              <br><span style="color: var(--text-dim);">${result.message || ''}</span>
            `;
          }

          // Refrescar selector de personajes
          await loadAdminCharManifest();
          const select = document.getElementById('select-character-to-edit');
          if (select) select.value = data.id;

        } else {
          throw new Error("El servidor local respondió con error.");
        }
      } catch (err) {
        console.warn("Fallo guardado por API /api/save-character, usando fallback:", err);
        if (consoleBox) {
          consoleBox.innerHTML = '<span style="color: var(--skull-amber);">[!] Servidor API no disponible. Descargando archivo JSON manualmente...</span>';
        }
        downloadJSON(data, `${data.id}.json`);
      }
    });
  }

  const btnDlChar = document.getElementById('btn-download-char-json');
  if (btnDlChar) {
    btnDlChar.addEventListener('click', () => {
      const data = buildCurrentCharJSON();
      downloadJSON(data, `${data.id}.json`);
    });
  }
}

window.addMdcRow = addMdcRow;
window.addWeaponRow = addWeaponRow;
window.addGalleryRow = addGalleryRow;
window.updateLivePreview = updateLivePreview;
window.updateLiveCharPreview = updateLiveCharPreview;
window.updateFactionLogoPreview = updateFactionLogoPreview;


