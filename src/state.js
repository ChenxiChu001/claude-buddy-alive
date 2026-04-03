/**
 * state.js — Buddy 状态持久化管理
 *
 * 读写 ~/.claude/buddy-state.json，维护宠物的完整生命状态。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const STATE_DIR = path.join(os.homedir(), '.claude');
const STATE_FILE = path.join(STATE_DIR, 'buddy-state.json');

const DEFAULT_STATE = {
  name: null,
  species: 'cat',
  stage: 'baby',        // baby → teen → adult → elite
  mood: 'idle',          // idle, happy, worried, sleeping, excited
  moodSince: Date.now(),
  xp: 0,
  level: 1,
  streak: 0,
  lastActive: null,
  lastSessionEnd: null,
  todayActions: 0,
  totalActions: 0,
  totalCommits: 0,
  totalErrors: 0,
  totalTestPasses: 0,
  totalFilesWritten: 0,
  createdAt: Date.now(),
  personality: {
    wisdom: Math.random(),
    chaos: Math.random(),
    snark: Math.random(),
  },
};

function ensureDir() {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

function load() {
  ensureDir();
  if (!fs.existsSync(STATE_FILE)) {
    const state = { ...DEFAULT_STATE, createdAt: Date.now() };
    save(state);
    return state;
  }
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    const saved = JSON.parse(raw);
    // Merge with defaults so new fields are always present
    return { ...DEFAULT_STATE, ...saved };
  } catch {
    const state = { ...DEFAULT_STATE, createdAt: Date.now() };
    save(state);
    return state;
  }
}

function save(state) {
  ensureDir();
  state.lastActive = Date.now();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

function addXP(state, amount) {
  state.xp += amount;
  // Level thresholds: 100, 250, 500, 1000, 2000, ...
  const thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (state.xp >= thresholds[i]) {
      state.level = i + 1;
      break;
    }
  }
  // Evolution stages
  if (state.xp >= 1000) state.stage = 'elite';
  else if (state.xp >= 500) state.stage = 'adult';
  else if (state.xp >= 100) state.stage = 'teen';
  else state.stage = 'baby';

  return state;
}

function checkStreak(state) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  if (!state.lastActive) {
    state.streak = 1;
    return state;
  }

  const lastDate = new Date(state.lastActive).toISOString().slice(0, 10);
  if (lastDate === today) {
    // Same day, streak unchanged
  } else {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (lastDate === yesterdayStr) {
      state.streak += 1;
    } else {
      state.streak = 1; // Reset
    }
  }
  return state;
}

function getIdleMinutes(state) {
  if (!state.lastActive) return 0;
  return (Date.now() - state.lastActive) / 1000 / 60;
}

function getDaysSinceLastSession(state) {
  if (!state.lastSessionEnd) return 0;
  return (Date.now() - state.lastSessionEnd) / 1000 / 60 / 60 / 24;
}

module.exports = {
  load,
  save,
  addXP,
  checkStreak,
  getIdleMinutes,
  getDaysSinceLastSession,
  STATE_FILE,
  DEFAULT_STATE,
};
