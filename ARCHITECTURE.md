# Architecture Documentation

## Overview

Substantifique is a React-based single-page application (SPA) that currently uses PocketBase as its backend-as-a-service (BaaS). The application is designed with a decoupled architecture to facilitate a future migration to other backend providers (e.g., Supabase) with minimal friction.

## Data Layer Architecture

The core architectural decision is the isolation of all database interactions into a dedicated API layer. **UI components never communicate directly with the database SDK.**

### Directory Structure

```
src/
  lib/
    api/
      client.js      # Single point of entry for the database client
      timelines.js   # Timeline-related data operations
      learning.js    # Learning-related data operations (flashcards, reviews)
    pocketbase.js    # PocketBase client initialization (implementation detail)
```

### Key Modules

#### 1. `src/lib/api/client.js`
This module exports a `getDataClient()` function. Currently, it returns the PocketBase instance. In the future, this function can be updated to return a Supabase client or any other adapter, serving as the primary "switch" for the backend.

#### 2. `src/lib/api/timelines.js`
Contains domain-specific functions for managing timelines.
- `listTimelinesByUser(userId)`
- `findTimelineByTitle(userId, title)`
- `createTimeline(data)`
- `updateTimeline(id, data)`
- `deleteTimeline(id)`
- `getPublicTimeline(slug)`

#### 3. `src/lib/api/learning.js`
Contains domain-specific functions for the learning assistant.
- `getDueFlashcards(userId)`
- `createFlashcardReview(data)`
- `checkLearningCache(topic, mode)`
- `saveLearningCache(topic, mode, content)`

## Migration Strategy (PocketBase → Supabase)

The application is "migration-ready". To switch to Supabase:

1.  **Replace Client**: Update `src/lib/api/client.js` to initialize and return a Supabase client.
2.  **Rewrite API Modules**: Rewrite the functions in `timelines.js` and `learning.js` to use the Supabase JS SDK instead of PocketBase.
    *   *Example*: Change `client.collection('timelines').getList(...)` to `client.from('timelines').select(...)`.
3.  **Update Auth**: Refactor the authentication hook (`useAuth`) to use Supabase Auth.

**No changes will be required in the UI components (`Dashboard.jsx`, `LearningAssistant.jsx`, etc.), as they consume the abstract API functions.**
