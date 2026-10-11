---
title: High-Throughput Ticketing
summary: Flash-sale ticketing engine in Rust for 50,000 concurrent buyers, with ~35,000 req/s and zero oversold seats on one machine
stack: [Rust, Actix-Web, Redis, Kafka, PostgreSQL]
screenshot: /projects/high-throughput-ticketing.webp
accent: ['#ff6a3d', '#ffb347']
links: { repo: https://github.com/Siddid-Soni/high-throughput-ticketing }
featured: true
order: 2
---
## Problem
When a popular event goes on sale, tens of thousands of buyers arrive at once. The service has to stay fast, let people in fairly, and never sell the same seat twice.

## How a sale works
1. **Join.** Buyers join the event's waiting room, a single-partition Kafka topic per event. Before the sale opens they wait in a lobby that is shuffled at opening; after that it's first come, first served.
2. **Admission.** A worker lets the next buyer in whenever fewer than `min(MAX_ACTIVE_TOKENS, free seats)` are shopping.
3. **Reserve.** A reservation holds seats in Redis, all or none, with an atomic Lua script. It never touches PostgreSQL, because this is the busiest step.
4. **Pay.** The payment provider reports to an inbox table in PostgreSQL. A success claims the hold at once, so a payment that arrives in time is kept however busy the payment worker is.
5. **Expire.** A cleanup worker releases holds whose time is up.

## Result
On one machine: 50,000 concurrent buyers, about 35,000 requests per second and about 700 purchases per second, with zero oversold seats. Every worker can run several copies.

## Not built yet
Stripe. A fake payment provider stands in.
