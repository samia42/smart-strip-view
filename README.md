# ⚡ Smart Power Strip – Monitoring Dashboard

Web dashboard for the **Smart Power Strip**, an IoT prototype built as the capstone Project Course at **Åbo Akademi University** (presented at the ICT ShowRoom).

The power strip measures the current drawn by each connected device; this dashboard turns those measurements into usage and cost insights so users can see how much energy – and money – each device consumes.

## Features
- **Dashboard overview** – total consumption and cost at a glance
- **Device monitoring** – per-socket, real-time view of connected devices
- **Consumption history** – usage trends over time and cost calculation
- **Settings** – device names, tariffs and preferences

## System overview
`Current sensors → microcontroller → IoT communication → backend → this web dashboard`

## Tech stack
React · TypeScript · Vite · Tailwind CSS · shadcn/ui

## Run locally
```bash
npm install
npm run dev
```

## Team
Built by a student team in the Åbo Akademi Project Course, mentored by Jerker Björkqvist.
