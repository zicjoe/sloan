Prophet League patch v2

What changed
- Simplified Prophet League into AI-generated yes/no prediction cards
- Added support for question-based opportunities on live tokens
- Added new question types: volume, holders, price, momentum stay-strong
- Removed the heavy form-first flow from the page in favor of one-tap actions
- Updated prediction cards to display the actual question and the user's yes/no answer
- Kept leaderboard, open/resolved board, and local scoring flow intact

Notes
- No SQL migration needed
- No Supabase Edge Function redeploy needed
- This patch is frontend/runtime logic only
