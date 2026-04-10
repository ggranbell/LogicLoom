// ─── VIEW SWITCHING ───
export function initUI() {
  // Navigation tabs
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const viewName = e.target.textContent.toLowerCase().replace(/[^a-z]/g, '');
      switchView(viewName, e.target);
    });
  });

  // Profile avatar click
  const avatar = document.querySelector('.nav-avatar');
  if(avatar) {
    avatar.addEventListener('click', () => switchView('profile', null));
  }

  // Play VN button
  const playBtns = document.querySelectorAll('.play-btn');
  playBtns.forEach(btn => {
    if(btn.textContent.includes('Visual Novel')) {
      btn.addEventListener('click', () => {
        const resetVN = window.resetVN;
        if(resetVN) resetVN();
        document.getElementById('vnOverlay').classList.add('open');
      });
    }
  });

  // CSV Modal
  const csvBtns = document.querySelectorAll('button[onclick="openCSVModal()"], .export-btn, .alert-link');
  csvBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCSVModal();
    });
  });

  const closeBtns = document.querySelectorAll('.modal-close, .btn-secondary');
  closeBtns.forEach(btn => {
    btn.addEventListener('click', closeCSVModal);
  });

  const modalOverlay = document.getElementById('csvModal');
  if(modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeCSVModal();
    });
  }

  const exportOpts = document.querySelectorAll('.export-option');
  exportOpts.forEach(opt => {
    opt.addEventListener('click', () => toggleOpt(opt.id, opt));
  });

  const dlBtn = document.querySelector('.btn-primary');
  if(dlBtn) {
    dlBtn.addEventListener('click', doExport);
  }

  buildHeatmap();
}

function switchView(name, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  
  const targetView = document.getElementById(name + 'View');
  if (targetView) targetView.classList.add('active');
  
  if (btn) btn.classList.add('active');
  else {
    document.querySelectorAll('.nav-tab').forEach(t => {
      if (t.textContent.toLowerCase().includes(name)) t.classList.add('active');
    });
  }
}

// ─── HEATMAP ───
function buildHeatmap() {
  const heat = document.getElementById('heatmap');
  if (!heat) return;
  const levels = [0,0,1,0,2,1,3,0,0,2,4,3,2,1,0,3,4,3,1,0,2,3,4,4,2,1,3,2,0,1,4,3,2,0,1,2,3,4,3,2,1,0,1,2,3,4,4,3,2,1,0,2,3,2,1,0];
  levels.forEach(l => {
    const c = document.createElement('div');
    c.className = 'hmap-cell h' + l;
    heat.appendChild(c);
  });
}

// ─── CSV EXPORT MODAL ───
const selected = new Set(['opt1','opt2']);
function openCSVModal() {
  const modal = document.getElementById('csvModal');
  if(modal) modal.classList.add('open');
}
function closeCSVModal() { 
  const modal = document.getElementById('csvModal');
  if(modal) modal.classList.remove('open');
  const dlp = document.getElementById('dlProgress');
  if(dlp) dlp.classList.remove('show');
  const note = document.getElementById('modalNote');
  if(note) note.style.display = '';
}
function toggleOpt(id, el) {
  el.classList.toggle('selected');
  const check = el.querySelector('.option-check');
  if(check) check.textContent = el.classList.contains('selected') ? '✓' : '';
  
  selected.has(id) ? selected.delete(id) : selected.add(id);
  const n = selected.size;
  const note = document.getElementById('modalNote');
  if(note) note.textContent = `${n} report${n!==1?'s':''} selected · ~28 rows`;
}
function doExport() {
  if (selected.size === 0) { alert('Please select at least one report type.'); return; }
  const note = document.getElementById('modalNote');
  if(note) note.style.display = 'none';
  const dlp = document.getElementById('dlProgress');
  if(dlp) dlp.classList.add('show');
  
  // Simulate CSV generation
  setTimeout(() => {
    const rows = [
      ['Student','Status','Chapter','Accuracy','Flags','Streak'],
      ['Amara Garcia','Active','5','88%','0','9'],
      ['Berto Reyes','Struggling','3','41%','3','2'],
      ['Clara Mendoza','Completed','7','95%','0','15'],
      ['Diego Pineda','Struggling','4','54%','4','5'],
      ['Ella Santos','Active','5','78%','0','7'],
      ['Felix dela Cruz','Idle','3','62%','0','1'],
      ['Gia Torres','Struggling','2','35%','5','3'],
      ['Hiro Lim','Active','6','82%','0','11'],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'LogicLoom_ClassReport_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    
    if(dlp) dlp.classList.remove('show');
    if(note) note.style.display = '';
    closeCSVModal();
  }, 1800);
}
