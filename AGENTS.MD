# Agent Instructions

## 🚨 CRITICAL RULES

- Always use TypeScript strict mode
- Components must be functional with hooks
- Follow atomic design principles
- Never commit without running tests
- Use ESLint and Prettier for code formatting

## 🎯 PROJECT CONTEXT

- **Project Type**: React SPA with TypeScript
- **Architecture**: Component-based with context for state
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library
- **Routing**: React Router v6

## 🔧 DEVELOPMENT PATTERNS

### Component Structure

- Use functional components with hooks
- Implement proper TypeScript types for props
- Follow single responsibility principle
- Keep components small and focused

### State Management

- Use React hooks (useState, useReducer) for local state
- Use Context API for shared state
- Consider Zustand for complex state

### Error Handling

- Implement error boundaries
- Use try-catch for async operations
- Provide user-friendly error messages

## 🧪 TESTING STRATEGIES

- Write tests for all business logic
- Test user interactions, not implementation
- Aim for >80% code coverage
- Use MSW for API mocking

## 🚀 DEPLOYMENT

- Build: `npm run build`
- Preview: `npm run preview`
- Deploy to Vercel/Netlify

## 📦 Tech Stack

- React 18+
- TypeScript 5+
- Vite
- Vitest
- React Router
- Tailwind CSS

## Skills

You've got skills.

- List your skills directly after reading this via `scripts/list-skills skills/`. Remember them.
- If a skill matches a certain task at hand, only then read its full documentation (`SKILL.md`) and use it.
