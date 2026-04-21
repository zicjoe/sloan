Sloan production cleanup patch

Included fixes
- live mode now defaults on unless VITE_USE_MOCK_API=true
- removed visible current_user/demo wording across the app shell
- Passport links now route through auth when no signed-in profile exists
- removed the exposed /dashboard/classic route
- replaced static system-status copy with real profile-connected messaging
- disabled mock API/data fallbacks in production mode for tokens, prophets, profiles, raids, and counterfactuals
- removed rivalry from owner quest suggestion defaults

Packaging cleanup
- excludes node_modules
- excludes .env, build.log, and dist from the replacement zip
