<div align="center">
  <h1>🌿 LogicLoom</h1>
  <p>
    <b>A Gamified Educational Dashboard and Visual Novel Framework for Primary Learning.</b>
  </p>
  <p>
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
    <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="JavaScript" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  </p>
</div>

---

## 📖 Overview

**LogicLoom** is a comprehensive, gamified learning platform designed for primary school students and educators. It seamlessly integrates an adventure-based curriculum pathway with an interactive **Visual Novel Engine**, allowing students to learn mathematics, reading comprehension, and more through engaging, narrative-driven gameplay. The application also provides robust tracking and analysis tools for teachers, enabling data-driven interventions.

## ✨ Features

- **🎮 Student Adventure Map**: A visual progression system (Prologue, Cave of Numbers, Sky Kingdom) that tracks student success and completion across chapters using stars and badges.
- **📚 Integrated Visual Novel Quests**: Interactive storytelling system where students solve math, logic, and reading challenges directly inside the narrative (e.g., *The Prince and the Eternal Flame*).
- **📈 Skill Tracking**: Real-time display of reading, vocabulary, arithmetic, and inference levels tailored for individual students.
- **📊 Teacher Analytics Dashboard**: Comprehensive roster view with error pattern visualizations (bar charts), bottleneck alerts (highlighting precisely where students struggle most), and active status indicators.
- **👤 Profile Heatmaps**: A GitHub-style contribution heatmap to visualize daily streaks and consistent reading activity.
- **📄 CSV Reporting**: One-click data export functionality for teachers to download class reports offline.
- **✨ Premium UI/UX**: Built with a sleek dark-mode aesthetic featuring glassmorphism, fluid micro-animations, and vibrant, engaging typography specifically crafted to capture student attention.

## 🛠️ Tech Stack

- **Frontend Core**: Vanilla HTML5, CSS3, ES6 JavaScript.
- **Build Tool**: [Vite](https://vitejs.dev/) for blindingly fast hot-module replacement and optimized production builds.
- **Design System**: Custom CSS variables implementing a dark-mode glassmorphic theme. No bulky UI libraries; completely tailored.
- **Data & Assets**: JSON-driven Visual Novel schemas with dynamic sprite flipping and particle effects.

## 🚀 Quick Setup

### Prerequisites

1. **Node.js**: v18.0.0 or higher.

### Installation

1. **Clone the Repository**

```bash
git clone https://github.com/ggranbell/LogicLoom.git
cd LogicLoom
```

2. **Install Dependencies**

```bash
npm install
```

3. **Run the Development Server**

```bash
npm run dev
```

Navigate to `http://localhost:5173` (or the port Vite specifies) in your browser to access the LogicLoom dashboard and test the Visual Novel encounters.

### 📦 Building for Production

```bash
npm run build
```
Generates a highly optimized, minified bundle in the `dist/` directory ready for deployment to Vercel, Netlify, or any static host.

## 📂 Project Architecture

```text
LogicLoom/
├── index.html            # Main SPA entry point and markup
├── package.json          # Project metadata and scripts
├── public/               # Static assets not built by Vite
│   └── data/             # JSON scripts for visual novel stories
│   └── assets/           # Backgrounds, portraits, and UI icons
├── src/                  
│   ├── css/              # Modular Style System
│   │   ├── main.css      # Design tokens, variables, base layout
│   │   ├── nav.css       # Glassmorphic top navigation bar
│   │   ├── views.css     # Student, Teacher, and Profile layout rules
│   │   └── vn.css        # Visual Novel framework styling
│   └── js/               
│       ├── main.js       # Entry initialization
│       ├── ui.js         # Tab switching, modals, dashboard interactivity
│       └── vn-engine.js  # The core visual novel narrative, typewriter, and quiz engine
└── README.md             # This documentation
```

## 🎨 Engine Specifics

### Visual Novel Logic (`vn-engine.js`)
The custom-built VN engine reads from descriptive JSON files. It natively handles:
- Background and overlay layer management.
- Dynamic character slotting (Left, Center, Right) and automatic smart-flipping (characters automatically face inwards).
- Typing animations and dialogue pacing.
- Particle generation (snow, embers, sparkles) mapped to abstract *moods*.
- Inline quiz logic for narrative progression based on answering correctly.