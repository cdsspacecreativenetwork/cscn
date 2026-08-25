---
name: shadcn-ui
description: Instructions, rules, and CLI workflows for managing shadcn/ui components on-demand in Next.js.
---

# shadcn/ui Skill Guide

This skill provides guidelines and CLI commands for adding and customizing `shadcn/ui` components in this Next.js project.

## Core Philosophy: On-Demand Components Only

> [!IMPORTANT]
> **Do NOT install all shadcn components at once.**
> Adding components on-demand as features require them keeps the codebase clean, minimizes bundle size, speeds up TypeScript compilation, and avoids unused dependency bloat.

---

## 1. Initialization

To initialize `shadcn/ui` in a Next.js project:

```bash
npx shadcn@latest init
```

This creates `components.json` with project paths:
* **Style**: `default` / `new-york`
* **CSS Location**: `app/globals.css`
* **Components Directory**: `@/components/ui`
* **Utils Directory**: `@/lib/utils`

---

## 2. Adding Components On-Demand

Add components individually only when a feature specifically requires them:

```bash
# Examples:
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add toast
```

---

## 3. Best Practices

1. **Customization over Wrapper Overhead**: Custom styles should be applied directly to the component or via `className` prop using `cn(...)` from `@/lib/utils`.
2. **Accessible Base Primitives**: Rely on Radix UI primitives underlying shadcn for keyboard navigation and ARIA roles.
3. **Keep UI Directory Clean**: Store base shadcn components in `@/components/ui/` and complex feature-specific domain components in `@/components/dashboard/` or `@/components/marketing/`.
