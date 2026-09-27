/**
 * Robotech Mecha Comparison Engine
 * Comparador táctico que respeta las unidades físicas reales de cada barra (km/h, C.D.M., km, Pts).
 */

class MechaComparator {
  constructor() {
    this.selectedIds = [];
    this.maxSelections = 3;
    this.fullMechas = {};
  }

  init() {
    this.renderDock();
    this.setupListeners();
  }

  setupListeners() {
    const btnOpen = document.getElementById('btn-open-compare');
    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        window.tacticalAudio?.scan();
        this.openCompareModal();
      });
    }

    const btnClear = document.getElementById('btn-clear-compare');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        window.tacticalAudio?.click();
        this.clearAll();
      });
    }

    const btnCloseModal = document.getElementById('btn-close-compare-modal');
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => {
        window.tacticalAudio?.click();
        this.closeCompareModal();
      });
    }

    const modalBackdrop = document.getElementById('compare-modal-backdrop');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
          this.closeCompareModal();
        }
      });
    }
  }

  toggleMecha(id) {
    if (this.selectedIds.includes(id)) {
      this.removeMecha(id);
    } else {
      this.addMecha(id);
    }
  }

  addMecha(id) {
    if (this.selectedIds.includes(id)) return;
    if (this.selectedIds.length >= this.maxSelections) {
      window.tacticalAudio?.alert();
      const lang = window.appState ? window.appState.lang : 'es';
      alert(lang === 'es' ? 'Máximo 3 mechas para comparar simultáneamente.' : 'Maximum 3 mechas to compare simultaneously.');
      return;
    }
    this.selectedIds.push(id);
    window.tacticalAudio?.addToCompare();
    this.renderDock();
    this.updateCardButtons();
  }

  removeMecha(id) {
    this.selectedIds = this.selectedIds.filter(item => item !== id);
    window.tacticalAudio?.click();
    this.renderDock();
    this.updateCardButtons();
    if (document.getElementById('compare-modal-backdrop')?.classList.contains('open')) {
      if (this.selectedIds.length < 2) {
        this.closeCompareModal();
      } else {
        this.renderCompareModal();
      }
    }
  }

  clearAll() {
    this.selectedIds = [];
    this.renderDock();
    this.updateCardButtons();
    this.closeCompareModal();
  }

  isSelected(id) {
    return this.selectedIds.includes(id);
  }

  updateCardButtons() {
    document.querySelectorAll('.btn-compare-toggle').forEach(btn => {
      const id = btn.dataset.id;
      const isSel = this.isSelected(id);
      btn.classList.toggle('active', isSel);
      const lang = window.appState ? window.appState.lang : 'es';
      btn.innerHTML = isSel 
        ? `✓ ${lang === 'es' ? 'LISTO' : 'READY'}`
        : `⚔ ${lang === 'es' ? 'COMPARAR' : 'COMPARE'}`;
    });
  }

  renderDock() {
    const dock = document.getElementById('comparator-dock');
    if (!dock) return;

    if (this.selectedIds.length === 0) {
      dock.classList.remove('visible');
      return;
    }

    dock.classList.add('visible');
    const slotsContainer = document.getElementById('dock-slots');
    if (!slotsContainer) return;

    const manifest = window.appState?.manifest?.mechas || [];
    const lang = window.appState ? window.appState.lang : 'es';

    let html = '';
    for (let i = 0; i < this.maxSelections; i++) {
      const id = this.selectedIds[i];
      if (id) {
        const mecha = manifest.find(m => m.id === id);
        html += `
          <div class="dock-slot filled">
            <img src="${mecha?.thumbnail || ''}" class="dock-slot-img" alt="${mecha?.name || ''}">
            <span class="dock-slot-name">${mecha?.name || id}</span>
            <button class="dock-slot-remove" onclick="window.mechaComparator.removeMecha('${id}')" title="Quitar">×</button>
          </div>
        `;
      } else {
        html += `
          <div class="dock-slot">
            <span style="font-size: 0.7rem; color: var(--text-dim);">[ ${lang === 'es' ? 'SLOT VACÍO' : 'EMPTY SLOT'} ]</span>
          </div>
        `;
      }
    }
    slotsContainer.innerHTML = html;

    const btnOpen = document.getElementById('btn-open-compare');
    if (btnOpen) {
      const count = this.selectedIds.length;
      btnOpen.disabled = count < 2;
      btnOpen.style.opacity = count < 2 ? '0.5' : '1';
      btnOpen.textContent = lang === 'es' 
        ? `COMPARAR AHORA (${count}/${this.maxSelections})` 
        : `COMPARE NOW (${count}/${this.maxSelections})`;
    }
  }

  async openCompareModal() {
    if (this.selectedIds.length < 2) return;
    const modalBackdrop = document.getElementById('compare-modal-backdrop');
    if (!modalBackdrop) return;

    modalBackdrop.classList.add('open');
    await this.loadSelectedFullData();
    this.renderCompareModal();
  }

  closeCompareModal() {
    const modalBackdrop = document.getElementById('compare-modal-backdrop');
    if (modalBackdrop) modalBackdrop.classList.remove('open');
  }

  async loadSelectedFullData() {
    for (const id of this.selectedIds) {
      if (!this.fullMechas[id]) {
        try {
          const res = await fetch(`data/mechas/${id}.json`);
          if (res.ok) {
            this.fullMechas[id] = await res.json();
          }
        } catch (e) {
          console.error("Error loading mecha for comparison:", id, e);
        }
      }
    }
  }

  renderCompareModal() {
    const container = document.getElementById('compare-content-scroll');
    if (!container) return;

    const lang = window.appState ? window.appState.lang : 'es';
    const mechas = this.selectedIds.map(id => this.fullMechas[id]).filter(Boolean);

    if (mechas.length < 2) {
      container.innerHTML = `<p>${lang === 'es' ? 'Selecciona al menos 2 mechas para comparar.' : 'Select at least 2 mechas to compare.'}</p>`;
      return;
    }

    const colors = ['#00f0ff', '#ff9d00', '#10b981'];

    // 1. Column headers
    let bannerHtml = `<div class="compare-mechas-banner" style="grid-template-columns: repeat(${mechas.length}, 1fr);">`;
    mechas.forEach((m, idx) => {
      const fLogo = m.faction_logo || (m.category === 'zentraedi' ? 'assets/images/ui/logo_zentran.png' : 'assets/images/ui/logo.png');
      const fName = m.faction[lang] || m.faction.en || '';
      bannerHtml += `
        <div class="compare-mecha-col" style="border-top: 3px solid ${colors[idx]}">
          <div style="position: relative; display: inline-block;">
            <img src="${m.thumbnail}" class="compare-mecha-thumb" alt="${m.name}">
            <img src="${fLogo}" class="compare-faction-logo" alt="${fName}" title="${fName}">
          </div>
          <h3>${m.name}</h3>
          <div class="col-alias">${m.alias}</div>
          <div class="col-faction">${fName}</div>
        </div>
      `;
    });
    bannerHtml += `</div>`;

    // 2. Definición estricta de barras con unidades físicas
    const statConfigs = [
      {
        key: 'speed',
        title_es: 'VELOCIDAD MÁXIMA',
        title_en: 'MAXIMUM SPEED',
        unit_es: 'km/h',
        unit_en: 'km/h',
        getVal: (m) => m.stats?.speed?.value || m.stats?.speed?.value_kmh || m.stats?.speed?.rating || 0,
        formatLabel: (m) => m.stats?.speed?.[`label_${lang}`] || `${m.stats?.speed?.value || 0} km/h`
      },
      {
        key: 'armor',
        title_es: 'BLINDAJE PRINCIPAL',
        title_en: 'ARMOR CAPACITY',
        unit_es: 'C.D.M. (M.D.C.)',
        unit_en: 'M.D.C.',
        getVal: (m) => m.stats?.armor?.value || m.stats?.armor?.main_body_mdc || m.stats?.armor?.rating || 0,
        formatLabel: (m) => m.stats?.armor?.[`label_${lang}`] || `${m.stats?.armor?.value || 0} C.D.M.`
      },
      {
        key: 'firepower',
        title_es: 'POTENCIA OFENSIVA',
        title_en: 'FIREPOWER RATING',
        unit_es: 'Puntos / Daño',
        unit_en: 'Rating / Damage',
        getVal: (m) => m.stats?.firepower?.value || m.stats?.firepower?.rating || 0,
        formatLabel: (m) => m.stats?.firepower?.[`label_${lang}`] || `${m.stats?.firepower?.value || 0} Pts`
      },
      {
        key: 'range',
        title_es: 'ALCANCE EFECTIVO',
        title_en: 'EFFECTIVE RANGE',
        unit_es: 'km',
        unit_en: 'km',
        getVal: (m) => m.stats?.range?.value || m.stats?.range?.value_km || m.stats?.range?.rating || 0,
        formatLabel: (m) => m.stats?.range?.[`label_${lang}`] || `${m.stats?.range?.value || 0} km`
      },
      {
        key: 'sensors',
        title_es: 'ALCANCE DE RADAR / SENSORES',
        title_en: 'RADAR / SENSORS RANGE',
        unit_es: 'km',
        unit_en: 'km',
        getVal: (m) => m.stats?.sensors?.value || m.stats?.sensors?.radar_range_km || m.stats?.sensors?.rating || 0,
        formatLabel: (m) => m.stats?.sensors?.[`label_${lang}`] || `${m.stats?.sensors?.value || 0} km`
      },
      {
        key: 'mobility',
        title_es: 'MANIOBRABILIDAD TÁCTICA',
        title_en: 'TACTICAL MOBILITY',
        unit_es: 'Puntos',
        unit_en: 'Points',
        getVal: (m) => m.stats?.mobility?.value || m.stats?.mobility?.rating || 0,
        formatLabel: (m) => m.stats?.mobility?.[`label_${lang}`] || `${m.stats?.mobility?.value || 0} Pts`
      }
    ];

    let barsHtml = `
      <div class="compare-bars-section">
        <h4>${lang === 'es' ? 'TELEMETRÍA COMPARATIVA (UNIDADES REALES)' : 'COMPARATIVE TELEMETRY (REAL UNITS)'}</h4>
    `;

    statConfigs.forEach(conf => {
      const title = lang === 'es' ? conf.title_es : conf.title_en;
      const unit = lang === 'es' ? conf.unit_es : conf.unit_en;

      // Calcular el valor máximo entre los mechas seleccionados para calcular barras proporcionales
      let maxVal = 0;
      let leaderIdx = -1;

      mechas.forEach((m, idx) => {
        const val = conf.getVal(m);
        if (val > maxVal) {
          maxVal = val;
          leaderIdx = idx;
        }
      });

      barsHtml += `
        <div class="stat-duel-block">
          <div class="duel-header">
            <span>${title} <strong style="color: var(--skull-amber); font-size: 0.8rem;">[${unit}]</strong></span>
            <span style="font-size: 0.72rem; color: var(--text-dim);">${lang === 'es' ? 'COMPARACIÓN PROPORCIONAL' : 'PROPORTIONAL RATIO'}</span>
          </div>
          <div class="duel-mecha-bars">
      `;

      mechas.forEach((m, idx) => {
        const numVal = conf.getVal(m);
        // Barra proporcional al mecha con mayor valor (el líder tiene 100% de ancho)
        let barPercent = maxVal > 0 ? Math.round((numVal / maxVal) * 100) : 0;
        if (barPercent < 10 && numVal > 0) barPercent = 10; // mínimo para ser visible

        const isLeader = idx === leaderIdx && mechas.length > 1;
        const displayLabel = conf.formatLabel(m);

        barsHtml += `
          <div class="duel-bar-row">
            <span class="duel-mecha-name" style="color: ${colors[idx]}">● ${m.name}</span>
            <div class="duel-bar-track">
              <div class="duel-bar-fill" style="width: ${barPercent}%; background: ${colors[idx]};">
                ${numVal > 0 ? numVal : ''}
              </div>
            </div>
            <div class="duel-stat-value" style="width: 240px; text-align: right;">
              <span style="color: #fff;">${displayLabel}</span>
              ${isLeader ? `<span class="winner-badge" style="margin-left: 6px;">▲ ${lang === 'es' ? 'LÍDER' : 'LEADER'}</span>` : ''}
            </div>
          </div>
        `;
      });

      barsHtml += `
          </div>
        </div>
      `;
    });
    barsHtml += `</div>`;

    // 3. Technical Specs Cross Table
    let tableHtml = `
      <div class="compare-table-section">
        <h4>${lang === 'es' ? 'CUADRO TÉCNICO DE ESPECIFICACIONES' : 'TECHNICAL SPECIFICATIONS MATRIX'}</h4>
        <table class="specs-duel-table">
          <thead>
            <tr>
              <th>${lang === 'es' ? 'PARÁMETRO' : 'SPECIFICATION'}</th>
              ${mechas.map(m => `<th>${m.name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${lang === 'es' ? 'Tipo de Mecha' : 'Vehicle Type'}</td>
              ${mechas.map(m => `<td>${m.vehicle_type[lang] || m.vehicle_type.en}</td>`).join('')}
            </tr>
            <tr>
              <td>${lang === 'es' ? 'Tripulación' : 'Crew'}</td>
              ${mechas.map(m => `<td>${m.crew[lang] || m.crew.en}</td>`).join('')}
            </tr>
            <tr>
              <td>${lang === 'es' ? 'Altura' : 'Height'}</td>
              ${mechas.map(m => `<td>${m.dimensions?.height?.metric || 'N/A'}</td>`).join('')}
            </tr>
            <tr>
              <td>${lang === 'es' ? 'Peso' : 'Weight'}</td>
              ${mechas.map(m => `<td>${m.dimensions?.weight?.metric || 'N/A'}</td>`).join('')}
            </tr>
            <tr>
              <td>${lang === 'es' ? 'Planta de Poder / Motor' : 'Powerplant / Engine'}</td>
              ${mechas.map(m => `<td>${m.powerplant?.[`engine_${lang}`] || m.powerplant?.engine_en || 'N/A'}</td>`).join('')}
            </tr>
            <tr>
              <td>${lang === 'es' ? 'Armamento Principal' : 'Primary Armament'}</td>
              ${mechas.map(m => `<td>${m.weapons?.[0]?.[`name_${lang}`] || m.weapons?.[0]?.name_en || 'N/A'}</td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = bannerHtml + barsHtml + tableHtml;
  }
}

window.mechaComparator = new MechaComparator();
