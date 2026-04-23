const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, 'public', 'data', 'prince_eternal_flame.json');
const story = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Prologue 29 -> "Find the Phoenix of Mount Ignis. Bring back its warmth... and save your old father from this endless winter inside him."
// Epilogue 44 -> Ending text

// Manual patching
for (const scene of story.scenes) {
  if (scene.id === 'prologue_5') {
    scene.dialogues[6].voice = "/assets/Voice/PROLOGUE/#29 King Aldric #4 (Prologue).m4a";
  }
  if (scene.id === 'ending') {
    scene.dialogues[0].voice = "/assets/Voice/EPILOGUE/#44 the prince and the eternal flame story of courage.m4a";
  }
  if (scene.id === 'act3_phoenix_appears') {
    // The "Rex: ...Whhf."
    scene.dialogues[3].voice = "/assets/Voice/ACT 3/#33 mmmhfffff.wav";
  }
}

fs.writeFileSync(dataPath, JSON.stringify(story, null, 2));
console.log('Manually patched the mismatches.');
