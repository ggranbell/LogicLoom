const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'public', 'data', 'prince_eternal_flame.json');
const story = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const base = path.join(__dirname, 'assets', 'Voice');
const mappedBase = path.join(base, 'Mapped');
if (!fs.existsSync(mappedBase)) fs.mkdirSync(mappedBase);

const dirs = fs.readdirSync(base).filter(d => d !== 'Mapped' && fs.statSync(path.join(base, d)).isDirectory());

function normalize(str) {
  if (!str) return '';
  let s = str.toLowerCase();
  s = s.replace(/copy of /g, '');
  s = s.replace(/act \d+ (start|end) -? /g, '');
  s = s.replace(/epilogue (start|end) -? /g, '');
  s = s.replace(/[^a-z0-9]/g, '');
  return s;
}

function findMatch(voiceStr, dialogues, startIdx, k) {
  let bestIdx = -1;
  let bestScore = -1;
  const vClean = normalize(voiceStr);
  if (vClean.length === 0) return { idx: startIdx, score: 1 }; 
  for (let i = startIdx; i < Math.min(dialogues.length, startIdx + k); i++) {
    const dText = dialogues[i].text;
    const dClean = normalize(dText);
    let score = 0;
    if (dClean.includes(vClean) || vClean.includes(dClean)) {
      score = 100;
    } else {
      let matches = 0;
      let total = 0;
      for (let j = 0; j < vClean.length - 2; j++) {
        const trigram = vClean.slice(j, j + 3);
        total++;
        if (dClean.includes(trigram)) matches++;
      }
      if (total > 0) score = matches / total * 50;
      else if (vClean === dClean) score = 100;
    }
    score -= (i - startIdx) * 0.1;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return { idx: bestIdx, score: bestScore };
}

// Keep a map of extensions for vn-engine
const extMap = {};

dirs.forEach(actName => {
  const voiceDir = path.join(base, actName);
  let files = fs.readdirSync(voiceDir).filter(f => f.match(/^#(\d+)/));
  files.sort((a, b) => parseInt(a.match(/^#(\d+)/)[1]) - parseInt(b.match(/^#(\d+)/)[1]));
  
  let chapterFilter = '';
  if (actName === 'PROLOGUE') chapterFilter = 'Prologue';
  if (actName === 'ACT 1') chapterFilter = 'Act One';
  if (actName === 'ACT 2') chapterFilter = 'Act Two';
  if (actName === 'ACT 3') chapterFilter = 'Act Three';
  if (actName === 'EPILOGUE') chapterFilter = 'Epilogue';
  
  const actScenes = story.scenes.filter(s => s.chapter && s.chapter.includes(chapterFilter));
  const dialogues = [];
  actScenes.forEach(s => {
    if (s.dialogues) {
      s.dialogues.forEach((d, idx) => dialogues.push({ sceneId: s.id, dIdx: idx, text: d.text }));
    } else if (s.text) {
      dialogues.push({ sceneId: s.id, dIdx: 'quiz', text: s.text });
    }
  });
  
  let dIdx = 0;
  for (let f of files) {
    const vStr = f.replace(/^#\d+\s*/, '').replace(/\.[a-z0-9]+$/i, '');
    const match = findMatch(vStr, dialogues, dIdx, 8);
    
    // Allow manual patches
    let finalMatch = match.idx;
    if (f === '#29 King Aldric #4 (Prologue).m4a' && actName === 'PROLOGUE') {
      finalMatch = dialogues.findIndex(d => d.sceneId === 'prologue_5' && d.dIdx === 6);
    } else if (f === '#44 the prince and the eternal flame story of courage.m4a' && actName === 'EPILOGUE') {
      finalMatch = dialogues.findIndex(d => d.sceneId === 'ending');
    } else if (f === '#33 mmmhfffff.wav' && actName === 'ACT 3') {
      finalMatch = dialogues.findIndex(d => d.sceneId === 'act3_phoenix_appears' && d.dIdx === 3);
    } else if (match.score <= 20) {
      finalMatch = -1;
    }
    
    if (finalMatch !== -1) {
      const ext = path.extname(f);
      const d = dialogues[finalMatch];
      const newName = `${d.sceneId}_${d.dIdx}${ext}`;
      const oldPath = path.join(voiceDir, f);
      const newPath = path.join(mappedBase, newName);
      
      // Copy to Mapped folder (so we don't destroy originals just in case)
      fs.copyFileSync(oldPath, newPath);
      extMap[`${d.sceneId}_${d.dIdx}`] = ext;
      dIdx = finalMatch + 1;
    }
  }
});

// Write the extension map so vn-engine.js can fetch without guessing
fs.writeFileSync(path.join(__dirname, 'public', 'data', 'voice_exts.json'), JSON.stringify(extMap, null, 2));
console.log('Voice files copied and renamed to /assets/Voice/Mapped/');
