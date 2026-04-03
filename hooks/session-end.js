#!/usr/bin/env node
/**
 * session-end.js — Stop Hook
 *
 * 会话结束时触发，宠物存档并道晚安。
 */

const state = require('../src/state');
const animation = require('../src/animation');

async function main() {
  // 消耗 stdin
  let payload = '';
  for await (const chunk of process.stdin) {
    payload += chunk;
  }

  const s = state.load();

  // 记录会话结束时间
  s.lastSessionEnd = Date.now();
  s.mood = 'sleeping';
  s.moodSince = Date.now();

  // 保存
  state.save(s);

  // 渲染告别消息
  const display = animation.buildFarewellDisplay(s);
  animation.render(display);

  process.exit(0);
}

main().catch(() => process.exit(0));
