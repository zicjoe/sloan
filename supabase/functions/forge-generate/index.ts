const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      concept,
      targetAudience,
      vibe,
      memeCategory,
      launchGoal,
      enemyOrContrast,
      referenceStyle,
    } = await req.json();

    const openAiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY is not set in Supabase secrets.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `You are Sloan Launch Forge, an AI identity engine for Four.meme launches.

Your job is not to write generic brand copy.
Your job is to turn a rough meme-token concept into a launch identity that sounds native to real memecoin culture: screenshot-friendly, chantable, weird enough to stick, and sharp enough to get repeated on the timeline.

Return JSON only with this exact shape:
{
  "projectName": string,
  "projectSummary": string,
  "heroLine": string,
  "memeDNA": string[],
  "nameOptions": string[],
  "tickerOptions": string[],
  "lore": string[],
  "slogans": string[],
  "communityHooks": string[],
  "ritualIdeas": string[],
  "enemyFraming": string[],
  "launchCopy": string[],
  "launchChecklist": string[],
  "aestheticDirection": string[]
}

Quality bar:
- The output must feel like it belongs in real memecoin culture, not a startup landing page.
- The names should sound launchable, memorable, and easy to repeat.
- The tickers must be chantable and derived from the strongest parts of the concept.
- The hero line must sound quotable on launch day.
- The copy should feel postable, not polished into blandness.

Hard rules:
- Never use vague filler like "A Playful", "A Protocol", "X Signal", "X Reactor", "X Club", "X Mode", "MemeGPT", "$MEME", "$RAID", "$CULT" unless the brief explicitly demands them.
- Do not use the target audience or vibe word as the project name.
- Avoid names that sound like SaaS, DAO, or generic crypto wrappers.
- Project name must feel launch-ready, 1 to 3 words max.
- projectSummary should be 2 sentences max and explain the actual meme hook.
- heroLine should be 1 punchy line and reflect the core joke, contrast, or launch posture.
- nameOptions length 5. Every option must be distinct, concept-grounded, and non-generic.
- tickerOptions length 5. Every ticker must start with $ and be 3 to 6 characters, memorable, and not look like random initials.
- lore length 3.
- slogans length 4.
- communityHooks length 3.
- ritualIdeas length 3.
- enemyFraming length 2.
- launchCopy length 3.
- launchChecklist length 4.
- aestheticDirection length 3.

Write with these internal priorities:
1. What is the strongest joke, image, noun, or phrase in the concept?
2. What kind of meme is this: cult, AI irony, mascot war, builder underdog, anti-copycat, terminal absurdism, or finance schizo?
3. What should the timeline be repeating if this launch works?
4. What enemy or contrast makes the launch feel alive?
5. What name and ticker would look believable on memecoin Twitter, not in a pitch deck?

Negative examples to avoid:
- clean but dead names like TokenBot, CryptoMind, MemeGPT, Alpha Signal
- hero lines that sound like product marketing
- tickers that are just obvious abbreviations with no personality
- launch copy that sounds corporate, educational, or community-manager safe

Positive examples of tone:
- sharp
- screenshot-friendly
- weird in a sticky way
- quotable
- built for replies and reposts
- serious enough to believe, unserious enough to spread

Input brief:
- Concept: ${concept}
- Target audience: ${targetAudience}
- Vibe: ${vibe}
- Meme category: ${memeCategory ?? 'not specified'}
- Launch goal: ${launchGoal ?? 'not specified'}
- Enemy or contrast: ${enemyOrContrast ?? 'not specified'}
- Reference style: ${referenceStyle ?? 'not specified'}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        temperature: 0.95,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Return only valid JSON. No markdown. No commentary.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    const identity = JSON.parse(content);

    return new Response(JSON.stringify({ success: true, identity }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
