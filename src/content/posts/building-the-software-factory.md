---
title: Building a software factory with AI agents
date: 2026-11-14
dek: How one person and a team of AI agents built production libraries and a Jira-class project management tool, what went wrong, and where human judgement still mattered.
kind: engineering
tags: [ai, agents, software-factory, go, vela]
draft: false
---

**TL;DR**

- I built a set of shared libraries and a self-hosted project management tool called Vela, as one person
  working with AI coding agents in my spare time. The agents wrote nearly all of the code.
- An AI review of my plan estimated five to seven engineer-months of work before the first product milestone.
  It took a small fraction of that. Writing features stopped being the slow part; proving them on real
  infrastructure took the time.
- The setup works like a small team: written designs before code, builder agents, independent reviewer
  agents, and one person making the product and design calls.
- Tests passing was never enough. Every serious miss passed its tests and failed against reality.

This is a hobby, though one I take seriously. I have a full-time job, and I work on these projects on
weekends and holidays. The why behind it is in [part 1](/writing/software-is-cheap-now/): I think cheap software
changes the build-or-buy decision for a lot of companies, and I wanted to test that on something real.

## What I built

The software factory is the set of parts a company needs to own production software without starting from
zero each time:

- go-libs: backend packages in Go for what every production service needs, such as Postgres access and
  migrations, RPC, sessions, background jobs, an outbox with SQS and Kafka consumers, caching, telemetry and
  rate limiting.
- ui-libs: frontend packages and a design system, so a product does not start from a blank stylesheet.
- the golden path: the plans and recorded rulings that say how the pieces fit, and why.
- a reference application where every package runs for the first time, end to end, up to a Helm chart on
  Kubernetes.

One rule shapes all of it. Agents write most of each company's application, but the packages have to be just
as natural for a person writing the same code by hand. If a design only makes sense to a code generator, it is
the wrong design.

Vela is the first product: self-hosted project management for software teams. I chose it on purpose. The
domain is well understood, everyone has an opinion about Jira and Linear, and it is a demanding test, with
custom work item types and fields, an enforced workflow, a query language, item-level permissions, single
sign-on and user provisioning. Its first version is now feature-complete: six backend services that run
bundled or split, and a web app with boards, a backlog, sprints, capacity, a timeline, a query builder,
dashboards, an inbox, an audit log and SSO administration. AI agents can work in it over MCP, with the user's
rights narrowed to the agent's scopes, and anything an agent writes can wait for a person to approve. It is in
acceptance testing and has no production users yet.

## Where the time went

Before the build, an AI reviewer read my plans and estimated the work before Vela's first milestone at five to
seven engineer-months, already assuming agent help. The packages Vela needs, a reference app that runs them end
to end, and every first-version feature of Vela were done in a small fraction of that.

Most of the effort went somewhere else. Before any code, I spent a long time scoping Vela and building a
clickable mock of every screen, so the product was settled before the build started. After the features were
in, proving that they worked on real infrastructure and in a real browser, and matching the mock's look and
feel, took far longer than writing them.

The other constraint was me. The waits that show up in the logs are my answers to open questions, the usage
limits on the models, and agents tripping over each other, rather than the code itself.

## How the work gets done

I am the only person on these projects, and agents wrote nearly all of the code. The setup looks more like
running a small team than like pair programming.

An orchestrating agent, running in a sandboxed container, assigns work and keeps a status file. Builder agents
implement one slice each. Other agents review every pull request independently before the orchestrator merges
it into the development branch, and I promote that branch to main. Agents never approve their own work. A
separate session on my Mac runs what the sandbox cannot, such as Docker, a local Kubernetes cluster and other
browsers, and reports back. How that sandbox works is in [part 3](/writing/letting-agents-run-unattended/).

The work units are small and the specs are thick. Every package starts as a design doc with a fixed template,
ending in a brief for whoever implements it, and nothing is built until I merge the design. Agents collect
their open questions on one page and I answer in a sentence or two. Those answers become numbered rulings,
quoted word for word, and the documents always state one current position. When a ruling changes, the old
text is deleted and git keeps the history.

The documents turned out to matter more than I expected. They are what let dozens of sessions that do not
remember each other build one coherent system.

## What went wrong

The first full run on a real Kubernetes cluster failed, even though every test in the sandbox was green. A
database pool wrote a temporary file at startup, and the production pod had a read-only root filesystem. No
unit test could see that. WebKit, the engine behind Safari, also dropped the session cookie on localhost. It
took a few reruns to get everything green. Since then the rule is simple: the sandbox proves logic, and only a
real cluster on a real machine proves deployment.

Green tests are not a working product. Twice, a defect passed the whole suite and broke the moment a person
opened the page; in one, a paused webhook and a failing one looked identical. The tests checked something
true, but not the thing that mattered. Since then the agents drive a real browser themselves.

One design was torn up by measurement. Vela first computed hierarchy totals when they were read. Under load
that took 946 ms against 15 ms for the alternative. The design changed to totals kept up to date as changes come
in.

Agents running in parallel collide. One agent's cleanup dropped another's test databases. Two picked the same
port. A pull request went out with another agent's description, because both wrote it to the same scratch
file. Each incident became a one-line rule with a date, and the rules file now reads like an incident log.
What made parallel work reliable was giving each agent its own files, and letting only the orchestrator touch
shared ones.

The independent reviews earned their keep. One caught a regular expression in the editor that could be used
for a denial-of-service attack. Another blocked a pull request where the builder had removed a ten-minute
safety delay during a cleanup.

## Where judgement still mattered

Agents tend to design for every failure mode, and my job was often to ask what a failure actually costs. When
a design added automatic detection of a database restore, I asked to remove it: a restore already means
downtime, so we can flush the cache and let it fill again. A fallback for a Redis outage became an ordinary
error. A planned lifecycle library was dropped because the framework already did the job. A separate
microservice for a small use case did not get built.

I did not always side with the smaller answer, though. The AI review that made the five-to-seven-month estimate
also recommended capping the shared library at six packages. I overruled the cap and judged each package on
its merits. The review was right that complexity is the enemy and wrong that a quota is the cure.

Product calls stayed with me too. Vela's first version deliberately leaves out 18 capabilities. Documents and
wikis are out, because Vela links to knowledge rather than hosting it. Agents as teammates are out: no
assigning work to an agent and no agent mentions; agents work through MCP with approvals instead.

Knowing when to delegate was part of the job as well. On plenty of questions my answer was simply "use your
recommendation".

## Where this goes next

Vela is in acceptance and polish. The real test is still ahead: whether a team would choose a tool built this
way over the SaaS it replaces, and whether running it stays cheap after the first months.

I will write about that as it happens, including the parts that do not work.
