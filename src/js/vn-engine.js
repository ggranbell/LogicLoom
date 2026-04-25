// ═══════════════════════════════════════════════════════
//  VN ENGINE — The Prince and the Eternal Flame
//  Full visual novel engine with backgrounds, portraits,
//  typewriter, particles, rewards & progress
// ═══════════════════════════════════════════════════════

export function initVN() {
  spawnStars();
  window.resetVN = resetVN;
  window.closeVN = closeVN;
  window.vnNext = vnNext;
  window.skipToNextMinigame = skipToNextMinigame;
  window.resetVnProgress = function() {
    if (confirm("Reset your story progress and start from the beginning?")) {
      localStorage.removeItem('vn_the_prince_save');
      resetVN();
    }
  };

  const overlay = document.getElementById('vnOverlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      // Ignore clicks on buttons/choices
      if (e.target.closest('button') || e.target.closest('.vn-choice')) return;
      
      // If voice is playing, we only allow completing the typewriter, not advancing the scene
      if (isVoicePlaying || (currentAudio && !currentAudio.paused && !currentAudio.ended)) {
        if (!typewriterDone) {
          completeTypewriter();
        }
        return;
      }
      
      if (currentStory && currentSceneId) {
        vnNext();
      }
    });
  }

  const autoPlayBtn = document.getElementById('autoPlayBtn');
  if (autoPlayBtn) {
    autoPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent advancing scene on click
      isAutoPlay = !isAutoPlay;
      autoPlayBtn.textContent = isAutoPlay ? '⏸ Auto-Play ON' : '▶ Auto-Play OFF';
      autoPlayBtn.style.background = isAutoPlay ? 'rgba(77, 189, 116, 0.2)' : '';
      autoPlayBtn.style.color = isAutoPlay ? '#4DBD74' : '';
      
      if (isAutoPlay && typewriterDone && !isVoicePlaying) {
        triggerAutoPlay(1000);
      } else if (!isAutoPlay) {
        clearTimeout(autoPlayTimer);
      }
    });
  }
}

// ─── STATE ───
let currentStory = null;
let currentSceneId = null;
let currentDialogueIdx = 0;
let typewriterInterval = null;
let typewriterDone = true;
let fullText = '';
let stars = 0;
let attempts = 0;
let totalPuzzles = 0;
let solvedPuzzles = 0;
let currentBackground = '';
let currentMood = '';
let currentAudio = null;
let isVoicePlaying = false;
let voiceExts = {};
let isAutoPlay = false;
let autoPlayTimer = null;

// ─── STARS / PARTICLES ───
function spawnStars() {
  const field = document.getElementById('starsField');
  if (!field) return;
  field.innerHTML = '';
  for (let i = 0; i < 60; i++) {
    const s = document.createElement('div');
    s.className = 'vn-star';
    s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*60}%;--d:${2+Math.random()*4}s;animation-delay:${Math.random()*4}s;width:${Math.random()<.2?3:2}px;height:${Math.random()<.2?3:2}px;opacity:${.3+Math.random()*.7}`;
    field.appendChild(s);
  }
}

function spawnParticles(mood) {
  const container = document.getElementById('vnParticles');
  if (!container) return;
  container.innerHTML = '';
  container.className = 'vn-particles';

  if (mood === 'frost') {
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle-snow';
      p.style.cssText = `left:${Math.random()*100}%;animation-duration:${4+Math.random()*6}s;animation-delay:${Math.random()*5}s;opacity:${.3+Math.random()*.5};font-size:${8+Math.random()*10}px`;
      p.textContent = '❄';
      container.appendChild(p);
    }
  } else if (mood === 'volcanic') {
    for (let i = 0; i < 25; i++) {
      const p = document.createElement('div');
      p.className = 'particle-ember';
      p.style.cssText = `left:${Math.random()*100}%;animation-duration:${3+Math.random()*5}s;animation-delay:${Math.random()*4}s;opacity:${.4+Math.random()*.6}`;
      container.appendChild(p);
    }
  } else if (mood === 'fire') {
    for (let i = 0; i < 35; i++) {
      const p = document.createElement('div');
      p.className = 'particle-fire';
      p.style.cssText = `left:${Math.random()*100}%;animation-duration:${2+Math.random()*4}s;animation-delay:${Math.random()*3}s;opacity:${.3+Math.random()*.7}`;
      container.appendChild(p);
    }
  } else if (mood === 'warm') {
    for (let i = 0; i < 15; i++) {
      const p = document.createElement('div');
      p.className = 'particle-sparkle';
      p.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*80}%;animation-duration:${2+Math.random()*3}s;animation-delay:${Math.random()*4}s`;
      p.textContent = '✨';
      container.appendChild(p);
    }
  }
}

// ─── BACKGROUND SYSTEM ───
function setBackground(bgPath) {
  if (bgPath === currentBackground) return;
  currentBackground = bgPath;
  const bgContainer = document.getElementById('vnBgImage');
  if (!bgContainer) return;

  if (bgPath) {
    bgContainer.style.backgroundImage = `url('${bgPath}')`;
    bgContainer.classList.add('visible');
  } else {
    bgContainer.classList.remove('visible');
  }
}

// ─── CHARACTER PORTRAIT SYSTEM ───
function setCharacters(charIds) {
  const leftSlot = document.getElementById('vnCharLeft');
  const rightSlot = document.getElementById('vnCharRight');
  const centerSlot = document.getElementById('vnCharCenter');

  [leftSlot, rightSlot, centerSlot].forEach(slot => {
    if (slot) {
      slot.innerHTML = '';
      slot.classList.remove('active');
      slot.style.display = 'none';
      slot.dataset.assigned = "";
    }
  });

  if (!charIds || charIds.length === 0 || !currentStory) return;

  if (charIds.length === 1) {
    if (charIds[0]) renderPortrait(centerSlot, charIds[0]);
  } else if (charIds.length === 2) {
    if (charIds[0]) renderPortrait(leftSlot, charIds[0]);
    if (charIds[1]) renderPortrait(rightSlot, charIds[1]);
  } else if (charIds.length >= 3) {
    if (charIds[0]) renderPortrait(leftSlot, charIds[0]);
    if (charIds[1]) renderPortrait(centerSlot, charIds[1]);
    if (charIds[2]) renderPortrait(rightSlot, charIds[2]);
  }
}

function renderPortrait(slot, charId) {
  if (!slot || !currentStory?.characters?.[charId]) return;
  const char = currentStory.characters[charId];
  slot.style.display = 'flex';
  slot.classList.add('active');

  const nativeFace = char.faces || 'right';
  let flip = 1;

  if (slot.id === 'vnCharLeft') {
    // If placed on the left, character MUST face physically right inwards
    if (nativeFace === 'left') flip = -1;
  } else if (slot.id === 'vnCharRight') {
    // If placed on the right, character MUST face physically left inwards
    if (nativeFace === 'right') flip = -1;
  }

  slot.style.setProperty('--flip-x', flip);

  const img = document.createElement('img');
  img.src = char.portrait;
  img.alt = char.name;
  img.className = 'vn-portrait-img';
  img.draggable = false;
  slot.appendChild(img);

  const nameTag = document.createElement('div');
  nameTag.className = 'vn-portrait-name';
  nameTag.textContent = char.name;
  slot.appendChild(nameTag);
}

function highlightSpeaker(speakerId) {
  const slots = document.querySelectorAll('.vn-char-slot');
  slots.forEach(slot => {
    const img = slot.querySelector('.vn-portrait-img');
    if (!img) return;
    const charName = img.alt;
    const isSpeaking = currentStory?.characters?.[speakerId]?.name === charName;
    slot.classList.toggle('speaking', isSpeaking);
    slot.classList.toggle('dimmed', !isSpeaking && speakerId !== null);
  });
}

// ─── TYPEWRITER ───
function typewrite(element, text, speed = 25) {
  clearInterval(typewriterInterval);
  typewriterDone = false;
  fullText = text;
  element.innerHTML = '';
  let idx = 0;

  // Handle HTML tags properly
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;
  const plainText = tempDiv.textContent || tempDiv.innerText || '';

  // If text contains HTML, show it all at once with typewriter on the text content
  if (text !== plainText) {
    element.innerHTML = text;
    typewriterDone = true;
    return;
  }

  typewriterInterval = setInterval(() => {
    if (idx < text.length) {
      element.textContent += text[idx];
      idx++;
    } else {
      clearInterval(typewriterInterval);
      typewriterDone = true;
      if (!isVoicePlaying) triggerAutoPlay(2000);
    }
  }, speed);
}

function completeTypewriter() {
  clearInterval(typewriterInterval);
  const textEl = document.getElementById('vnText');
  if (textEl && fullText) {
    textEl.innerHTML = fullText;
  }
  typewriterDone = true;
  if (!isVoicePlaying) triggerAutoPlay(2000);
}

// ─── SCREEN EFFECTS ───
function triggerEffect(sfx) {
  const scene = document.querySelector('.vn-scene');
  if (!scene) return;

  if (sfx === 'screen_shake') {
    scene.classList.add('shake');
    setTimeout(() => scene.classList.remove('shake'), 500);
  } else if (sfx === 'flash_gold') {
    const flash = document.createElement('div');
    flash.className = 'vn-flash gold';
    scene.appendChild(flash);
    setTimeout(() => flash.remove(), 800);
  } else if (sfx === 'flash_white') {
    const flash = document.createElement('div');
    flash.className = 'vn-flash white';
    scene.appendChild(flash);
    setTimeout(() => flash.remove(), 600);
  } else if (sfx === 'gate_open') {
    scene.classList.add('shake');
    setTimeout(() => {
      scene.classList.remove('shake');
      const flash = document.createElement('div');
      flash.className = 'vn-flash gold';
      scene.appendChild(flash);
      setTimeout(() => flash.remove(), 800);
    }, 400);
  }
}

// ─── REWARD SYSTEM ───
function awardStars() {
  let earned = 3;
  if (attempts === 2) earned = 2;
  if (attempts >= 3) earned = 1;
  stars += earned;
  solvedPuzzles++;
  attempts = 0;
  updateStarDisplay();
  showStarPopup(earned);
}

function showStarPopup(count) {
  const popup = document.getElementById('vnRewardPopup');
  if (!popup) return;
  const starsEl = popup.querySelector('.reward-stars');
  if (starsEl) {
    starsEl.textContent = '⭐'.repeat(count) + '☆'.repeat(3 - count);
  }
  const msgEl = popup.querySelector('.reward-msg');
  if (msgEl) {
    if (count === 3) msgEl.textContent = 'Perfect! First try!';
    else if (count === 2) msgEl.textContent = 'Great job!';
    else msgEl.textContent = 'Keep going!';
  }
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 1800);
}

function updateStarDisplay() {
  const el = document.getElementById('vnStarCount');
  if (el) el.textContent = stars;
  updateProgress();
}

function updateProgress() {
  const bar = document.getElementById('vnProgressFill');
  const label = document.getElementById('vnProgressLabel');
  if (!currentStory) return;

  const totalScenes = currentStory.scenes.length;
  const currentIdx = currentStory.scenes.findIndex(s => s.id === currentSceneId);
  const pct = Math.round(((currentIdx + 1) / totalScenes) * 100);

  if (bar) bar.style.width = pct + '%';
  if (label) label.textContent = pct + '%';
}

// ─── CHAPTER LABEL ───
function updateChapterLabel(chapter) {
  const el = document.getElementById('vnChapterLabel');
  if (el && chapter) el.textContent = chapter;
}

// ─── LOAD & RESET ───
async function loadStory() {
  try {
    const res = await fetch('/data/prince_eternal_flame.json');
    currentStory = await res.json();
    currentSceneId = currentStory.scenes[0].id;
    currentDialogueIdx = 0;
    stars = 0;
    solvedPuzzles = 0;
    attempts = 0;

    try {
      const extRes = await fetch('/data/voice_exts.json');
      voiceExts = await extRes.json();
    } catch(e) { console.warn("No voice extensions found", e); }

    // Load from localStorage if available
    const saved = localStorage.getItem('vn_the_prince_save');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        currentSceneId = data.sceneId || currentSceneId;
        stars = data.stars || 0;
        solvedPuzzles = data.solvedPuzzles || 0;
      } catch(e) { console.warn("Save load failed", e); }
    }

    // Count total puzzles
    totalPuzzles = currentStory.scenes.filter(s =>
      s.type === 'quiz' || s.type === 'riddle' || s.type === 'vocabulary'
    ).length;

    updateStarDisplay();
    renderScene();
  } catch (err) {
    console.error("Failed to load story data", err);
    const vnText = document.getElementById('vnText');
    if (vnText) vnText.innerHTML = "<em>Failed to load story...</em>";
  }
}

function saveProgress() {
  const data = {
    sceneId: currentSceneId,
    stars: stars,
    solvedPuzzles: solvedPuzzles
  };
  localStorage.setItem('vn_the_prince_save', JSON.stringify(data));
}

export function resetVN() {
  const stage = document.getElementById('vnDynamicStage');
  if (stage) stage.style.display = 'block';

  const choices = document.getElementById('vnChoicesArea');
  if (choices) { choices.innerHTML = ''; choices.style.display = 'none'; }

  const nextBtn = document.getElementById('vnNextBtn');
  if (nextBtn) nextBtn.style.display = 'inline-flex';

  const endingScreen = document.getElementById('vnEndingScreen');
  if (endingScreen) endingScreen.classList.remove('show');

  loadStory();
}

function closeVN() {
  const overlay = document.getElementById('vnOverlay');
  if (overlay) overlay.classList.remove('open');
  clearInterval(typewriterInterval);
  clearTimeout(autoPlayTimer);
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  isVoicePlaying = false;
}

// ─── VOICE PLAYBACK ───
function playVoice(voiceUrl) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  isVoicePlaying = false;
  
  const nextBtn = document.getElementById('vnNextBtn');
  const choicesArea = document.getElementById('vnChoicesArea');
  
  if (nextBtn) {
    nextBtn.style.opacity = '0.5';
    nextBtn.style.pointerEvents = 'none';
    nextBtn.disabled = true;
  }
  if (choicesArea) {
    choicesArea.style.pointerEvents = 'none';
  }
  
  if (voiceUrl) {
    isVoicePlaying = true;
    currentAudio = new Audio(voiceUrl);
    currentAudio.play().catch(e => {
      console.warn("Autoplay blocked for voice", e);
      isVoicePlaying = false;
      enableInteraction(nextBtn, choicesArea);
    });
    currentAudio.onended = () => {
      isVoicePlaying = false;
      enableInteraction(nextBtn, choicesArea);
      triggerAutoPlay(500);
    };
  } else {
    enableInteraction(nextBtn, choicesArea);
  }
}

function triggerAutoPlay(delay) {
  if (!isAutoPlay) return;
  const scene = currentStory?.scenes.find(s => s.id === currentSceneId);
  if (!scene) return;
  
  // Do not auto-play mini-games or ending
  if (['quiz', 'riddle', 'vocabulary', 'ending'].includes(scene.type)) return;
  
  clearTimeout(autoPlayTimer);
  autoPlayTimer = setTimeout(() => {
    if (isAutoPlay && !isVoicePlaying) {
      vnNext();
    }
  }, delay);
}

function enableInteraction(nextBtn, choicesArea) {
  if (nextBtn) {
    nextBtn.style.opacity = '1';
    nextBtn.style.pointerEvents = 'auto';
    nextBtn.disabled = false;
  }
  if (choicesArea) {
    choicesArea.style.pointerEvents = 'auto';
  }
}

// ─── RENDER SCENE ───
function renderScene() {
  const scene = currentStory.scenes.find(s => s.id === currentSceneId);
  if (!scene) {
    closeVN();
    return;
  }

  const namebox = document.getElementById('vnNamebox');
  const textbox = document.getElementById('vnText');
  const choicesArea = document.getElementById('vnChoicesArea');
  const nextBtn = document.getElementById('vnNextBtn');
  const skillLabel = document.getElementById('vnSkillLabel');
  const stage = document.getElementById('vnDynamicStage');

  if (stage) stage.style.display = 'block';

  // Set background
  if (scene.background) setBackground(scene.background);

  // Set mood particles
  if (scene.mood && scene.mood !== currentMood) {
    currentMood = scene.mood;
    spawnParticles(scene.mood);
  }

  // Set characters
  if (scene.characters) setCharacters(scene.characters);

  // Update chapter label
  if (scene.chapter) updateChapterLabel(scene.chapter);

  // Update progress
  updateProgress();

  // Trigger screen effects
  if (scene.sfx && currentDialogueIdx === 0) {
    setTimeout(() => triggerEffect(scene.sfx), 300);
  }

  // Show skill label for game scenes
  if (skillLabel) {
    if (scene.skill) {
      skillLabel.textContent = scene.skill;
      skillLabel.style.display = 'block';
    } else {
      skillLabel.style.display = 'none';
    }
  }

  // Handle ending
  if (scene.type === 'ending') {
    const ext = voiceExts[`${scene.id}_0`];
    playVoice(ext ? `/assets/Voice/Mapped/${scene.id}_0${ext}` : null);
    showEnding();
    return;
  }

  // Handle quiz / riddle / vocabulary
  if (scene.type === 'quiz' || scene.type === 'riddle' || scene.type === 'vocabulary') {
    const ext = voiceExts[`${scene.id}_quiz`];
    playVoice(ext ? `/assets/Voice/Mapped/${scene.id}_quiz${ext}` : null);
    const speakerKey = scene.speaker;
    if (speakerKey) {
      const charInfo = currentStory.characters[speakerKey];
      namebox.textContent = charInfo?.name || speakerKey;
      namebox.style.background = charInfo?.color || 'var(--vn-name)';
      namebox.style.color = '#1a0a00';
      highlightSpeaker(speakerKey);
    } else {
      namebox.textContent = '📜 Challenge';
      namebox.style.background = '#FFD700';
      namebox.style.color = '#1a0a00';
      highlightSpeaker(null);
    }

    typewrite(textbox, scene.text, 15);
    nextBtn.style.display = 'none';
    attempts = 0;

    choicesArea.style.display = 'flex';
    choicesArea.innerHTML = '';
    scene.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'vn-choice';
      btn.innerHTML = `<span class="vn-choice-letter">${choice.letter}</span> ${choice.text}`;
      btn.onclick = () => handleChoice(choice, btn, scene.next);
      choicesArea.appendChild(btn);
    });

  } else {
    // Normal dialogue
    choicesArea.style.display = 'none';
    const dialogue = scene.dialogues[currentDialogueIdx];
    const ext = voiceExts[`${scene.id}_${currentDialogueIdx}`];
    playVoice(ext ? `/assets/Voice/Mapped/${scene.id}_${currentDialogueIdx}${ext}` : null);

    if (dialogue.speaker === null) {
      namebox.textContent = '📖 Narrator';
      namebox.style.background = 'rgba(255,255,255,0.15)';
      namebox.style.color = 'rgba(255,255,255,0.7)';
      typewrite(textbox, dialogue.text, 20);
      highlightSpeaker(null);
    } else {
      const charInfo = currentStory.characters[dialogue.speaker];
      namebox.textContent = charInfo?.name || dialogue.speaker;
      namebox.style.background = charInfo?.color || 'var(--vn-name)';
      namebox.style.color = '#1a0a00';
      typewrite(textbox, dialogue.text, 20);
      highlightSpeaker(dialogue.speaker);
    }

    nextBtn.style.display = 'inline-flex';
    if (currentDialogueIdx >= scene.dialogues.length - 1 && !scene.next) {
      nextBtn.textContent = 'Finish ▶';
    } else {
      nextBtn.textContent = 'Next ▶';
    }
  }
}

// ─── HANDLE CHOICE ───
function handleChoice(choice, btnElement, nextSceneId) {
  if (isVoicePlaying || (currentAudio && !currentAudio.paused && !currentAudio.ended)) return;
  attempts++;
  const allBtns = document.querySelectorAll('.vn-choice');
  allBtns.forEach(b => b.disabled = true);

  if (choice.correct) {
    btnElement.classList.add('correct');
    btnElement.innerHTML += ' <span class="choice-result">✓ Correct!</span>';
    awardStars();
    setTimeout(() => {
      currentSceneId = nextSceneId;
      currentDialogueIdx = 0;
      saveProgress(); // Auto-save after completing challenge
      renderScene();
    }, 1500);
  } else {
    btnElement.classList.add('wrong');
    btnElement.innerHTML += ' <span class="choice-result">✗ Try again</span>';
    setTimeout(() => {
      allBtns.forEach(b => {
        if (!b.classList.contains('wrong')) b.disabled = false;
      });
    }, 800);
  }
}

// ─── ENDING SCREEN ───
function showEnding() {
  const stage = document.getElementById('vnDynamicStage');
  if (stage) stage.style.display = 'none';

  const ending = document.getElementById('vnEndingScreen');
  if (!ending) return;

  const totalStarsEl = ending.querySelector('.ending-total-stars');
  const maxStarsEl = ending.querySelector('.ending-max-stars');
  const puzzlesEl = ending.querySelector('.ending-puzzles');

  if (totalStarsEl) totalStarsEl.textContent = stars;
  if (maxStarsEl) maxStarsEl.textContent = totalPuzzles * 3;
  if (puzzlesEl) puzzlesEl.textContent = `${solvedPuzzles}/${totalPuzzles}`;

  ending.classList.add('show');
  triggerEffect('flash_gold');
}

// ─── NEXT ───
function vnNext() {
  clearTimeout(autoPlayTimer);

  // If typewriter is still running, complete it first
  if (!typewriterDone) {
    completeTypewriter();
    return;
  }

  // Block scene advancement if voice is actively playing
  if (isVoicePlaying || (currentAudio && !currentAudio.paused && !currentAudio.ended)) {
    console.log("Blocked next: Audio is still playing");
    return;
  }

  const scene = currentStory.scenes.find(s => s.id === currentSceneId);
  if (!scene) return;

  if (scene.type !== 'quiz' && scene.type !== 'riddle' && scene.type !== 'vocabulary' && scene.type !== 'ending') {
    if (currentDialogueIdx < scene.dialogues.length - 1) {
      currentDialogueIdx++;
      renderScene();
    } else {
      if (scene.next) {
        currentSceneId = scene.next;
        currentDialogueIdx = 0;
        saveProgress(); // Auto-save at next scene
        renderScene();
      } else {
        closeVN();
      }
    }
  }
}

export function skipToNextMinigame() {
  if (!currentStory || !currentSceneId) return;

  // Stop any playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
    isVoicePlaying = false;
  }
  
  clearTimeout(autoPlayTimer);

  const scenes = currentStory.scenes;
  const currentIdx = scenes.findIndex(s => s.id === currentSceneId);

  // Look for the next scene that is a minigame
  for (let i = currentIdx + 1; i < scenes.length; i++) {
    const s = scenes[i];
    if (['quiz', 'riddle', 'vocabulary'].includes(s.type)) {
      currentSceneId = s.id;
      currentDialogueIdx = 0;
      saveProgress();
      renderScene();
      return;
    }
  }

  // If no more minigames, go to ending if it exists
  const ending = scenes.find(s => s.type === 'ending');
  if (ending) {
    currentSceneId = ending.id;
    currentDialogueIdx = 0;
    saveProgress();
    renderScene();
  } else {
    alert("No more minigames found!");
    closeVN();
  }
}
