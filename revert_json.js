const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'public', 'data', 'prince_eternal_flame.json');
const story = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Revert voice properties
story.scenes.forEach(scene => {
  if (scene.voice) delete scene.voice;
  if (scene.dialogues) {
    scene.dialogues.forEach(d => {
      if (d.voice) delete d.voice;
    });
  }
});

fs.writeFileSync(dataPath, JSON.stringify(story, null, 2));
console.log('Reverted JSON voice integration.');
