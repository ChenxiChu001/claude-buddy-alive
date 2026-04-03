/**
 * animation.js — ASCII 动画帧 + 终端渲染
 *
 * 每种情绪有多个帧，附带一句短语。输出到 stderr 让用户在终端中看到。
 */

// ─────────── ANSI 颜色 ───────────
const c = {
  reset:   '\x1b[0m',
  dim:     '\x1b[2m',
  bold:    '\x1b[1m',
  yellow:  '\x1b[33m',
  green:   '\x1b[32m',
  red:     '\x1b[31m',
  cyan:    '\x1b[36m',
  magenta: '\x1b[35m',
  blue:    '\x1b[34m',
  gray:    '\x1b[90m',
  white:   '\x1b[97m',
  bg: {
    black:  '\x1b[40m',
  },
};

// ─────────── ASCII 帧 ───────────

const FRAMES = {
  // ─── 各阶段的基础外观 ───
  baby: {
    idle:     ['(=｀ω´=)', '(=｀ω´=) ', ' (=｀ω´=)'],
    happy:    ['(=^ω^=)✧', '(=^ω^=)✦', '(=^ω^=)✧'],
    excited:  ['ヽ(=^･ω･^=)丿', 'ヽ(=^･ω･^=)ノ', '＼(=^･ω･^=)丿'],
    worried:  ['(=°д°=)!!', '(=°д°=)! ', '(=°д°=)!!'],
    sleeping: ['(=-.-)zzZ', '(=-.-)zZ ', '(=-.-)z  '],
  },
  teen: {
    idle:     ['(=ↀωↀ=)', '(=ↀωↀ=) ', ' (=ↀωↀ=)'],
    happy:    ['(=ↀ⩊ↀ=)✧', '(=ↀ⩊ↀ=)✦', '(=ↀ⩊ↀ=)✧'],
    excited:  ['ヽ(=ↀ⩊ↀ=)丿', 'ヽ(=ↀ⩊ↀ=)ノ', '＼(=ↀ⩊ↀ=)丿'],
    worried:  ['(=ↀ_ↀ=)!!', '(=ↀ_ↀ=)! ', '(=ↀ_ↀ=)!!'],
    sleeping: ['(=ↀ-ↀ=)zzZ', '(=ↀ-ↀ=)zZ ', '(=ↀ-ↀ=)z  '],
  },
  adult: {
    idle:     ['₍˄·͈༝·͈˄₎◞ ̑̑', '₍˄·͈༝·͈˄₎◞̑̑ ', ' ₍˄·͈༝·͈˄₎◞̑̑'],
    happy:    ['₍˄·͈༝·͈˄*₎◞ ̑̑✧', '₍˄·͈༝·͈˄*₎◞̑̑✦', '₍˄·͈༝·͈˄*₎◞̑̑✧'],
    excited:  ['ヽ₍˄·͈༝·͈˄₎ノ', 'ヽ₍˄·͈༝·͈˄₎丿', '＼₍˄·͈༝·͈˄₎ノ'],
    worried:  ['₍˄°༝°˄₎!!', '₍˄°༝°˄₎! ', '₍˄°༝°˄₎!!'],
    sleeping: ['₍˄-༝-˄₎zzZ', '₍˄-༝-˄₎zZ ', '₍˄-༝-˄₎z  '],
  },
  elite: {
    idle:     ['✦(=｀ω´=)✦', '✧(=｀ω´=)✧', '✦(=｀ω´=)✦'],
    happy:    ['✦(=^ω^=)✦✧', '✧(=^ω^=)✧✦', '✦(=^ω^=)✦✧'],
    excited:  ['✦ヽ(=^･ω･^=)丿✦', '✧ヽ(=^･ω･^=)ノ✧', '✦＼(=^･ω･^=)丿✦'],
    worried:  ['✦(=°д°=)!!✦', '✧(=°д°=)!!✧', '✦(=°д°=)!!✦'],
    sleeping: ['✦(=-.-)zzZ✦', '✧(=-.-)zZ✧ ', '✦(=-.-)z✦  '],
  },
};

// ─────────── 台词库 ───────────

const PHRASES = {
  // 情绪 → 触发原因 → 台词候选
  happy: {
    file_write:  ['又写了新东西~', '产出 +1!', '代码在生长中...', '写得不错嘛'],
    default:     ['心情不错~', '今天状态挺好', '继续保持!'],
  },
  excited: {
    commit:      ['提交啦! 太棒了!', '又一个 commit, 稳步前进!', 'git log 又长了一行!'],
    test_pass:   ['测试全过! 完美!', '绿灯亮了!', '所有测试都通过了~'],
    default:     ['太激动了!', '这波操作很秀!', '感觉今天能搞大事!'],
  },
  worried: {
    bash_error:  ['出错了... 没事, 我陪你', '报错了呢, 别急', '哎呀, 看看是什么问题'],
    test_fail:   ['测试没过, 一起看看?', '红灯了... 加油!', '测试失败了, 但别灰心'],
    default:     ['有点担心...', '这看起来不太妙', '小心点哦'],
  },
  sleeping: {
    default:     ['zzZ...', '做了个好梦...', '（轻轻地打着呼噜）'],
  },
  idle: {
    reading:     ['在读代码呢', '嗯...在研究', '（安静地看着你工作）'],
    searching:   ['找找看...', '搜索中~', '在翻文件呢'],
    default:     ['...', '（眨眼）', '（安静地待着）'],
  },
};

// ─────────── 特殊事件台词 ───────────

const GREETINGS = {
  morning:     ['早上好! 新的一天~', '早! 今天也一起加油吧!', '起床啦! 精神满满!'],
  afternoon:   ['下午好~ 效率时间!', '午后时光, 来写点代码~', '下午好, 继续冲!'],
  evening:     ['晚上好~ 还在忙呢?', '夜间模式启动...', '晚上了, 注意休息哦'],
  latenight:   ['这么晚了还在写代码?!', '深夜模式... 注意身体', '别太拼了, 身体要紧'],
  comeback:    ['好久不见! 想你了~', '你回来啦! 我快饿扁了...', '终于等到你了!'],
};

const FAREWELLS = [
  '辛苦了, 明天见~',
  '今天做了好多事呢, 晚安!',
  '拜拜~ 早点休息',
  '存档完毕, 下次再见!',
];

// ─────────── 渲染函数 ───────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getFrame(stage, mood) {
  const stageFrames = FRAMES[stage] || FRAMES.baby;
  const moodFrames = stageFrames[mood] || stageFrames.idle;
  return pick(moodFrames);
}

function getPhrase(mood, reason) {
  const moodPhrases = PHRASES[mood] || PHRASES.idle;
  const reasonPhrases = moodPhrases[reason] || moodPhrases.default || ['...'];
  return pick(reasonPhrases);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return pick(GREETINGS.morning);
  if (hour >= 12 && hour < 18) return pick(GREETINGS.afternoon);
  if (hour >= 18 && hour < 23) return pick(GREETINGS.evening);
  return pick(GREETINGS.latenight);
}

function getComebackGreeting() {
  return pick(GREETINGS.comeback);
}

function getFarewell() {
  return pick(FAREWELLS);
}

/**
 * 构建完整的显示行
 */
function buildDisplay(state, reason) {
  const frame = getFrame(state.stage, state.mood);
  const phrase = getPhrase(state.mood, reason);

  const moodColor = {
    happy: c.green,
    excited: c.yellow,
    worried: c.red,
    sleeping: c.blue,
    idle: c.cyan,
  }[state.mood] || c.white;

  const levelBadge = `${c.dim}Lv.${state.level}${c.reset}`;
  const xpBar = `${c.dim}[${state.xp}xp]${c.reset}`;
  const streakBadge = state.streak > 1 ? ` ${c.yellow}${state.streak}d streak${c.reset}` : '';

  const line = `${c.gray}┃${c.reset} ${moodColor}${frame}${c.reset} ${c.dim}${phrase}${c.reset}  ${levelBadge} ${xpBar}${streakBadge}`;
  return line;
}

/**
 * 构建 session start 欢迎消息
 */
function buildGreetingDisplay(state, isComeback) {
  const frame = getFrame(state.stage, 'happy');
  const greeting = isComeback ? getComebackGreeting() : getGreeting();

  const moodColor = c.green;
  const levelBadge = `${c.dim}Lv.${state.level}${c.reset}`;
  const streakBadge = state.streak > 1 ? ` ${c.yellow}${state.streak}d streak!${c.reset}` : '';

  const border = `${c.gray}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${c.reset}`;
  const bottom = `${c.gray}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${c.reset}`;
  const petLine = `${c.gray}┃${c.reset} ${moodColor}${frame}${c.reset}  ${levelBadge}${streakBadge}`;
  const msgLine = `${c.gray}┃${c.reset} ${c.white}${greeting}${c.reset}`;

  return `${border}\n${petLine}\n${msgLine}\n${bottom}`;
}

/**
 * 构建 session end 告别消息
 */
function buildFarewellDisplay(state) {
  const frame = getFrame(state.stage, 'sleeping');
  const farewell = getFarewell();

  const border = `${c.gray}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${c.reset}`;
  const bottom = `${c.gray}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${c.reset}`;
  const petLine = `${c.gray}┃${c.reset} ${c.blue}${frame}${c.reset}  ${c.dim}+${state.todayActions} actions today${c.reset}`;
  const msgLine = `${c.gray}┃${c.reset} ${c.white}${farewell}${c.reset}`;

  return `${border}\n${petLine}\n${msgLine}\n${bottom}`;
}

/**
 * 输出到 stderr（用户可见，不影响 Claude 上下文）
 */
function render(text) {
  process.stderr.write(text + '\n');
}

module.exports = {
  FRAMES,
  PHRASES,
  getFrame,
  getPhrase,
  getGreeting,
  getFarewell,
  buildDisplay,
  buildGreetingDisplay,
  buildFarewellDisplay,
  render,
  c,
  pick,
};
