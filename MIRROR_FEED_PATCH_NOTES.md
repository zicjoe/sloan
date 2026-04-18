Mirror Feed patch

What changed
- Upgraded Mirror Feed from a simple missed-opportunity list into a workable demo surface.
- Added live-derived counterfactual entries from Sloan tokens and user predictions when the backend feed is empty or too thin.
- Added richer UI sections:
  - overview stats
  - missed setups cards
  - behavior map
  - personal edge watchlist
  - recovery plan
  - mirror verdict
- Kept the existing route and backend compatibility.

Notes
- No SQL migration required.
- No Supabase function redeploy required.
- This patch is frontend/runtime logic only.
