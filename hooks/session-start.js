#!/usr/bin/env node
/**
 * session-start.js — SessionStart / PreToolUse (first-run) Hook
 *
 * 会话开始时触发，宠物起床问好。
 * 如果距离上次会话超过 3 天，显示"饿了"的回归消息。
 */

const state = require('../src/state');
const animation = require('../src/animation');

async function main() {
  // 消耗 stdin（hook 规范要求）
  let payload = '';
  for await (const chunk of process.stdin) {
    payload += chunk;
  }

  const s = state.load();

  // 判断是否"很久没见"
  const daysSince = state.getDaysSinceLastSession(s);
  const isComeback = daysSince >= 3;

  // 如果是回归，宠物可能饿了
  if (isComeback) {
    s.mood = 'worried'; // 先担心，然后看到主人后转为开心
  }

  // 检查连续天数
  state.checkStreak(s);

  // 重置今日计数
  s.todayActions = 0;

  // 更新心情为 happy（见到主人了）
  s.mood = 'happy';
  s.moodSince = Date.now();

  // 保存
  state.save(s);

  // 渲染欢迎消息
  const display = animation.buildGreetingDisplay(s, isComeback);
  animation.render(display);

  process.exit(0);
}

main().catch(() => process.exit(0));
