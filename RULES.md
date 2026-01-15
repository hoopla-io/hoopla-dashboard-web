# Project Rules

These rules must be followed for every change in this project.

1. **No "any" type**
   - Strictly avoid using `any`.
   - If a type cannot be defined, use `// @ts-ignore` as a last resort, but never `any`.

2. **No Comments**
   - Do not write comments in the code.
   - Remove all existing comments (including TODOs, explained code, etc.).

3. **No Unused Code**
   - Ensure there are no unused variables.
   - Ensure there are no unused imports.

4. **Modular Architecture**
   - Avoid monolithic page files.
   - Separate features, tabs, and business logic into dedicated component files and hooks.
   - Keep page files lightweight, acting mainly as layout/routing containers.
