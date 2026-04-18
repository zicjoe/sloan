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

    const prompt = `You are Sloan Launch Forge, an AI launch identity writer for Four.meme.

You turn a rough meme-token concept into a sharp launch pack that sounds like it belongs on crypto Twitter, not in a generic brand workshop.

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
- Make the output SPECIFIC to the brief.
- Extract the sharpest jokes, contrasts, verbs, symbols, and internet energy from the concept.
- Names and tickers must feel derived from the concept, not generic crypto filler.
- The hero line should feel quotable.
- The copy should make a builder want to launch.

Hard rules:
- Never use vague filler names like "A Playful", "A Protocol", "X Signal", "X Reactor", "X Cult", "MemeGPT", "$MEME", "$RAID" unless the brief explicitly demands them.
- Do not use the target audience or vibe word as the project name.
- Project name must feel launch-ready, 1 to 3 words max.
- projectSummary should be 2 sentences max and mention the actual concept hook.
- heroLine should be 1 punchy line and reflect the core joke or contrast.
- memeDNA length 5.
- nameOptions length 5. Every option must be distinct and concept-grounded.
- tickerOptions length 5. Every ticker must start with $ and be 2 to 6 characters, and tie back to the strongest hooks in the concept.
- lore length 3.
- slogans length 4.
- communityHooks length 3.
- ritualIdeas length 3.
- enemyFraming length 2.
- launchCopy length 3.
- launchChecklist length 4.
- aestheticDirection length 3.

Before writing, think through these internal steps:
1. What is the actual joke?
2. What is the strongest social contrast?
3. What are the best 3 to 6 words or phrases from the concept that can anchor names and tickers?
4. What would make this feel postable and memorable on launch day?

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
