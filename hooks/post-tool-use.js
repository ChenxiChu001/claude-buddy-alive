#!/usr/bin/env node
/**
 * post-tool-use.js — PostToolUse Hook
 *
 * 每次 Claude Code 工具执行后触发。
 * 读取 stdin 获取工具上下文，分析情绪，更新状态，渲染 ASCII 宠物。
 */

const state = require('../src/state');
const mood = require('../src/mood');
const animation = require('../src/animation');

const fs = require('fs');
const LOG = require('os').homedir() + '/.claude/buddy-debug.log';
function log(msg) { fs.appendFileSync(LOG, new Date().toISOString() + ' ' + msg + '\n'); }

async function main() {
  log('hook invoked');
  // 从 stdin 读取 Claude Code hook payload
  let payload = '';
  for await (const chunk of process.stdin) {
    payload += chunk;
  }
  log('payload: ' + payload.slice(0, 120));

  let data;
  try {
    data = JSON.parse(payload);
  } catch {
    // 无法解析 payload，静默退出
    process.exit(0);
  }

  const toolName = data.tool_name || data.toolName || '';
  const toolInput = data.tool_input || data.toolInput || {};
  const toolOutput = data.tool_output || data.toolOutput || '';
  const exitCode = data.exit_code ?? data.exitCode ?? null;

  // 加载宠物状态
  const s = state.load();

  // 分析事件
  const event = mood.analyzeToolEvent(toolName, toolInput, toolOutput, exitCode);

  // 更新心情
  mood.updateMood(s, event.mood);

  // 累加 XP 和统计
  state.addXP(s, event.xp);
  s.totalActions += 1;
  s.todayActions += 1;

  if (event.reason === 'commit') s.totalCommits += 1;
  if (event.reason === 'bash_error' || event.reason === 'test_fail') s.totalErrors += 1;
  if (event.reason === 'test_pass') s.totalTestPasses += 1;
  if (event.reason === 'file_write') s.totalFilesWritten += 1;

  // 检查连续天数
  state.checkStreak(s);

  // 保存
  state.save(s);

  // 渲染宠物 — stdout 输出给 Claude Code 作为 hook feedback
  const display = animation.buildDisplay(s, event.reason);
  // 同时写 stderr（终端可见）和 stdout（Claude Code 可见）
  process.stderr.write(display + '\n');
  process.stdout.write(display + '\n');

  process.exit(0);
}

main().catch(() => process.exit(0));
