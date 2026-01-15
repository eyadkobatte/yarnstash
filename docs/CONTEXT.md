# Coding Conventions & Best Practices

## Technology Stack

- **Framework:** Next.js (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4, CSS Variables, PostCSS
- **Components:** Shadcn UI (Radix Primitives + Tailwind)
- **Icons:** Lucide React
- **Backend:** Supabase (PostgreSQL)
- **Validation:** Zod, React Hook Form

## File Structure & Naming

### File Naming

- **Kebab-case:** All files must use kebab-case.
  - Correct: `project-card.tsx`, `manage-project-yarns-dialog.tsx`, `utils.ts`
  - Incorrect: `ProjectCard.tsx`, `manageProjectYarns.tsx`
- **Extensions:**
  - Components/Pages: `.tsx`
  - Utils/Hooks/Types: `.ts`

### Directory Structure

- **`app/`:** Contains all routes and pages. Use `page.tsx` for route UI and `layout.tsx` for wrappers.
- **`components/`:**
  - **`components/ui/`:** strictly for Shadcn UI primitives (e.g., `button.tsx`, `dialog.tsx`).
  - Feature components (e.g., `yarn-card.tsx`) reside in the root of `components/` or categorized subdirectories if they grow numerous.
- **`lib/`:** Shared utilities, types, and library configurations (e.g., Supabase clients).
  - `lib/types.ts`: Centralized shared types.
  - `lib/utils.ts`: Helper functions (e.g., `cn`).

## Component Authoring

### Syntax

- Use **Named Exports** for components.
- Define a Props interface for every component with props, named `ComponentNameProps`.

```tsx
interface YarnCardProps {
  yarn: Yarn;
}

export function YarnCard({ yarn }: YarnCardProps) {
  // ...
}
```

### Server vs. Client Components

- **Server Components (Default):** Use for fetching data and rendering static content.
- **Client Components:** Add `"use client"` at the very top of the file _only_ when:
  - Using React Hooks (`useState`, `useEffect`, `useForm`, etc.).
  - Adding event listeners (`onClick`, `onChange`).
  - Using browser-only APIs.

## Styling Patterns

### Tailwind & Shadcn

- **Utility First:** Use Tailwind utility classes for all styling.
- **`cn()` Utility:** Always use the `cn()` helper from `@/lib/utils` when merging classes or handling conditional classes.
- **Theming:** Use CSS variables (e.g., `bg-background`, `text-muted-foreground`) to support specific theme modes (Light/Dark). Avoid hardcoding hex values unless strictly required by design.

```tsx
// Correct
<div className={cn("flex flex-col", className)}>
  <span className="text-muted-foreground">Label</span>
</div>

// Incorrect
<div className={`flex flex-col ${className}`}>
  <span className="text-gray-500">Label</span>
</div>
```

## Data Fetching & State

### Server-Side Fetching

- Fetch data directly in Server Components using `@/lib/supabase/server`.
- Make the component `async` and `await` the data fetch.

```tsx
// app/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from('yarns').select('*');

  return <YarnList yarns={data} />;
}
```

### Client-Side Mutations

- Use `@/lib/supabase/client` for interactions (insert, update, delete).
- After a mutation, use `router.refresh()` (from `next/navigation`) to invalidate the Server Component cache and update the UI.
- Handle loading states (`useState`) manually during async operations.

```tsx
// component.tsx
'use client';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    const supabase = createClient();
    await supabase.from('table').delete().eq('id', id);
    router.refresh();
  };

  return <Button onClick={handleDelete}>Delete</Button>;
}
```

## Forms

- Use **React Hook Form** combined with **Zod** for schema validation.
- Define the Zod schema outside the component or in a separate file.
- Use Shadcn's `<Form>` components for consistent layout and error handling.

## Imports

- Use **Absolute Imports** with the `@/` alias for all internal files.
- **Order:**
  1. External libraries (React, Next.js, etc.)
  2. UI Components (`@/components/ui/...`)
  3. Feature Components (`@/components/...`)
  4. Utilities & Types (`@/lib/...`)

```tsx
import { useState } from 'react'; // External
import { Button } from '@/components/ui/button'; // UI
import { YarnCard } from '@/components/yarn-card'; // Feature
import type { Yarn } from '@/lib/types'; // Internal Utils
```
