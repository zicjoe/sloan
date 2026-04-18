Raid Studio patch v1

What changed
- richer raid brief inputs: audience, contrast, call to action
- raid generation now receives live token context from Sloan
- stronger output shape: mission brief, content variants, reply lines, quote replies, raid angles, do-not-say guardrails, call to action
- fallback generation is now concept-grounded instead of generic
- repair layer keeps weak AI output from showing up as bland copy
- Raid Studio UI now shows copy buttons, mission brief, quote replies, raid angles, and guardrails

Important
- redeploy the Supabase function after replacing files:
  supabase functions deploy raid-generate
