---
title: Realtime Chat
summary: WebSockets + Redis chat for 10k daily users, p99 latency 40ms
stack: [TypeScript, Node, Redis, WebSockets]
accent: ['#ff6a88', '#ff99ac']
links: { repo: https://github.com/Siddid-Soni }
featured: true
order: 1
---
## Problem
Example case study. Replace with your own.

## Approach
Socket gateway in Node, Redis pub/sub fan-out, presence in sorted sets.

## Result
10k daily users, p99 message latency 40 ms.

## What I'd do next
Move history to Postgres with partitioning.
