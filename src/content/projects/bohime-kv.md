---
title: Bohime KV
summary: A sharded, Raft-replicated key-value store in Rust over gRPC, in about 830 lines
stack: [Rust, Raft, gRPC, Tokio]
screenshot: /projects/bohime-kv.webp
accent: ['#6b5cff', '#2af0ff']
links: { repo: https://github.com/Siddid-Soni/bohime-kv }
featured: true
order: 3
---
## Idea
A distributed key-value store kept as small as it can be: one node per shard replica, a single-file Bitcask, Raft with elections and log replication only, and fixed hash sharding. About 830 lines of Rust in one crate.

## How it works
- **Sharding.** Sorted node ids are cut into runs of `rf`, one shard per run. A key's shard is `fnv1a(key) % shards`, and a node that gets another shard's key redirects.
- **Replication.** Every shard is its own Raft group, so shards share nothing and scale by adding `rf` nodes. Raft itself does no I/O: it changes state and queues messages.
- **Linearizable reads.** Reads go through the log just like writes.
- **Durability.** New log entries and the vote are written as one batch and fsynced on a separate thread. Nothing is acknowledged before it is on disk.
- **Storage.** One append-only file per node: `crc32 | key_len | value_len | key | value`, with an in-memory index.

## More
A full-featured branch adds snapshots, membership changes, shard migration, wait-free reads and a deterministic simulator.
