---
title: Software is cheap now. Knowing what to build is still hard.
date: 2026-11-15
dek: With AI coding agents, a very small team can build production software. What that means for SaaS, for how we work, and for the skill that matters most.
kind: engineering
tags: [ai, saas, product, essay]
draft: false
---

**TL;DR**

- With AI coding agents, a very small team, even one person, can build production-grade software. Writing
  code has become the cheapest part of making software.
- A lot of SaaS is one product built for every customer at once, and each customer pays for scale and
  features it never uses. When building is cheap, many companies will build a smaller version that fits them,
  and SaaS will split by segment.
- What stays expensive is deciding what to build, what to leave out, and running it well. Product thinking
  becomes the scarce skill.

## What changed for me

For most of my career, the slow part of building software was writing it. A design review took an afternoon;
the implementation took a quarter. Teams were sized for the implementation.

Over the last year that ratio flipped for me. I now spend most of my time writing down what I want, why, and
what good looks like, and AI coding agents do the typing. In my spare time I built a set of production
libraries and a self-hosted project management tool with the core of Jira and Linear this way, alone. An AI
review of the plan had estimated five to seven engineer-months of work; it took a small fraction of that.
I wrote about how in [the build story](/writing/building-the-software-factory/).

That experience changed how I think about a question most companies settle without much thought: build or buy.

## Why SaaS looks the way it does

A SaaS vendor builds one system for every customer. That is the business model, and it shapes the product.

It has to be multi-tenant, so every query carries a tenant and every feature has to work for the smallest
customer and the largest. It has to scale to all customers combined, so it carries distribution and
hyperscale costs that no single customer needs. And it has to win deals across very different companies, so
features pile up: every enterprise request becomes a setting, and every setting stays forever.

The customer pays for all of that. A twenty-person team buying a project management tool also buys the
permission model of a large bank, an integrations marketplace, and three ways to configure the same workflow.
Most of it goes unused, but it is in the price and in the interface.

This made sense when building your own was the expensive option. A company with a dozen engineers could not
justify a year on its own issue tracker.

## What changes when building is cheap

If one person with agents can build a focused tool in a fraction of the old effort, the trade looks different.
I expect a few things to happen.

Some companies will build their own narrow version of the tools they rent today: only the workflows they use,
on their own infrastructure, with their own data model. A tool that does fewer things is easier to learn and
easier to change. Self-hosting gets more attractive too. Atlassian stopped selling new Jira Data Center
licences in March 2026, and none of the popular alternatives can be self-hosted at all.

SaaS will split by segment. Products that serve everyone will face tools built for one kind of customer, and
some vendors will start selling parts and templates that customers assemble, rather than one finished product.

How we build software will change too. When agents write the code, the written spec, the decision records and
the tests become the real source of the system. Teams that write things down well will move much faster than
teams that keep the design in people's heads. Review moves from reading every line to setting boundaries,
writing the acceptance criteria, and checking the result on real infrastructure.

I hold these loosely. Owning software has costs that renting hides, which brings me to the part that does not
get cheaper.

## What does not get cheaper

Writing code got cheap. Deciding what to build did not.

When I scoped my project management tool, I compared Jira, Notion and Linear capability by capability. The
first version commits to 46 capabilities and deliberately leaves out 18, including wikis, whiteboards, time
tracking and an app marketplace. Each of those exclusions took longer to decide than most features took to
build. A line from that survey stuck with me: Linear's refusals carry as much of the product as its features.

That is the part agents do not do for you. They will build whatever you describe, and all of it. They also
tend to design for every possible failure, so someone has to ask what a failure actually costs and cut what
does not pay for itself. The skill that matters more now is knowing which part of a product a particular team
needs, and stopping there.

The other cost that does not drop is running the software. If you own it, you own the upgrades, the security
patches, the on-call and the backups. Good shared parts can make that boring, but it does not disappear, and a
company should go in knowing that.

## What this means

For engineers, the job is moving toward product thinking, design and judgement about proof, and away from
typing. For companies, "build" is worth reconsidering for tools where a focused version would fit better than
the one-size product they rent today. For SaaS vendors, the moat is less the code and more the product
decisions, the data, and how well they run it.

I am testing this on my own projects, and I will write about what holds up and what does not.
