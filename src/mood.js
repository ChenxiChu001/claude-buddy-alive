/**
 * mood.js — 情绪状态机
 *
 * 根据工具事件决定宠物当前心情，返回新的情绪和触发原因。
 */

const MOODS = {
  idle: { weight: 0, decay: 0 },
  happy: { weight: 2, decay: 120_000 },      // 2 分钟衰减
  excited: { weight: 3, decay: 60_000 },      // 1 分钟衰减
  worried: { weight: 2, decay: 90_000 },      // 1.5 分钟衰减
  sleeping: { weight: 1, decay: Infinity },    // 需要主动唤醒
};

/**
 * 分析 PostToolUse 事件，返回 { mood, reason, xp }
 */
function analyzeToolEvent(toolName, toolInput, toolOutput, exitCode) {
  const input = typeof toolInput === 'string' ? toolInput : JSON.stringify(toolInput || '');
  const output = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput || '');
  const failed = exitCode != null && exitCode !== 0;
  const hasError = /error|fail|exception|panic|traceback|ENOENT|EACCES/i.test(output);

  // Git commit — big moment
  if (toolName === 'Bash' && /git\s+commit/.test(input)) {
    return { mood: 'excited', reason: 'commit', xp: 10 };
  }

  // Test pass
  if (toolName === 'Bash' && /test|jest|vitest|pytest|go test|cargo test/.test(input)) {
    if (!failed && !hasError) {
      return { mood: 'excited', reason: 'test_pass', xp: 15 };
    }
    return { mood: 'worried', reason: 'test_fail', xp: 2 };
  }

  // Bash error
  if (toolName === 'Bash' && (failed || hasError)) {
    return { mood: 'worried', reason: 'bash_error', xp: 1 };
  }

  // Write / Edit success
  if ((toolName === 'Write' || toolName === 'Edit') && !hasError) {
    return { mood: 'happy', reason: 'file_write', xp: 3 };
  }

  // Read — neutral / slightly positive (research)
  if (toolName === 'Read') {
    return { mood: 'idle', reason: 'reading', xp: 1 };
  }

  // Grep / Glob — searching
  if (toolName === 'Grep' || toolName === 'Glob') {
    return { mood: 'idle', reason: 'searching', xp: 1 };
  }

  // Default
  return { mood: 'idle', reason: 'unknown', xp: 1 };
}

/**
 * 判断当前情绪是否应该自然衰减回 idle
 */
function shouldDecay(state) {
  const elapsed = Date.now() - (state.moodSince || 0);
  const moodInfo = MOODS[state.mood] || MOODS.idle;
  return elapsed > moodInfo.decay;
}

/**
 * 新情绪是否应覆盖当前情绪（权重系统）
 */
function shouldOverride(currentMood, newMood) {
  const currentWeight = (MOODS[currentMood] || MOODS.idle).weight;
  const newWeight = (MOODS[newMood] || MOODS.idle).weight;
  // 更高权重的情绪覆盖，或当前已衰减
  return newWeight >= currentWeight;
}

/**
 * 更新情绪状态，返回是否有变化
 */
function updateMood(state, newMood) {
  const changed = state.mood !== newMood;
  if (shouldOverride(state.mood, newMood) || shouldDecay(state)) {
    state.mood = newMood;
    state.moodSince = Date.now();
  }
  return changed;
}

module.exports = {
  MOODS,
  analyzeToolEvent,
  shouldDecay,
  shouldOverride,
  updateMood,
};
