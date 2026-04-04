#!/usr/bin/env node
/**
 * statusline.js — Claude Code 状态栏脚本
 *
 * 从 stdin 接收会话 JSON，读取 buddy 状态，输出一行宠物状态。
 * 配置方式：settings.json 中加 "statusLine": { "type": "command", "command": "node /path/to/statusline.js" }
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const STATE_FILE = path.join(os.homedir(), '.claude', 'buddy-state.json');

// ANSI 颜色（终端状态栏支持）
const c = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  yellow:  '\x1b[33m',
  green:   '\x1b[32m',
  red:     '\x1b[31m',
  cyan:    '\x1b[36m',
  blue:    '\x1b[34m',
  gray:    '\x1b[90m',
};

const FACE = {
  baby: {
    happy:    '(=^ω^=)',
    excited:  'ヽ(=^ω^=)丿',
    worried:  '(=°д°=)',
    sleeping: '(=-.-)zzZ',
    idle:     '(=｀ω´=)',
  },
  teen: {
    happy:    '(=ↀ⩊ↀ=)',
    excited:  'ヽ(=ↀ⩊ↀ=)丿',
    worried:  '(=ↀ_ↀ=)',
    sleeping: '(=ↀ-ↀ=)zzZ',
    idle:     '(=ↀωↀ=)',
  },
  adult: {
    happy:    '₍˄·͈༝·͈˄*₎',
    excited:  'ヽ₍˄·͈༝·͈˄₎ノ',
    worried:  '₍˄°༝°˄₎!!',
    sleeping: '₍˄-༝-˄₎zzZ',
    idle:     '₍˄·͈༝·͈˄₎',
  },
  elite: {
    happy:    '✦(=^ω^=)✦',
    excited:  '✦ヽ(=^ω^=)丿✦',
    worried:  '✦(=°д°=)✦',
    sleeping: '✦(=-.-)zzZ✦',
    idle:     '✦(=｀ω´=)✦',
  },
};

const MOOD_COLOR = {
  happy:    c.green,
  excited:  c.yellow,
  worried:  c.red,
  sleeping: c.blue,
  idle:     c.cyan,
};

function getTermWidth() {
  // 1. PowerShell 读实际控制台宽度（Windows 最可靠）
  try {
    const { execFileSync } = require('child_process');
    const out = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-Command', '(Get-Host).UI.RawUI.WindowSize.Width'],
      { encoding: 'utf-8', timeout: 2000 }
    ).trim();
    const w = parseInt(out, 10);
    if (!isNaN(w) && w > 0) return w;
  } catch {}
  // 2. TTY 宽度
  if (process.stdout.columns) return process.stdout.columns;
  // 3. COLUMNS 环境变量
  if (process.env.COLUMNS) return parseInt(process.env.COLUMNS, 10);
  // 4. 兜底
  return 120;
}

function main() {
  let raw = '';
  process.stdin.on('data', d => raw += d);
  process.stdin.on('end', () => {
    // 尝试从 Claude Code session JSON 读终端宽度，失败则用 mode con
    let termWidth;
    try {
      const session = JSON.parse(raw);
      termWidth = session.terminal_width || session.cols || null;
    } catch {}
    if (!termWidth) termWidth = getTermWidth();

    let state;
    try {
      const raw2 = require('fs').readFileSync(STATE_FILE, 'utf-8');
      state = JSON.parse(raw2);
    } catch {
      process.stdout.write('(=｀ω´=) buddy not initialized\n');
      return;
    }

    const stage = state.stage || 'baby';
    const mood  = state.mood  || 'idle';
    const xp    = state.xp    || 0;
    const level = state.level || 1;
    const streak = state.streak || 0;

    const color = MOOD_COLOR[mood] || c.cyan;
    const streakPart = streak > 1 ? ` ${c.yellow}${streak}d🔥${c.reset}` : '';

    // 4 行宠物帧（对应：上分隔线 / 输入栏 / 下分隔线 / 状态栏）
    const PETS = {
      baby: {
        idle:     ['  /\\_/\\  ', ' ( ^.^ ) ', '  )   (  ', ' (     ) '],
        happy:    ['  /\\_/\\~ ', ' ( ^ω^ ) ', '  )   (  ', ' (     )~'],
        excited:  [' ヽ/\\_/\\丿', ' (>^ω^<) ', '  )   (  ', ' /     \\ '],
        worried:  ['  /\\_/\\  ', ' ( o.o ) ', '  >!!<   ', ' (     ) '],
        sleeping: ['   zzZ   ', '  /\\_/\\  ', ' ( -.- ) ', '  \\___/  '],
      },
    };

    const petFrames = (PETS[stage] || PETS.baby)[mood] || PETS.baby.idle;

    // 终端宽度，右对齐
    const W   = termWidth;
    const PW  = 10; // 宠物可见宽度（不含 ANSI 码）
    const pad = ' '.repeat(Math.max(0, W - PW - 1));

    // 底行左侧内容（纯文本长度，不含 ANSI）
    const greeting = state.greetingPending || null;
    if (greeting) {
      try {
        state.greetingPending = null;
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
      } catch {}
    }

    // 计算左侧文字的可见长度（去掉 ANSI 转义码）
    const stripAnsi = s => s.replace(/\x1b\[[0-9;]*m/g, '');

    const leftText = greeting
      ? `${color}${c.bold}${greeting}${c.reset}  Lv.${level} [${xp}xp]${streakPart}`
      : `Lv.${level} [${xp}xp]${streakPart}`;
    const leftVisible = stripAnsi(leftText).length;

    // 底行中间的间隔 = 终端宽 - 左侧可见长 - 宠物可见宽
    const midPad = ' '.repeat(Math.max(0, W - leftVisible - PW - 1));

    // 输出 4 行（前 3 行纯右对齐宠物，第 4 行左侧加状态）
    const lines = [
      `${pad}${color}${petFrames[0]}${c.reset}`,
      `${pad}${color}${petFrames[1]}${c.reset}`,
      `${pad}${color}${petFrames[2]}${c.reset}`,
      `${leftText}${midPad}${color}${petFrames[3]}${c.reset}`,
    ];
    process.stdout.write(lines.join('\n') + '\n');
  });
}

main();
