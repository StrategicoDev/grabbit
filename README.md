# Grabbit 🛒

**AI-powered shared shopping list** — Strategico Marketplace app

**Live:** https://strategico-grabbit.netlify.app

## Features

- ⚡ **Instant list** — opens straight to your shopping list, no splash screen
- ✅ **Check items** — tap to check, moves to done section
- 🗑️ **Swipe to delete** — or tap the × button
- 📸 **Photo OCR** — take a photo of a receipt, shelf, or label → AI extracts product names
- 📷 **Barcode scan** — uses BarcodeDetector API (Chrome/Android) to scan product barcodes
- ✨ **AI suggestions** — Anthropic-powered suggestions based on your history
- 🤝 **Shared lists** — invite anyone via link, real-time sync via Supabase Realtime
- 📋 **Multiple lists** — Weekly Groceries, Braai List, Hardware Store, etc.
- 💳 **Credit system** — AI features cost 1 marketplace credit each

## Tech Stack

- React + TypeScript + Vite + Tailwind CSS
- Supabase (marketplace project: `amkdgoqttpkacktygigs`)
- Supabase Realtime for shared list sync
- Edge Functions: `shopping-ocr`, `shopping-barcode`, `shopping-suggest`
- Anthropic Claude for OCR + suggestions
- Open Food Facts API for barcode lookup
- Netlify hosting

## Auth

Uses Strategico Marketplace auth — same account as AskVinny/Arnie.

## Development

```bash
npm install
cp .env.example .env.local  # Fill in Supabase credentials
npm run dev
```

## Deploy

Pushes automatically deploy to Netlify. Supabase edge functions:

```bash
supabase functions deploy shopping-ocr --project-ref amkdgoqttpkacktygigs
supabase functions deploy shopping-barcode --project-ref amkdgoqttpkacktygigs
supabase functions deploy shopping-suggest --project-ref amkdgoqttpkacktygigs
```
