# VibeCheck

VibeCheck is a private, AI-assisted journaling workspace for turning unstructured thoughts into useful reflection. Write or speak freely, choose a reflection mode, and keep your entries organized in one calm place.

## Features

- Guided reflection, brainstorming, conversation, and summary modes
- AI-generated reflections and entry summaries through the Gemini API
- Journal entries with titles, tags, timestamps, and editable content
- Google sign-in with Firebase Authentication
- Per-user journal and conversation storage in Cloud Firestore
- Browser speech recognition for hands-free journaling
- Reusable reflection templates and prompts

## Tech Stack

- React and TypeScript
- Vite
- Firebase Authentication and Cloud Firestore
- Gemini API
- Tailwind CSS

## Project Structure

```text
src/
  components/       UI for journaling and navigation
  context/          Authentication state
  data/             Reflection templates
  hooks/            Browser integrations such as speech recognition
  services/         Gemini and Firestore access
  firebase.ts       Firebase client setup and error handling
  types.ts          Shared domain types
```

## Configuration

Create a local environment file with the Gemini API key used by the server-side API routes:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Firebase also needs a project configuration with Authentication and Cloud Firestore enabled. Keep credentials and local environment files out of version control.

## Local Development

The repository currently contains the application source and Vite/TypeScript configuration. Restore the project package manifest and API server entry point before running the development server, then install dependencies and start Vite:

```bash
npm install
npm run dev
```

The Gemini service expects these API routes:

- `POST /api/gemini/reflect`
- `POST /api/gemini/summarize`

## Data Model

Journal entries are stored in the `entries` collection. Conversation messages are stored below each entry at `entries/{entryId}/messages`. Firestore rules should restrict both collections to the authenticated owner of each document.

## Security Notes

- Never commit API keys or Firebase service-account credentials.
- Use Firebase Authentication before reading or writing journal data.
- Validate ownership in Firestore rules as well as in the client.
- Treat journal content as private user data when logging or debugging.
