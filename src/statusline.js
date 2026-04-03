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

function main() {
  // 消耗 stdin（Claude Code 会传入会话 JSON，我们不需要解析它）
  process.stdin.resume();
  process.stdin.on('end', () => {
    let state;
    try {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      state = JSON.parse(raw);
    } catch {
      // 还没初始化过，显示默认
      process.stdout.write('(=｀ω´=) buddy not initialized\n');
      return;
    }

    const stage = state.stage || 'baby';
    const mood  = state.mood  || 'idle';
    const xp    = state.xp    || 0;
    const level = state.level || 1;
    const streak = state.streak || 0;

    const face  = (FACE[stage] || FACE.baby)[mood] || FACE.baby.idle;
    const color = MOOD_COLOR[mood] || c.cyan;

    const streakPart = streak > 1 ? ` ${c.yellow}${streak}d🔥${c.reset}` : '';
    const line = `${color}${face}${c.reset} ${c.dim}Lv.${level}${c.reset} ${c.gray}[${xp}xp]${c.reset}${streakPart}`;

    process.stdout.write(line + '\n');
  });
}

main();
