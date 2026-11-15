---
title: Letting AI agents run unattended on my Mac
date: 2026-11-13
dek: How I set up my MacBook as code, and a sandbox where coding agents work for hours without asking me before every command.
kind: engineering
tags: [ai, agents, security, developer-experience, macos]
draft: false
---

**TL;DR**

- My Mac is rebuilt from one repo: wipe, clone, run one script, and it is ready in about 30 minutes. Every
  choice is written down with the reason for it.
- AI coding agents run in a container I call the agent box. Inside it they never ask for permission; the box
  itself is the boundary. It sees one project, reaches only allowlisted hosts, and cannot push to main or cut
  a release without me.
- In one long session, the agent made about 4,800 tool calls that needed permission. Ten of them reached me.
- The lesson that keeps coming back is that silent failures are the dangerous ones. Make failure loud, enforce
  rules in code the agent cannot edit, and test in the real environment.

## Why I started

Two problems pushed me into this.

The first was the machine itself. Every laptop I have owned slowly turned into something I could not rebuild:
tools installed by hand, settings changed and forgotten, three ways of managing Node versions. When a machine
like that dies, you lose a week.

The second came with coding agents. At first they ran directly on my Mac with the usual permission prompts,
inside tmux so a long run survived a closed window. An agent that asks before every shell command is safe,
but you end up approving hundreds of commands, and after the first fifty you click yes without reading.
I wanted agents to run for hours on their own while I did something else, without handing them my laptop. The
agents that built [my software factory](/writing/building-the-software-factory/) all work this way.

## The Mac as code

Everything about the machine lives in one repo, and one script applies it. The script is safe to run again at
any time, and it has a dry-run mode that prints what it would change.

- Homebrew installs everything from a single Brewfile, and every line carries a dated comment saying why it
  is there. Free and open source tools only; no global npm or pip installs, and no `curl | sh`.
- chezmoi manages the dotfiles. I never edit `~/.zshrc` directly; I edit the source in the repo and apply it.
- mise owns language runtimes and pinned dev tools, so there is exactly one version manager.
- Personal files and technical work live in separate trees, and every repo has a fixed place, so two repos
  with the same name never collide.
- Every commit is signed, and a global pre-commit hook scans each one for secrets.

The habit that matters most is recording decisions next to the config. The README keeps a running FAQ of
questions already answered once, so that neither I nor an agent has to work them out again. When a decision
is reversed, the reversal is written down with its date and reason, so the trade-off is not rediscovered from
scratch.

## The agent box

The box is a dev container, run with Colima and the Dev Containers CLI. One command starts it for the
project I am in. Claude Code and Codex both run inside it.

The design starts from one assumption: the agent is untrusted. It runs with permission prompts turned off, so
nothing stops it from running whatever it decides to run. Sooner or later it will do something unexpected, so
the design is about limiting how much damage that can cause.

What the agent can reach:

- Files: only the project I started the box in, read and write. The directory you start from is the boundary.
  The rest of my home folder and my SSH keys are not visible.
- Network: blocked by default. All traffic goes through a local proxy that allows a short list of hostnames,
  and the firewall's only job is to make that proxy the one way out. When an agent needs a new host, it writes
  a request that I review. Most requests are for documentation it wants to cite.
- Credentials: unattended runs use a token that can call the model and little else. My signing key never
  enters the box. The only way to keep a credential from leaking out of the box is to keep it out of the box.
- Git: a plain `git push` is denied. A small root-owned wrapper pushes only to branches that are not main,
  and merges only pull requests that do not target main. Releases always ask me.

The other half is that the agent cannot change the rules. The policy files are owned by root and baked into
the image, the agent runs as an ordinary user without sudo, and the whole definition of the box lives in my
setup repo, never inside a project. An earlier version copied the box's files into each project, which meant
an agent could edit the definition of its own sandbox. That version did not last long.

There are two modes. Unattended mode has the narrow token and is for "start it, then read the diff later".
Attended mode has a full login and is for when I am watching.

Inside those walls the agent can do anything a developer would: run the shell, build, test, start a local
Postgres or Redis, and drive a headless browser.

## Where review went

I still review, but at a different place. In one long session, the agent went through its own transcript and
counted about 4,800 tool calls that needed permission. All but 10 went through automatically. The 10 were all
the same thing, Claude Code's built-in check on deleting files with a wildcard.

Approving each command is the wrong layer for an agent that runs unattended. A better split is to make the
boundary small and fixed, let the agent move freely inside it, and keep a person on the few actions that
cross the boundary or cannot be undone: merging into main, releases and new network hosts.

I also split the work so that the agent that writes the code is not the one that proves it works. Checks
that need real hardware run in a separate session on my Mac, which runs them and reports, but does not edit or
commit anything. That keeps the evidence honest.

## Skills and plugins are code

Agent skills and plugins look like configuration, but a skill is a prompt, and a prompt has authority over an
agent that does not ask before acting. So I treat installing one as a code review, not a download. Third-party
skills are copied into my repo, read in full, and pinned to a commit. Nothing in the box fetches third-party
code while it runs without prompts.

I learned this the hard way when I installed a public plugin collection into Codex and every turn broke. One
plugin's hook produced output in a format only Claude Code understands. Plain prompt content works with any
agent; hooks and tool endpoints usually do not.

## What went wrong

A few things broke along the way, and they had one thing in common: none of them announced itself.

- Builds in the box timed out because one network path was very slow. I enabled IPv6 behind a live test with a
  fallback, and the test failed in every real box, because I had only tried it in a bare container that lacked
  the box's proxy settings.
- I told agents in their instructions not to delete files with wildcards. They followed it some of the time.
  Now a root-owned hook refuses that command and tells the agent what to do instead. A rule in an instructions
  file only works while every sub-agent remembers it.
- A fix to the teardown command was already on disk, but a terminal that had been open since before the fix
  still ran the old version and deleted a set of agent sessions. Every shell now records when its config was
  loaded, and teardown refuses to run from a stale one.
- Colima rewrote its own config file on reboot and dropped every comment, including the marker a health check
  looked for.
- Several agents working in parallel filled the box's 99 GB disk, about 36 GB of it Go build cache. That one is not fixed yet.

The responses share a shape: make failure loud, enforce rules in code the agent cannot edit, test in the real
environment, and write down every reversal.

## What I would tell someone starting

Start with the machine as code, even before agents. It pays off the first time you set up a new laptop, and it
gives agents a clear, written record of how things are done.

When you add agents, decide the blast radius first and the rules second. If the boundary is solid, you can let
the agent run without prompts. If the boundary is weak, prompts will not save you, because nobody reads the
four-hundredth one.

And ask your agents to say what they verified and what they guessed. A confident wrong answer costs more than
an honest "unclear".
