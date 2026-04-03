#!/usr/bin/env node
/**
 * session-start.js — SessionStart / PreToolUse (first-run) Hook
 *
 * 会话开始时触发，宠物起床问好。
 * 如果距离上次会话超过 3 天，显示"饿了"的回归消息。
 */

const state = require('../src/state');

const COMPANION_SCRIPT = require('path').join(__dirname, '../src/companion.js');

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

  // 检查连续天数
  state.checkStreak(s);

  // 重置今日计数
  s.todayActions = 0;

  // 更新心情为 happy
  s.mood = 'happy';
  s.moodSince = Date.now();

  // 设置问候标记，让状态栏下次刷新时显示问候语
  const hour = new Date().getHours();
  let greeting;
  if (isComeback) {
    greeting = ['好久不见! 想你了~', '你回来啦! 我快饿扁了...', '终于等到你了!'][Math.floor(Math.random() * 3)];
  } else if (hour >= 5 && hour < 12) {
    greeting = ['早上好! 新的一天~', '早! 今天也一起加油吧!', '起床啦! 精神满满!'][Math.floor(Math.random() * 3)];
  } else if (hour >= 12 && hour < 18) {
    greeting = ['下午好~ 效率时间!', '午后时光, 来写点代码~', '下午好, 继续冲!'][Math.floor(Math.random() * 3)];
  } else if (hour >= 18 && hour < 23) {
    greeting = ['晚上好~ 还在忙呢?', '夜间模式启动...', '晚上了, 注意休息哦'][Math.floor(Math.random() * 3)];
  } else {
    greeting = ['这么晚了还在写代码?!', '深夜模式... 注意身体', '别太拼了, 身体要紧'][Math.floor(Math.random() * 3)];
  }
  s.greetingPending = greeting;

  // 保存
  state.save(s);

  // 在新窗口启动伴侣动画（仅 Windows，且尚未运行）
  try {
    const { execSync, spawn } = require('child_process');
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      // 检查是否已有 companion 进程在跑
      let running = false;
      try {
        const out = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', { encoding: 'utf-8' });
        // 简单检测：读 buddy-state 里是否有 companionPid
        const st = state.load();
        if (st.companionPid) {
          try { process.kill(st.companionPid, 0); running = true; } catch {}
        }
      } catch {}

      if (!running) {
        const child = spawn(
          'cmd.exe',
          ['/c', 'start', '""', 'node', COMPANION_SCRIPT],
          { detached: true, stdio: 'ignore', shell: false }
        );
        child.unref();
      }
    }
  } catch {}

  process.exit(0);
}

main().catch(() => process.exit(0));
