const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function fallbackRaidPack(payload: any) {
  const token = payload?.token || 'this launch';
  const ticker = payload?.tokenTicker || `$${String(token).slice(0, 5).toUpperCase()}`;
  const vibe = payload?.vibe || 'Sharp';
  const objective = payload?.objective || 'win timeline mindshare';
  const audience = payload?.audience || 'Degens';
  const contrast = payload?.contrast || 'copy-paste launches with no real identity';
  const narrative = payload?.narrativeSummary || `${token} already has enough motion to earn a real push.`;
  const callToAction = payload?.callToAction || `Push ${ticker} while attention is still cheap.`;

  return {
    platform: payload?.platform || 'X',
    missionBrief: `${token} needs a coordinated ${vibe.toLowerCase()} push aimed at ${audience.toLowerCase()} to ${objective}. Keep the story grounded in the actual joke: ${narrative}`,
    variants: [
      `${token} is not another empty ticker. ${narrative} ${callToAction}`,
      `While other launches beg for attention, ${token} already has a cleaner story. ${objective} before the crowd turns this obvious.`,
      `${token} works because it has a sharper joke than the usual landfill. ${callToAction}`,
      `${ticker} has more identity than most launches trying to force a chart. ${objective} now, not after it gets crowded.`,
    ],
    replyLines: [
      `${token} has a cleaner setup than the usual timeline spam.`,
      `The joke actually lands here, which already puts it ahead of half the feed.`,
      `This is stronger than the recycled launches people are still forcing.`,
      `${ticker} still looks underposted for the amount of attention it can pull.`,
    ],
    quoteReplies: [
      `This one is easy to explain in one line, which is why it travels.`,
      `The meme is sharp, the timing is decent, and the crowd has not fully piled in yet.`,
      `You can tell this is not just another ticker because the framing actually sticks.`,
      `Most launches ask for belief. This one gives people something to repeat.`,
    ],
    raidAngles: [
      `Underdog angle versus ${contrast}`,
      `Simple one-line story people can repost without explaining too much`,
      `Push the contrast between a real joke and forced meme packaging`,
    ],
    doNotSay: [
      'Do not promise moon math or guaranteed gains.',
      'Do not spam generic lines like next 100x or this will melt faces.',
      'Do not sound like a bot farm repeating the same sentence.',
    ],
    callToAction,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const openAiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAiKey) {
      return new Response(JSON.stringify({ success: true, content: fallbackRaidPack(payload), fallback: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `You are Sloan Raid Studio, an AI operator for Four.meme launches.
Return JSON only with this exact shape:
{
  "platform": string,
  "missionBrief": string,
  "variants": string[],
  "replyLines": string[],
  "quoteReplies": string[],
  "raidAngles": string[],
  "doNotSay": string[],
  "callToAction": string
}

Token context:
- Token: ${payload?.token}
- Ticker: ${payload?.tokenTicker || ''}
- Platform: ${payload?.platform}
- Vibe: ${payload?.vibe}
- Objective: ${payload?.objective}
- Audience: ${payload?.audience || 'Degens'}
- Contrast or enemy: ${payload?.contrast || 'generic copycat launches'}
- Call to action: ${payload?.callToAction || 'Make the launch impossible to ignore.'}
- Narrative summary: ${payload?.narrativeSummary || 'No extra narrative provided.'}
- Momentum: ${payload?.momentum || 'stable'}
- 24h volume: ${payload?.volume24h || 0}
- Holders: ${payload?.holders || 0}
- 24h price change: ${payload?.priceChange24h || 0}
- Rank bucket: ${payload?.sourceRankLabel || 'unknown'}

Rules:
- Variants length must be exactly 4.
- replyLines length must be exactly 4.
- quoteReplies length must be exactly 4.
- raidAngles length must be exactly 3.
- doNotSay length must be exactly 3.
- The copy must feel internet-native, sharp, and human.
- Ground the writing in the token context. Do not output generic crypto shill sludge.
- Avoid phrases like next 100x, moon mission, insane gem, guaranteed gains, or financial advice.
- The missionBrief should tell a human raider what story to push and what angle to avoid.
- The callToAction should be a short command a community can rally around.
- Make the lines distinct from one another. No near-duplicates.
- No emojis unless natural.
- Return valid JSON only.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        temperature: 0.9,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ success: true, content: fallbackRaidPack(payload), fallback: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const generated = JSON.parse(content);

    return new Response(JSON.stringify({ success: true, content: generated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
