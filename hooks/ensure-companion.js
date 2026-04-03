#!/usr/bin/env node
/**
 * ensure-companion.js — UserPromptSubmit Hook
 *
 * 每次用户发消息时触发（新对话/旧对话都行）。
 * 检查伴侣窗口是否在运行，没在运行就启动一个新的。
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const PID_FILE       = path.join(os.homedir(), '.claude', 'buddy-companion.pid');
const COMPANION_SCRIPT = path.join(__dirname, '../src/companion.js');

async function main() {
  // 消耗 stdin
  let payload = '';
  for await (const chunk of process.stdin) payload += chunk;

  // 检查 PID 文件
  let running = false;
  try {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10);
    if (pid && !isNaN(pid)) {
      // 发送信号 0：进程存在则不抛异常
      process.kill(pid, 0);
      running = true;
    }
  } catch {
    // 进程不存在或 PID 文件不存在
    running = false;
  }

  if (!running) {
    // 启动新的伴侣窗口
    const { spawn } = require('child_process');
    if (process.platform === 'win32') {
      // Windows：新 cmd 窗口
      spawn(
        'cmd.exe',
        ['/c', 'start', '"Buddy"', 'node', COMPANION_SCRIPT],
        { detached: true, stdio: 'ignore', shell: false }
      ).unref();
    } else {
      // macOS / Linux：新终端（尝试 gnome-terminal / osascript）
      const isMac = process.platform === 'darwin';
      if (isMac) {
        spawn(
          'osascript',
          ['-e', `tell app "Terminal" to do script "node '${COMPANION_SCRIPT}'"`],
          { detached: true, stdio: 'ignore' }
        ).unref();
      } else {
        spawn(
          'gnome-terminal',
          ['--', 'node', COMPANION_SCRIPT],
          { detached: true, stdio: 'ignore' }
        ).unref();
      }
    }
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
