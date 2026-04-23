const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'public', 'data', 'prince_eternal_flame.json');
const story = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const base = path.join(__dirname, 'assets', 'Voice');
const dirs = fs.readdirSync(base).filter(d => fs.statSync(path.join(base, d)).isDirectory());

// Normalize string for matching
function normalize(str) {
  if (!str) return '';
  let s = str.toLowerCase();
  s = s.replace(/copy of /g, '');
  s = s.replace(/act \d+ (start|end) -? /g, '');
  s = s.replace(/epilogue (start|end) -? /g, '');
  // Remove all non-alphanumeric characters
  s = s.replace(/[^a-z0-9]/g, '');
  return s;
}

// Find best match within next K dialogues
function findMatch(voiceStr, dialogues, startIdx, k) {
  let bestIdx = -1;
  let bestScore = -1;
  const vClean = normalize(voiceStr);
  
  if (vClean.length === 0) return { idx: startIdx, score: 1 }; // fallback if no text
  
  for (let i = startIdx; i < Math.min(dialogues.length, startIdx + k); i++) {
    const dText = dialogues[i].text;
    const dClean = normalize(dText);
    
    let score = 0;
    if (dClean.includes(vClean) || vClean.includes(dClean)) {
      score = 100;
    } else {
      // simple overlap score (count matching 3-grams)
      let matches = 0;
      let total = 0;
      for (let j = 0; j < vClean.length - 2; j++) {
        const trigram = vClean.slice(j, j + 3);
        total++;
        if (dClean.includes(trigram)) matches++;
      }
      if (total > 0) {
         score = matches / total * 50;
      } else if (vClean === dClean) {
         score = 100; // for very short strings
      }
    }
    
    // extra points for order (prefer closer dialogues)
    score -= (i - startIdx) * 0.1;
    
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  
  return { idx: bestIdx, score: bestScore };
}

dirs.forEach(actName => {
  console.log(`\nMapping ${actName}...`);
  // Get voice files
  const voiceDir = path.join(base, actName);
  let files = fs.readdirSync(voiceDir).filter(f => f.match(/^#(\d+)/));
  files.sort((a, b) => {
    const na = parseInt(a.match(/^#(\d+)/)[1]);
    const nb = parseInt(b.match(/^#(\d+)/)[1]);
    return na - nb;
  });
  
  // Get corresponding scenes
  // Act names in JSON: prologue, act1, act2, act3, epilogue
  let chapterFilter = '';
  if (actName === 'PROLOGUE') chapterFilter = 'Prologue';
  if (actName === 'ACT 1') chapterFilter = 'Act One';
  if (actName === 'ACT 2') chapterFilter = 'Act Two';
  if (actName === 'ACT 3') chapterFilter = 'Act Three';
  if (actName === 'EPILOGUE') chapterFilter = 'Epilogue';
  
  const actScenes = story.scenes.filter(s => s.chapter && s.chapter.includes(chapterFilter));
  
  // Flatten dialogues
  const dialogues = [];
  actScenes.forEach(s => {
    if (s.dialogues) {
      s.dialogues.forEach(d => dialogues.push({ ref: d, text: d.text, type: 'dialogue' }));
    } else if (s.text) {
      dialogues.push({ ref: s, text: s.text, type: 'quiz' });
    }
  });
  
  let dIdx = 0;
  for (let f of files) {
    const vStr = f.replace(/^#\d+\s*/, '').replace(/\.[a-z0-9]+$/i, '');
    const match = findMatch(vStr, dialogues, dIdx, 8); // lookahead up to 8
    
    if (match.score > 20 && match.idx !== -1) {
      console.log(`[MATCH ${Math.round(match.score)}] ${f} -> "${dialogues[match.idx].text.substring(0, 40)}..."`);
      dialogues[match.idx].ref.voice = `/assets/Voice/${actName}/${f}`;
      dIdx = match.idx + 1;
    } else {
      console.log(`[MISMATCH] ${f} (Score: ${Math.round(match.score)})`);
    }
  }
});

fs.writeFileSync(dataPath, JSON.stringify(story, null, 2));
console.log('\nUpdated JSON saved.');
