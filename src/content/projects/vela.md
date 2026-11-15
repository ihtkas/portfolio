---
title: Vela
section: Now
kind: oss
period: 2026 to present
summary: Project management for software teams, self-hosted and owned outright. A lighter alternative to Jira and Linear in the sense that matters to me; it does the parts a team uses every day and leaves out the rest.
stack: [Go, React, Tailwind, Postgres]
order: 2
links:
  writeup: /writing/building-the-software-factory/
---

Project management for software teams, self-hosted and owned outright. It is a lighter alternative to Jira
and Linear in the sense that matters to me: it does the parts a team uses every day and leaves out the rest.

Vela is the first product built on the factory, and it decides what the shared libraries need to contain.
The scope came from a survey of Jira, Notion and Linear. Of 88 capabilities, 46 are in the first version,
including custom work item types and fields, an enforced workflow, a query language, item-level permissions,
single sign-on, and access for AI agents over MCP, where anything an agent proposes waits for a person to
approve. Another 18 are left out on purpose, among them wikis, whiteboards, time tracking, an app
marketplace and a service desk.

Six backend services run bundled or split, and the web app has lists, boards, a backlog, sprints, capacity,
a timeline, a query builder, dashboards, an inbox, an audit log and SSO and SCIM administration.

Where it stands: the first version is feature-complete on the development branch and in acceptance testing
and polish. It has no production users yet.
