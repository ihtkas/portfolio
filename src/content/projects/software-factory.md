---
title: Software factory
section: Now
kind: oss
period: 2026 to present
summary: A set of parts that lets a startup or a scale-up build, own and self-host production software that fits how it works, instead of renting a SaaS product built for every customer at once. Built by one person working with AI agents.
stack: [Go, TypeScript, React, Postgres, Kubernetes, Helm]
order: 1
links:
  writeup: /writing/building-the-software-factory/
---

A set of parts that lets a startup or a scale-up build, own and self-host production software that fits how
it works, instead of renting a SaaS product built for every customer at once.

It has four pieces. go-libs holds the backend packages in Go: config, Postgres access and migrations,
sessions, jobs, outbox and consumers, telemetry, rate limiting and more. ui-libs holds the frontend packages
and a design system. The golden path holds the plans and the architectural rulings. A reference application
is where every package runs for the first time, from local sign-in through to a Helm chart on Kubernetes.

The packages are meant for AI agents to build on, but a person writing the same application by hand should
find them just as natural. If a design only makes sense to a code generator, it is the wrong design.

Built by one person working with AI agents: agents write and review the code, and I make the design and
product calls.

Where it stands: every package the first product, Vela, needs is built, along with a reference app that runs
them end to end, from tests and browser checks through to a Kubernetes deployment. The libraries are not
released yet.
