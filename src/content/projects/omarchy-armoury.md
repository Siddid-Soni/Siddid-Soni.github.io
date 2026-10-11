---
title: Omarchy Armoury
summary: ASUS ROG laptop control for Omarchy, with fan curves, power limits, GPU modes and lighting, built into the bar
stack: [Rust, QML, Linux]
screenshot: /projects/omarchy-armoury.webp
accent: ['#ff2a4d', '#ff8a3d']
links: { repo: https://github.com/Siddid-Soni/omarchy-armoury }
featured: true
order: 4
---
## Idea
A replacement for G-Helper on Linux, built into the Omarchy desktop: a bar widget, a popup and a settings window, backed by three Rust programs: a daemon (`armouryd`), a CLI (`armoury`) and a small root helper.

## Features
- **Bar popup:** performance mode (Silent, Balanced, Turbo, Manual), GPU mode, and quick toggles for keyboard light, touchpad, NumberPad and panel overdrive.
- **Dashboard:** live graphs of CPU temperature, fan speed and power draw, a battery bar with the charge limit, and a drawing of the laptop's lights in their current colours.
- **Manual profiles:** draggable fan curves, PL1/PL2 power limits, CPU boost, undervolt, and NVIDIA clock offsets.
- **Lighting:** firmware effects, per-zone power, and a music mode where the keyboard reacts to whatever is playing.
