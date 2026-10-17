# ReachInbox Frontend (React + Vite + Tailwind)

```bash
cp .env.example .env     # set VITE_GOOGLE_CLIENT_ID and VITE_API_URL
npm install
npm run dev              # http://localhost:3000
```

Google Cloud Console -> OAuth client (Web): add `http://localhost:3000` under *Authorized JavaScript origins*.
Use the same client ID in the backend `.env` (`GOOGLE_CLIENT_ID`).

## Structure
- `src/api.js` - fetch wrapper, token handling, response normalisation
- `src/context/AuthContext.jsx` - Google login, session restore, logout
- `src/pages/` - Login, Inbox (sidebar + list), EmailDetail, Compose (matches the Figma screens)
- `src/components/` - Sidebar, EmailRow, RichEditor, RecipientsInput, SendLater, SlackButton, Toast, Logo
- `src/utils/format.js` - email extraction from CSV/text, date helpers
