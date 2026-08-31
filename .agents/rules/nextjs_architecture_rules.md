---
trigger: always_on
---

# Next.js & Full-Stack Architecture Rules

## 2. Componentization & Modularity
- Split large pages into focused, single-responsibility reusable components stored in structured directories (e.g., `components/marketing/teach/TeachReasonsSection.tsx`).
- Never build large monolithic pages in a single file when logic/UI can be componentized.

## 3. Server Components & SSR Optimization
- Default to Next.js Server Components for static layouts, landing sections, and data-fetching containers to eliminate client-side JavaScript overhead and maximize SEO.
- Use `'use client'` ONLY at the leaf component level when interactive state (`useState`, `useEffect`, `useSession`, handlers) is required.

## 4. Server-Side Guard & Data Fetching Patterns
- Handle server-side redirects, auth checks, and Prisma database queries inside Server Component `page.tsx` files before rendering Client Component UI.

## 5. UI & Design System Consistency
- **NO SPARKLES ICONS**: Never use `Sparkles` anywhere in user interfaces.
- **No Synthetic / Generic Designs**: Base designs on Linear, Stripe, Vercel, ADPList, and Udemy design systems.
