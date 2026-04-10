import '../css/main.css';
import '../css/nav.css';
import '../css/views.css';
import '../css/vn.css';

import { initUI } from './ui.js';
import { initVN } from './vn-engine.js';

document.addEventListener('DOMContentLoaded', () => {
  initUI();
  initVN();
});
