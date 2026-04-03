# claude-buddy-alive

> Make your Claude Code `/buddy` pet feel truly alive.

A Claude Code plugin that gives your terminal companion **reactive emotions**, a **growth system**, and **cross-session memory**. Your buddy watches your coding sessions and responds — celebrating your commits, worrying about errors, and remembering you between sessions.

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ (=^ω^=)✧  Lv.3  1d streak!
┃ 早上好! 新的一天~
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## Features

### MVP (v1)
- **Emotion Engine** — buddy reacts to your tool use in real-time
  - `Write`/`Edit` success → happy 😊
  - `Bash` error → worried 😟
  - `git commit` → excited 🎉
  - Tests pass → ecstatic 🚀
  - Idle → sleeping 💤
- **XP & Growth** — earn XP from coding actions, evolve through 4 stages
  - `baby` → `teen` → `adult` → `elite`
  - Each stage has unique ASCII art
- **Cross-session Memory** — buddy remembers your streak, XP, and mood
- **Session Greetings** — time-aware hello & goodbye messages

### Roadmap (v2)
- [ ] AI-powered personality voice (via Claude API / Haiku)
- [ ] Biological rhythm (rest reminders, late-night warnings)
- [ ] Cron-driven idle animations
- [ ] Achievement system & badges

## Install

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/claude-buddy-alive.git
cd claude-buddy-alive
node install.js
```

Or via npm (once published):

```bash
npm install -g claude-buddy-alive
buddy-install
```

## How It Works

```
Claude Code Tool Use
        │
        ▼
  ┌──────────────────┐
  │  PostToolUse Hook │  ← hooks/post-tool-use.js
  │  (every action)   │
  └────────┬─────────┘
           │
     ┌─────▼─────┐
     │ Mood Engine│  ← src/mood.js
     │ (analyze)  │
     └─────┬─────┘
           │
     ┌─────▼─────┐
     │  State DB  │  ← ~/.claude/buddy-state.json
     │ (persist)  │
     └─────┬─────┘
           │
     ┌─────▼─────┐
     │  Renderer  │  ← src/animation.js
     │ (ASCII art)│
     └────────────┘
           │
           ▼
      stderr output
      (user sees it)
```

### Hooks Installed

| Hook | Event | What It Does |
|------|-------|-------------|
| `buddy:post-tool-use` | `PostToolUse *` | Analyzes tool result, updates mood & XP, renders ASCII |
| `buddy:session-end` | `Stop` | Saves state, shows farewell message |

### XP Table

| Action | XP |
|--------|----|
| Read / Search | +1 |
| Write / Edit file | +3 |
| Git commit | +10 |
| Test pass | +15 |

### Evolution Stages

| Stage | XP Required | ASCII |
|-------|------------|-------|
| Baby | 0 | `(=^ω^=)` |
| Teen | 100 | `(=ↀ⩊ↀ=)` |
| Adult | 500 | `₍˄·͈༝·͈˄₎◞̑̑` |
| Elite | 1000 | `✦(=^ω^=)✦` |

## Project Structure

```
claude-buddy-alive/
├── install.js              # One-click installer
├── hooks/
│   ├── post-tool-use.js    # Main emotion-sensing hook
│   ├── session-start.js    # Morning greeting
│   └── session-end.js      # Save & farewell
├── src/
│   ├── state.js            # State persistence (~/.claude/buddy-state.json)
│   ├── mood.js             # Emotion state machine
│   └── animation.js        # ASCII frames + terminal rendering
└── config/
    └── settings-snippet.json  # Manual hook config reference
```

## Uninstall

Remove hooks with id `buddy:*` from `~/.claude/settings.json`.

## License

MIT
