/**
 * companion.js — 多行动态宠物伴侣
 *
 * 在独立终端窗口中运行，持续渲染 7 行 ASCII 动画。
 * 每 400ms 刷新一帧，读取 buddy-state.json 同步心情和状态。
 * 支持：走动、开心摇尾、兴奋跳跃、担心发抖、睡觉打呼、伸懒腰
 *
 * 用法：node companion.js
 * 自动启动：SessionStart hook 调用 start cmd /k node companion.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ─────────── 状态文件 ───────────
const STATE_FILE = path.join(os.homedir(), '.claude', 'buddy-state.json');

// ─────────── ANSI ───────────
const A = {
  reset:    '\x1b[0m',
  bold:     '\x1b[1m',
  dim:      '\x1b[2m',
  yellow:   '\x1b[33m',
  green:    '\x1b[32m',
  red:      '\x1b[31m',
  cyan:     '\x1b[36m',
  blue:     '\x1b[34m',
  magenta:  '\x1b[35m',
  white:    '\x1b[97m',
  gray:     '\x1b[90m',
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h',
  clearLine:  '\x1b[2K\r',
  up: (n) => `\x1b[${n}A`,
};

// ─────────── 画布宽度 ───────────
const CANVAS_W = 38;   // 宠物显示区域宽度
const HEIGHT   = 8;    // 渲染行数（含气泡+底栏）

// ─────────── ASCII 帧定义 ───────────
// 每帧 = 6 行字符串数组（宽度不超过 CANVAS_W）
// 行 0-5 = 宠物主体，行 6 = 气泡/特效，行 7 = 空（底栏由代码生成）

const FRAMES = {

  // ── 走动（idle）4帧循环，配合 x 偏移实现左右移动 ──
  idle: [
    // frame 0：左脚踏出
    [
      '  /\\_/\\  ',
      ' ( ^.^ ) ',
      '  )   (  ',
      ' (  L  ) ',
      '  /   \\  ',
      '         ',
    ],
    // frame 1：站立
    [
      '  /\\_/\\  ',
      ' ( ^.^ ) ',
      '  )   (  ',
      ' (     ) ',
      '  || ||  ',
      '         ',
    ],
    // frame 2：右脚踏出
    [
      '  /\\_/\\  ',
      ' ( ^.^ ) ',
      '  )   (  ',
      ' (  J  ) ',
      '    /  \\ ',
      '         ',
    ],
    // frame 3：站立
    [
      '  /\\_/\\  ',
      ' ( ^.^ ) ',
      '  )   (  ',
      ' (     ) ',
      '  || ||  ',
      '         ',
    ],
  ],

  // ── 开心（happy）3帧，尾巴摇摆 ──
  happy: [
    [
      '  /\\_/\\~ ',
      ' ( ^ω^ ) ',
      '  )   (  ',
      ' (     )~',
      '  || ||  ',
      '    ♪    ',
    ],
    [
      '  /\\_/\\  ',
      ' ( ^ω^ )~',
      '  )   (  ',
      ' (     ) ',
      '  || ||~ ',
      '         ',
    ],
    [
      ' ~/\\_/\\  ',
      ' ( ^ω^ ) ',
      '  )   (~ ',
      ' (     ) ',
      ' ~|| ||  ',
      '    ♪    ',
    ],
  ],

  // ── 兴奋（excited）跳跃 3帧 ──
  excited: [
    // 腾空
    [
      '  /\\_/\\  ',
      ' (>^ω^<) ',
      '  ) ↑ (  ',
      ' /     \\ ',
      '         ',
      '  \\   /  ',
    ],
    // 最高点
    [
      '         ',
      '  /\\_/\\  ',
      ' (>^ω^<) ',
      '  )   (  ',
      ' /     \\ ',
      '  \\   /  ',
    ],
    // 落地
    [
      '         ',
      '         ',
      '  /\\_/\\  ',
      ' (>^ω^<) ',
      '  |   |  ',
      ' /|   |\\ ',
    ],
  ],

  // ── 担心（worried）发抖 3帧 ──
  worried: [
    [
      '  /\\_/\\  ',
      ' ( o.o ) ',
      ' (> !! <)',
      '  |   |  ',
      ' (|   |) ',
      '  |   |  ',
    ],
    [
      ' /\\_/\\   ',
      '( o.o )  ',
      '(> !! <) ',
      ' |   |   ',
      '(|   |)  ',
      ' |   |   ',
    ],
    [
      '  /\\_/\\  ',
      ' ( O.O ) ',
      ' (> !! <)',
      '  |   |  ',
      ' (|   |) ',
      '  |   |  ',
    ],
  ],

  // ── 睡觉（sleeping）呼噜 3帧，zzZ 上浮 ──
  sleeping: [
    [
      '         ',
      '   zzZ   ',
      '  /\\_/\\  ',
      ' ( -.- ) ',
      ' (>   <) ',
      '  \\___/  ',
    ],
    [
      '    zZ   ',
      '         ',
      '  /\\_/\\  ',
      ' ( -.- ) ',
      ' (>   <) ',
      '  \\___/  ',
    ],
    [
      '     z   ',
      '         ',
      '  /\\_/\\  ',
      ' ( -.- ) ',
      ' (>   <) ',
      '  \\___/  ',
    ],
  ],

  // ── 伸懒腰（stretch）4帧 ──
  stretch: [
    // 开始弓背
    [
      '  /\\_/\\  ',
      ' ( ^.^ ) ',
      '  )___(  ',
      ' /     \\ ',
      '/       \\',
      '         ',
    ],
    // 完全伸展
    [
      '  /\\_/\\      ',
      ' ( ^.^ )     ',
      '  )   (______',
      ' /            ',
      '/             ',
      '              ',
    ],
    // 收回
    [
      '  /\\_/\\  ',
      ' ( ^.^ ) ',
      '  )___(  ',
      ' /     \\ ',
      '/       \\',
      '         ',
    ],
    // 回正
    [
      '  /\\_/\\  ',
      ' ( ^.^ ) ',
      '  )   (  ',
      ' (     ) ',
      '  || ||  ',
      '         ',
    ],
  ],

  // ── 打滚（roll）4帧 ──
  roll: [
    [
      '  /\\_/\\  ',
      '-(  .  )-',
      '  )   (  ',
      '  \\   /  ',
      '   \\_/   ',
      '         ',
    ],
    [
      '  /\\___  ',
      ' (  . /  ',
      '  )  /   ',
      '  \\ /    ',
      '   /     ',
      '         ',
    ],
    [
      '         ',
      '  _____  ',
      ' / . . \\ ',
      '(  ___  )',
      ' \\_____/ ',
      '         ',
    ],
    [
      '    \\_   ',
      '  \\ . )  ',
      '   \\  )  ',
      '    \\/   ',
      '         ',
      '         ',
    ],
  ],
};

// ─────────── 心情颜色 ───────────
const MOOD_COLOR = {
  idle:     A.cyan,
  happy:    A.green,
  excited:  A.yellow,
  worried:  A.red,
  sleeping: A.blue,
  stretch:  A.magenta,
  roll:     A.magenta,
};

// ─────────── 读取状态 ───────────
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return { mood: 'idle', stage: 'baby', xp: 0, level: 1, streak: 0 };
  }
}

// ─────────── 动画状态 ───────────
let frameIdx    = 0;
let walkX       = 4;           // 水平位置（空格偏移）
let walkDir     = 1;           // 1=右 -1=左
let lastMood    = 'idle';
let specialTimer = 0;          // 特殊动画剩余帧数
let currentAnim = 'idle';      // 当前播放动画名
let firstRender  = true;

// 随机特殊动画（伸懒腰/打滚）触发概率
const SPECIAL_CHANCE = 0.003; // 每帧 0.3% 概率

// ─────────── 气泡短语 ───────────
const BUBBLES = {
  idle:     ['...', '( ˘ω˘ )', '(*˘︶˘*)', '~'],
  happy:    ['✧', '♪~', '嘿嘿', '好开心~'],
  excited:  ['哇!', '冲!', '！！！', '耶~'],
  worried:  ['!?', '呜...', '???', '救命'],
  sleeping: ['zzZ', '...', '(梦中)', 'zz'],
  stretch:  ['伸~', '啊~', '困了', '活动一下'],
  roll:     ['嗖~', '咕噜', '转~', '哈哈'],
};

function getBubble(anim) {
  const pool = BUBBLES[anim] || BUBBLES.idle;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─────────── 渲染单帧 ───────────
let bubbleText = '...';
let bubbleTimer = 0;

function render(state) {
  const anim   = currentAnim;
  const frames = FRAMES[anim] || FRAMES.idle;
  const frame  = frames[frameIdx % frames.length];
  const color  = MOOD_COLOR[anim] || A.cyan;

  // 更新气泡（每 8 帧换一次）
  if (bubbleTimer <= 0) {
    bubbleText = getBubble(anim);
    bubbleTimer = 8;
  }
  bubbleTimer--;

  // 走动偏移（只在 idle 时生效）
  const pad = anim === 'idle' ? ' '.repeat(Math.max(0, walkX)) : ' '.repeat(4);

  // 构建输出
  const lines = [];

  // 行 0：气泡
  const bubble = `${pad}${A.dim}${bubbleText}${A.reset}`;
  lines.push(bubble);

  // 行 1-6：宠物主体
  for (let i = 0; i < 6; i++) {
    const bodyLine = frame[i] || '         ';
    lines.push(`${pad}${color}${bodyLine}${A.reset}`);
  }

  // 行 7：状态栏
  const xp     = state.xp    || 0;
  const level  = state.level || 1;
  const streak = state.streak || 0;
  const streakStr = streak > 1 ? ` ${A.yellow}${streak}d🔥${A.reset}` : '';
  const statsLine = `${A.gray} Lv.${level} [${xp}xp]${A.reset}${streakStr}`;
  lines.push(statsLine);

  // 输出（第一次直接打印，之后用光标回溯覆写）
  if (!firstRender) {
    process.stdout.write(A.up(HEIGHT));
  }
  firstRender = false;

  for (const line of lines) {
    process.stdout.write(A.clearLine + line + '\n');
  }
}

// ─────────── 动画逻辑 ───────────
function tick() {
  const state = loadState();
  const mood  = state.mood || 'idle';

  // 特殊动画倒计时
  if (specialTimer > 0) {
    specialTimer--;
    if (specialTimer === 0) currentAnim = mood;
  } else {
    // 心情切换重置帧数
    if (mood !== lastMood) {
      frameIdx = 0;
      currentAnim = mood;
      lastMood = mood;
    }

    // 概率触发伸懒腰/打滚（只在 idle/happy 时）
    if ((mood === 'idle' || mood === 'happy') && Math.random() < SPECIAL_CHANCE) {
      currentAnim  = Math.random() < 0.5 ? 'stretch' : 'roll';
      specialTimer = (FRAMES[currentAnim] || FRAMES.idle).length * 3;
      frameIdx     = 0;
    }
  }

  // 走动位置更新（只在 idle）
  if (currentAnim === 'idle') {
    walkX += walkDir * 0.5;
    const maxX = Math.max(0, process.stdout.columns - 18 || 20);
    if (walkX >= maxX || walkX <= 0) {
      walkDir *= -1;
      walkX = Math.max(0, Math.min(walkX, maxX));
    }
  }

  render(state);
  frameIdx++;
}

// ─────────── 启动 ───────────
process.stdout.write(A.hideCursor);
process.stdout.write('\n'.repeat(HEIGHT)); // 预留空间

// 初始空白帧（防止第一次 up 超出）
firstRender = true;

// 主循环
const INTERVAL = 400; // ms
const timer = setInterval(tick, INTERVAL);

// 退出清理
function cleanup() {
  clearInterval(timer);
  process.stdout.write(A.showCursor);
  process.stdout.write('\n');
  process.exit(0);
}
process.on('SIGINT',  cleanup);
process.on('SIGTERM', cleanup);
process.on('exit',    () => process.stdout.write(A.showCursor));

// 窗口大小变化时强制重绘
process.stdout.on('resize', () => { firstRender = true; });
