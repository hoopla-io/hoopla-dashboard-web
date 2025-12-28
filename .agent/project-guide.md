# E-Markaz Project Guide for AI Agent

## Project Overview

**E-Markaz** is a modern education management system built with:
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Package Manager**: npm
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn UI (Radix UI primitives)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Validation**: Zod
- **Forms**: React Hook Form
- **Internationalization**: next-intl
- **Routing**: Next.js App Router (file-based)

## Project Structure

```
e-markaz/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── [locale]/             # Locale-based routes
│   │   │   ├── layout.tsx        # Root layout with providers
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── students/         # Students management
│   │   │   ├── branches/         # Branches management
│   │   │   ├── courses/          # Courses management
│   │   │   ├── settings/         # Settings page
│   │   │   └── login/            # Login page
│   │   
│   ├── components/
│   │   ├── ui/                   # Shadcn UI components
│   │   ├── layout/               # Layout components (Sidebar, Header, etc.)
│   │   ├── func/                 # Functional components (ThemeProvider, etc.)
│   │   ├── providers/            # Context providers
│   │   ├── shadcn-studio/        # Custom Shadcn components
│   │   └── examples/             # Example/demo components
│   │
│   ├── lib/
│   │   ├── api/                  # API client (NEW STRUCTURE)
│   │   │   ├── http-client.ts    # Axios instance
│   │   │   ├── index.ts          # Main exports
│   │   │   ├── interceptors/     # Request/response interceptors
│   │   │   │   └── auth.interceptor.ts
│   │   │   ├── domains/          # API functions by domain
│   │   │   │   ├── auth.ts
│   │   │   │   ├── branches.ts
│   │   │   │   ├── courses.ts
│   │   │   │   ├── groups.ts
│   │   │   │   └── rooms.ts
│   │   │   ├── schemas/          # Zod validation schemas
│   │   │   │   ├── auth.ts
│   │   │   │   ├── branches.ts
│   │   │   │   ├── courses.ts
│   │   │   │   ├── groups.ts
│   │   │   │   └── rooms.ts
│   │   │   └── hooks/            # TanStack Query hooks
│   │   │       ├── useBranches.ts
│   │   │       ├── useCourses.ts
│   │   │       ├── useGroups.ts
│   │   │       └── useRooms.ts
│   │   │
│   │   └── utils.ts              # Utility functions (cn, etc.)
│   │
│   ├── stores/                   # Zustand stores
│   │   ├── auth-store.ts         # Authentication state
│   │   └── notification-store.ts # Notifications state
│   │
│   ├── hooks/                    # Custom React hooks
│   │   └── use-auth.tsx          # Auth hook with context
│   │
│   └── styles.css                # Global styles
│
├── docs/                         # Documentation (if exists)
├── .agent/                       # Agent configuration
│   └── project-guide.md          # This file
└── package.json
```

## Coding Standards

### 1. Import Conventions

**ALWAYS use path aliases (`@/`) instead of relative imports:**

✅ **CORRECT:**
```typescript
import { httpClient } from "@/lib/api/http-client";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import type { Branch } from "@/lib/api/schemas/branches";
```

❌ **INCORRECT:**
```typescript
import { httpClient } from "../http-client";
import { Button } from "../../components/ui/button";
import { useAuthStore } from "../../../stores/auth-store";
```

### 2. File Naming

- **Components**: PascalCase with `.tsx` extension
  - `AppSidebar.tsx`, `NotificationsDropdown.tsx`
- **Hooks**: camelCase starting with `use`, `.ts` or `.tsx`
  - `useAuth.tsx`, `useBranches.ts`
- **Utilities**: kebab-case with `.ts` extension
  - `http-client.ts`, `auth.interceptor.ts`
- **Stores**: kebab-case ending with `-store.ts`
  - `auth-store.ts`, `notification-store.ts`
- **Types/Schemas**: Match the domain name
  - `auth.ts`, `branches.ts`

### 3. TypeScript Standards

- **Always use TypeScript** - no plain JavaScript
- **Prefer `type` over `interface`** for object types
- **Use Zod schemas** for runtime validation
- **Infer types from Zod schemas:**
  ```typescript
  export const BranchSchema = z.object({
    id: z.string(),
    name: z.string(),
  });
  
  export type Branch = z.infer<typeof BranchSchema>;
  ```

### 4. Component Structure

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBranches } from "@/lib/api";

// Props type
type MyComponentProps = {
  title: string;
  onClose?: () => void;
};

// Component
export function MyComponent({ title, onClose }: MyComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: branches } = useBranches();
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### 5. Feature Component Architecture

**Use a Feature-based Component Architecture:**

- **Location**: `src/components/features/[feature-name]/`
- **Structure**:
  - `[feature]-list.tsx`: Main list/table component
  - `[feature]-form.tsx`: Create/Edit form component
  - `index.ts`: Barrel export for the feature
- **Exports**: Always export components from `index.ts` using absolute paths:
  ```typescript
  export { CoursesList } from "@/components/features/courses/courses-list";
  ```
- **Usage**: Import from the feature barrel:
  ```typescript
  import { CoursesList } from "@/components/features/courses";
  ```


### 6. API Client Patterns

#### Creating a New Domain API

1. **Create Schema** (`src/lib/api/schemas/domain.ts`):
```typescript
import { z } from "zod";

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const UpdateItemSchema = CreateItemSchema.partial();

export type Item = z.infer<typeof ItemSchema>;
export type CreateItemRequest = z.infer<typeof CreateItemSchema>;
export type UpdateItemRequest = z.infer<typeof UpdateItemSchema>;
```

2. **Create Domain API** (`src/lib/api/domains/domain.ts`):
```typescript
import { httpClient } from "@/lib/api/http-client";
import type { Item, CreateItemRequest, UpdateItemRequest } from "@/lib/api/schemas/domain";

export const itemsApi = {
  getAll: async (): Promise<Item[]> => {
    const response = await httpClient.get<Item[]>("/items");
    return response.data;
  },
  
  getById: async (id: string): Promise<Item> => {
    const response = await httpClient.get<Item>(`/items/${id}`);
    return response.data;
  },
  
  create: async (data: CreateItemRequest): Promise<Item> => {
    const response = await httpClient.post<Item>("/items", data);
    return response.data;
  },
  
  update: async (id: string, data: UpdateItemRequest): Promise<Item> => {
    const response = await httpClient.patch<Item>(`/items/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/items/${id}`);
  },
};
```

3. **Create TanStack Query Hooks** (`src/lib/api/hooks/useItems.ts`):
```typescript
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { itemsApi } from "@/lib/api/domains/items";
import type { Item, CreateItemRequest, UpdateItemRequest } from "@/lib/api/schemas/items";

export const itemKeys = {
  all: ["items"] as const,
  lists: () => [...itemKeys.all, "list"] as const,
  list: () => [...itemKeys.lists()] as const,
  details: () => [...itemKeys.all, "detail"] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
};

export function useItems(): UseQueryResult<Item[], Error> {
  return useQuery({
    queryKey: itemKeys.list(),
    queryFn: itemsApi.getAll,
  });
}

export function useCreateItem(): UseMutationResult<Item, Error, CreateItemRequest> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: itemsApi.create,
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: itemKeys.list() });
      const previousItems = queryClient.getQueryData<Item[]>(itemKeys.list());
      
      if (previousItems) {
        const optimisticItem: Item = {
          id: `temp-${Date.now()}`,
          ...newItem,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        queryClient.setQueryData<Item[]>(itemKeys.list(), [
          ...previousItems,
          optimisticItem,
        ]);
      }
      
      return { previousItems };
    },
    onError: (_err, _newItem, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(itemKeys.list(), context.previousItems);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.list() });
    },
  });
}

// Similar patterns for useUpdateItem and useDeleteItem
```

4. **Export from index** (`src/lib/api/index.ts`):
```typescript
// Add to existing exports
export { itemsApi } from "@/lib/api/domains/items";
export type { Item, CreateItemRequest, UpdateItemRequest } from "@/lib/api/schemas/items";
export { useItems, useCreateItem, useUpdateItem, useDeleteItem, itemKeys } from "@/lib/api/hooks/useItems";
```

### 7. State Management with Zustand

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

type MyStore = {
  count: number;
  increment: () => void;
  decrement: () => void;
};

export const useMyStore = create<MyStore>()(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
    }),
    {
      name: "my-store", // localStorage key
    }
  )
);
```

### 8. Styling Conventions

- **Use Tailwind CSS** for all styling
- **Use `cn()` utility** for conditional classes:
  ```typescript
  import { cn } from "@/lib/utils";
  
  <div className={cn(
    "base-classes",
    isActive && "active-classes",
    variant === "primary" && "primary-classes"
  )} />
  ```
- **Follow Shadcn UI patterns** for component variants

### 9. Form Handling

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateBranchSchema, type CreateBranchRequest } from "@/lib/api";
import { useCreateBranch } from "@/lib/api";

export function BranchForm() {
  const form = useForm<CreateBranchRequest>({
    resolver: zodResolver(CreateBranchSchema),
    defaultValues: {
      name: "",
    },
  });
  
  const createMutation = useCreateBranch();
  
  const onSubmit = (data: CreateBranchRequest) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        form.reset();
      },
    });
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

## API Configuration

### Base URL
```typescript
export const API_BASE_URL = "https://dev-api.e-markaz.uz/api/v1";
```

### Authentication
- **Access Token**: Stored in `localStorage` as `accessToken`
- **Refresh Token**: Stored in `localStorage` as `refreshToken`
- **Auto-refresh**: Handled by `auth.interceptor.ts`
- **Redirect on failure**: `/login`

### Available Endpoints

#### Auth
- `POST /login` - Login
- `POST /refresh` - Refresh token
- `POST /logout` - Logout

#### Branches
- `GET /branches` - List all
- `POST /branches` - Create
- `GET /branches/{id}` - Get one
- `PATCH /branches/{id}` - Update
- `DELETE /branches/{id}` - Delete

#### Courses
- `GET /courses` - List all
- `POST /courses` - Create
- `GET /courses/{id}` - Get one
- `PATCH /courses/{id}` - Update
- `DELETE /courses/{id}` - Delete

#### Groups
- `GET /groups` - List all
- `POST /groups` - Create
- `GET /groups/{id}` - Get one
- `PATCH /groups/{id}` - Update
- `DELETE /groups/{id}` - Delete

#### Rooms
- `GET /rooms` - List all
- `POST /rooms` - Create
- `GET /rooms/{id}` - Get one
- `PATCH /rooms/{id}` - Update
- `DELETE /rooms/{id}` - Delete

## Common Patterns

### Loading States
```typescript
const { data, isLoading, error } = useBranches();

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return null;

return <BranchesList branches={data} />;
```

### Mutation with Toast
```typescript
import { toast } from "sonner";

const mutation = useCreateBranch();

mutation.mutate(data, {
  onSuccess: () => {
    toast.success("Branch created successfully!");
  },
  onError: (error) => {
    toast.error(`Failed to create branch: ${error.message}`);
  },
});
```

### Optimistic Updates
All mutation hooks already include optimistic updates. The UI updates instantly and rolls back on error.

## Best Practices

1. **Always use path aliases** (`@/`) for imports
2. **Use Zod schemas** for all data validation
3. **Leverage TanStack Query** for data fetching and caching
4. **Follow Shadcn UI patterns** for component structure
5. **Use TypeScript strictly** - avoid `any` types
6. **Implement error boundaries** for better UX
7. **Use Zustand** for global state (auth, notifications, etc.)
8. **Keep components small** and focused
9. **Extract reusable logic** into custom hooks
10. **Document complex logic** with comments

## File Templates

### New Page Component
```typescript
import { useIntlayer } from "react-intlayer";

export default function MyPage() {
  const { title } = useIntlayer("my-page");
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      {/* Page content */}
    </div>
  );
}
```

### New UI Component
```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

type MyComponentProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "primary";
};

export function MyComponent({ 
  className, 
  variant = "default",
  ...props 
}: MyComponentProps) {
  return (
    <div
      className={cn(
        "base-styles",
        variant === "primary" && "primary-styles",
        className
      )}
      {...props}
    />
  );
}
```

## Testing Checklist

When creating new features:
- [ ] TypeScript compiles without errors
- [ ] All imports use path aliases (`@/`)
- [ ] Zod schemas are defined for data structures
- [ ] TanStack Query hooks include optimistic updates
- [ ] Loading and error states are handled
- [ ] Forms use React Hook Form + Zod
- [ ] Components are responsive (mobile-first)
- [ ] Internationalization is implemented (if needed)
- [ ] Code follows existing patterns

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint
npm run lint

# Format
npm run format
```

## Notes for AI Agent

- **Always check this file** before generating code
- **Follow the established patterns** in existing files
- **Use path aliases** consistently
- **Maintain the API client structure** when adding new domains
- **Keep optimistic updates** in all mutations
- **Document breaking changes** or new patterns
- **Ask for clarification** if requirements are unclear

## ⚠️ CRITICAL RULES

### Linting Requirement
**ALWAYS run the linter before and after completing any task.**

Commands:
```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

**Workflow:**
1. ✅ Run `npm run lint` before starting work to see current state
2. ✅ Write/modify code following project standards
3. ✅ Run `npm run lint:fix` to auto-fix formatting issues
4. ✅ Run `npm run lint` again to verify all issues are resolved
5. ✅ Fix any remaining issues manually if needed

**Never complete a task with linting errors in TypeScript/JavaScript files.**

**Note:** CSS linting errors related to Tailwind directives (`@apply`, `@theme`, `@custom-variant`, etc.) can be ignored as Biome doesn't support Tailwind CSS syntax. These are expected and don't affect functionality. Warnings for accessibility (`useValidAnchor`) in footer/placeholder components are also acceptable.

### Documentation Files
**DO NOT create markdown documentation files (`.md`) unless explicitly requested by the user.**

This includes:
- ❌ Task summaries
- ❌ Implementation summaries
- ❌ API documentation
- ❌ Quick reference guides
- ❌ Architecture diagrams
- ❌ Any other `.md` files in `docs/` or elsewhere

**Exception:** Only create `.md` files when the user specifically asks for documentation.

