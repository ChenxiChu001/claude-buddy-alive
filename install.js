#!/usr/bin/env node
/**
 * install.js — 一键安装 claude-buddy-alive
 *
 * 将 hook 配置自动合并到用户的 .claude/settings.json 中。
 * 用法: node install.js  或  buddy-install (npm global)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const BUDDY_ROOT = path.resolve(__dirname);
const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json');

const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

function log(msg) { console.log(msg); }

function main() {
  log(`\n${c.cyan}${c.bold}  (=^ω^=) claude-buddy-alive installer${c.reset}\n`);

  // Ensure .claude dir exists
  if (!fs.existsSync(CLAUDE_DIR)) {
    fs.mkdirSync(CLAUDE_DIR, { recursive: true });
    log(`${c.dim}  Created ${CLAUDE_DIR}${c.reset}`);
  }

  // Load or create settings.json
  let settings = {};
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      log(`${c.dim}  Loaded existing ${SETTINGS_FILE}${c.reset}`);
    } catch {
      log(`${c.yellow}  Warning: Could not parse existing settings.json, creating fresh${c.reset}`);
      settings = {};
    }
  }

  // Ensure hooks structure
  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.PostToolUse) settings.hooks.PostToolUse = [];
  if (!settings.hooks.Stop) settings.hooks.Stop = [];

  // Remove any existing buddy hooks
  settings.hooks.PostToolUse = settings.hooks.PostToolUse.filter(h => !(h.id && h.id.startsWith('buddy:')));
  settings.hooks.Stop = settings.hooks.Stop.filter(h => !(h.id && h.id.startsWith('buddy:')));

  // Build absolute paths for hook commands
  const postToolCmd = `node "${path.join(BUDDY_ROOT, 'hooks', 'post-tool-use.js').replace(/\\/g, '/')}"`;
  const sessionEndCmd = `node "${path.join(BUDDY_ROOT, 'hooks', 'session-end.js').replace(/\\/g, '/')}"`;
  const sessionStartCmd = `node "${path.join(BUDDY_ROOT, 'hooks', 'session-start.js').replace(/\\/g, '/')}"`;

  // Add PostToolUse hook
  settings.hooks.PostToolUse.push({
    matcher: '*',
    hooks: [{ type: 'command', command: postToolCmd, timeout: 5 }],
    description: 'Buddy: React to tool use with emotion and XP',
    id: 'buddy:post-tool-use',
  });

  // Add Stop hook (farewell)
  settings.hooks.Stop.push({
    hooks: [{ type: 'command', command: sessionEndCmd, timeout: 5 }],
    description: 'Buddy: Say goodbye and save state',
    id: 'buddy:session-end',
  });

  // Write settings
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  log(`${c.green}  ✓ Hooks installed to ${SETTINGS_FILE}${c.reset}`);

  // Initialize buddy state
  const stateModule = require('./src/state');
  const s = stateModule.load();
  log(`${c.green}  ✓ Buddy state initialized at ${stateModule.STATE_FILE}${c.reset}`);
  log(`${c.dim}    Species: ${s.species} | Stage: ${s.stage} | XP: ${s.xp}${c.reset}`);

  // Print greeting
  const animation = require('./src/animation');
  log('');
  animation.render(animation.buildGreetingDisplay(s, false));

  log(`\n${c.cyan}  Installation complete!${c.reset}`);
  log(`${c.dim}  Your buddy will now react to your coding sessions.${c.reset}`);
  log(`${c.dim}  State file: ${stateModule.STATE_FILE}${c.reset}`);
  log(`${c.dim}  To uninstall: remove hooks with id "buddy:*" from settings.json${c.reset}\n`);
}

main();
