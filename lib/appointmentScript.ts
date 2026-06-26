// Interactive NEPQ-style appointment-setting script for aged mortgage protection leads.
// Steps run in order; objections can be tapped at any point (usually after the opener).

export type ScriptStep = { id: string; title: string; body: string }
export type Branch = { label: string; response: string }
export type Objection = { label: string; response: string; branches?: Branch[] }

export const SCRIPT_STEPS: ScriptStep[] = [
  {
    id: 'voicemail', title: 'Voicemail (no answer)',
    body: `“Hey [NAME], this is [AGENT]. I’m reaching out regarding your mortgage with [LENDER] at [ADDRESS] — there’s some important paperwork I need to get to you. Give me a quick call when you get this at [your #]. Again, that’s [your #]. Thanks!”`,
  },
  {
    id: 'text', title: 'Text after voicemail (optional)',
    body: `“Hey [NAME], this is [AGENT] — just left you a message. Give me a quick call when you get this, it’s regarding your mortgage with [LENDER] at [ADDRESS]. My number: [your #]. Thanks!”`,
  },
  {
    id: 'opener', title: 'Opener',
    body: `“Hey [NAME]?… This is just [AGENT]. You might not remember this — it looks like it was some time ago and, for whatever reason, it doesn’t look like anyone updated the system here. Do you remember when you closed on the mortgage there at [ADDRESS] with [LENDER]?

There was supposed to be some information sent over to you regarding the plans to pay off the mortgage if you were to get sick, disabled, or pass away. Did anybody ever go over that with you, or what ended up happening?”

→ Pause. This is usually where they give an objection — tap it below.`,
  },
  {
    id: 'bridge', title: 'Bridge — “I’m the manager”',
    body: `“Oh, gotcha. Well, I’m the manager assigned to help get that taken care of for you. I just need to verify a few quick details from the form you sent in, so I can update your request and figure out the best options for you, okay?”`,
  },
  {
    id: 'verify', title: 'Verify the form',
    body: `• DOB: “I have your date of birth as [DOB] (age [AGE]) — is that correct?” (and spouse’s if applicable)
• Tobacco: “It says you use/don’t use tobacco — any nicotine in the last 12 months? You’re not planning on starting this weekend, are you?” 😄
• Health: “Any major health issues or surgeries the past few years, or are you relatively healthy? Any meds — high blood pressure, diabetes, etc.?”
• Height & weight?
• Occupation: “What do you do for a living, [NAME]? Nothing dangerous like a stuntman or rodeo clown, I hope.” 😄
• Mortgage: “I see it’s about $[MORTGAGE] — is that right? Did you do a 30- or 15-year loan?”
• (Optional) “What’s your work schedule like? I want to be mindful when we schedule.”`,
  },
  {
    id: 'motivation', title: 'Confirm the why',
    body: `“Perfect — thanks for confirming all that. Now most importantly: I imagine when you filled this out, you were probably just trying to make sure your family wouldn’t be stuck with the mortgage payment if something happened — was that kind of the idea?”

→ Pause, let them affirm.`,
  },
  {
    id: 'pitch', title: 'Frame the appointment',
    body: `“Got it. So here’s how this works: it only takes about 15–20 minutes for us to go over what you’re eligible for and look at a couple of simple protection options that fit what you’re trying to accomplish.

Then we’ll just walk through them together, and you can decide which one — if any — makes sense for you and your budget. Does that make sense?”`,
  },
  {
    id: 'schedule', title: 'Lock a time',
    body: `“Let’s find a time that works for you (and [Spouse] if they’ll be involved). I have a few slots open — do you prefer evenings or mornings for a quick phone call?

How about [Day] around [Time], or would [Alternate Day] at [Alternate Time] be better for you?”`,
  },
  {
    id: 'lockdown', title: 'Confirm & set reminder',
    body: `“Great — let’s pencil that in for [Day] at [Time]. Grab a pen and let me know when you’re ready so you can write this down… Okay, I have you down for [Day] at [Time]. Please make sure [Spouse] can join us, so you both get the information — it’ll only take about 20 minutes.

Before I let you go, [NAME], is there any reason you can think of that this appointment might not happen?… No? Perfect.

I’ll send you a quick reminder by text/email with my name ([AGENT]) and the time. If anything changes, please let me know — otherwise I’m looking forward to helping you out on [Day]!”`,
  },
  {
    id: 'close', title: 'Close out',
    body: `“Awesome — thank you, [NAME]. You have a great day, and we’ll talk soon!” 👍`,
  },
]

export const OBJECTIONS: Objection[] = [
  {
    label: `“I don’t remember this”`,
    response: `“Gotcha — no worries at all. Just so I can make sure we’re on the same page… how familiar are you with how this works?” (Pause, let them answer.)

“You know how when most people buy a home, they just want to make sure that if something happens — illness, disability, or passing away — their family isn’t forced to sell the home or struggle with the payments?” (Pause for agreement.)

“That’s where I come in. My job is just to help homeowners like you see what you qualify for and make sure you’re getting the best options available.”

→ Transition: “So I can update the file the right way, let me just quickly verify a few things you originally put down…”`,
  },
  {
    label: `“I already took care of it”`,
    response: `“Yeah, that makes sense — I’m just surprised this wasn’t updated on our end. Let me get that fixed so people stop calling you.

Just so I can update the file correctly — which one of our carriers did you end up going with?” (Pause.) “Oh okay — and I’m curious, what made you choose them over the other options?” (Pause.)`,
    branches: [
      { label: `They’re vague / not confident`, response: `“Gotcha. They’re not a bad company. I just want to make sure you didn’t get boxed into something that wasn’t a fit. When you did it, did they go over multiple options, or was it mainly just that one?”` },
      { label: `They only saw one option`, response: `“Yeah, that happens a lot — some agents only work with one company, so people don’t always get to compare what’s available. Since I’m already on your file, let me just double-check your numbers and make sure you actually landed in the best spot for your situation.”

→ Transition: “It’ll take 60 seconds — I just need to verify a few details real quick…”` },
    ],
  },
  {
    label: `“I’m good / not interested”`,
    response: `“Yeah, I totally understand — and I’m not calling to pressure you, I’m really just trying to update what happened.

Do you remember what it was for you? Was it mostly that it felt too expensive at the time, or was there another reason?” (Pause.)`,
    branches: [
      { label: `“It was too expensive”`, response: `“Gotcha. Do you remember roughly what they were quoting you?” (Pause.)

“Okay — and just so I’m clear, you’re about [AGE], and the mortgage is around $[MORTGAGE], right?” (Pause.)

“That does sound a little higher than what most people expect for that kind of situation. Let me just verify your info and make sure the numbers are accurate — because if you were quoted high, I’d rather you at least know what it should look like.”

→ Transition: “Real quick — DOB, tobacco, and health, then I’ll know exactly what bucket you’re in…”` },
      { label: `Keeps resisting / opted out`, response: `“I hear you, [NAME] — and I’m not here to twist your arm. Just so I can close this out correctly on my end… has anything changed since you first looked into it, or was it simply not the right time back then?” (Pause.)

Soft exit (if needed): “Totally fair. I’ll update the file accordingly so you’re not getting bothered. Appreciate you, [NAME].”` },
    ],
  },
  {
    label: `“I sold the home”`,
    response: `“Gotcha — that makes sense. Out of curiosity, when you sold the home, did you replace the protection with anything else… or did it just kind of get put on the back burner?” (Pause — let them answer.)`,
    branches: [
      { label: `“No, I didn’t replace it”`, response: `“Yeah, that’s actually really common. Most people think mortgage protection is only tied to the house, but the real purpose was protecting your family’s income — not the property itself.” (Pause for agreement.)

“So now that the mortgage isn’t the issue anymore, the question usually becomes: if something happened to you, would your family still be financially okay for the next few years?” (Pause.)

→ “That’s why they asked me to reach out — just to see if it still makes sense to have basic life coverage, even without the home.”` },
    ],
  },
  {
    label: `“I paid off the loan”`,
    response: `“That’s awesome — congratulations on that. Let me ask you this: when you paid it off, was the goal more about peace of mind… or just being debt-free?” (Pause.)

“Right — and what most people don’t realize is the mortgage was just one reason for coverage. Once the loan is gone, the protection usually shifts to things like: income replacement, final expenses, leaving something for family, or just making sure no one has to struggle financially.” (Pause.)

→ “Would it be crazy to at least look at a simple life policy that isn’t tied to a house — just to see if it still makes sense for you?”`,
  },
]

export const TRANSITIONS = [
  `“Perfect — I just need to verify a few things you originally put down so I can update the file.”`,
  `“I’ll be quick — DOB, tobacco, health, and the mortgage info, then I can handle the rest.”`,
  `“This’ll take about 60 seconds — then I’ll know what you actually qualify for.”`,
]

export type ScriptCtx = { name?: string; address?: string; lender?: string; dob?: string; age?: number | null; mortgage?: string; agent?: string }

// Replace known tokens with the lead/agent's real info. Unknown tokens stay as
// visible blanks the agent fills in verbally (e.g. [Day], [Time], [Spouse]).
export function personalize(text: string, ctx: ScriptCtx): string {
  const first = (ctx.name || '').trim().split(/\s+/)[0]
  let t = text
  const sub = (re: RegExp, val?: string | number | null) => { const v = val == null ? '' : String(val); if (v.trim()) t = t.replace(re, v) }
  sub(/\[(?:Client'?s )?Name\]/gi, first)
  sub(/\[NAME\]/g, first)
  sub(/\[AGENT\]/g, ctx.agent)
  sub(/\[Your Name\]/gi, ctx.agent)
  sub(/\[(?:Client'?s )?Address\]/gi, ctx.address)
  sub(/\[ADDRESS\]/g, ctx.address)
  sub(/\[Lender\]/gi, ctx.lender)
  sub(/\[LENDER\]/g, ctx.lender)
  sub(/\[DOB\]/gi, ctx.dob)
  sub(/\{AGE\}|\[AGE\]/gi, ctx.age)
  sub(/\$?\[Mortgage(?:Amount)?\]/gi, ctx.mortgage)
  sub(/\$?\[MORTGAGE\]/g, ctx.mortgage)
  return t
}
