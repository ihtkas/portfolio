---
title: My Mac and the agent box
section: Now
kind: oss
period: 2026 to present
summary: My MacBook, set up from one repo so it can be rebuilt from scratch in about 30 minutes. It includes the agent box, a container where Claude Code and Codex run without asking permission on every command.
stack: [Homebrew, chezmoi, mise, Dev Containers, Colima, Claude Code, Codex]
order: 3
links:
  writeup: /writing/letting-agents-run-unattended/
---

My MacBook, set up from one repo: wipe the machine, clone, run one script, and it is ready in about 30
minutes. Every install, dotfile, runtime and system setting is declared in a file with the reason for it,
so the machine never drifts into something nobody can rebuild.

The part I use most is the agent box, a container where Claude Code and Codex run without asking me for
permission on every command. It sees only the project it works on, reaches only the hosts on an allowlist,
and cannot push to main, merge into main or cut a release without me. The rules that define the box live
outside anything the agent can write to.

Where it stands: it is how I run Claude Code and Codex on my own projects. In one long session the agent
made about 4,800 tool calls that needed permission, and 10 of them reached me.
