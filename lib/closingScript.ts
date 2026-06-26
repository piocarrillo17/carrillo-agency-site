// Dynamic Mortgage Protection Closing Script — Aged Leads Version

export type ClientType = 'standard' | 'older'

export interface ClosingCtx {
  clientName: string
  spouseName: string
  state: string
  agentName: string
  agentPhone: string
  producerNumber: string
  maritalStatus: 'single' | 'married'
  coversSpouse: boolean
  clientDOB: string
  spouseDOB: string
  height: string
  weight: string
  conditions: string
  prescriptions: string
  tobacco: string
  dependents: string
  job: string
  jobLength: string
  spouseJob: string
  combinedIncome: string
  mortgagePayment: string
  mortgageBalance: string
  equity: string
  otherExpenses: string
  otherDebts: string
  existingCoverage: string
  existingCoverageAmount: string
  existingCoveragePayment: string
  beneficiaryName: string
  clientType: ClientType
  option1Price: string
  option2Price: string
  option9mo: string
  option12mo: string
  option18mo: string
  carrierName: string
  monthlyPremium: string
  billingDate: string
  benefits: string
  referrals: string
  newNote: string
}

export const BLANK_CTX: ClosingCtx = {
  clientName: '', spouseName: '', state: '', agentName: '', agentPhone: '', producerNumber: '',
  maritalStatus: 'single', coversSpouse: false, clientDOB: '', spouseDOB: '',
  height: '', weight: '', conditions: '', prescriptions: '', tobacco: '',
  dependents: '', job: '', jobLength: '', spouseJob: '',
  combinedIncome: '', mortgagePayment: '', mortgageBalance: '', equity: '',
  otherExpenses: '', otherDebts: '', existingCoverage: '', existingCoverageAmount: '',
  existingCoveragePayment: '', beneficiaryName: '',
  clientType: 'standard',
  option1Price: '', option2Price: '',
  option9mo: '', option12mo: '', option18mo: '',
  carrierName: '', monthlyPremium: '', billingDate: '', benefits: '',
  referrals: '', newNote: '',
}

// Compute leftover monthly cash after mortgage + expenses
export function calcLeftover(ctx: ClosingCtx): number | null {
  const inc = parseFloat(ctx.combinedIncome)
  const mort = parseFloat(ctx.mortgagePayment)
  const exp = parseFloat(ctx.otherExpenses)
  if (isNaN(inc) || isNaN(mort) || isNaN(exp)) return null
  return inc - mort - exp
}

export function fmt$(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US')
}

// --- Script steps ---
export interface ScriptStep {
  id: string
  title: string
  icon: string
  script: (ctx: ClosingCtx) => string
  fields?: FieldDef[]
  computed?: (ctx: ClosingCtx) => { label: string; value: string; highlight?: boolean }[]
  onlyIf?: (ctx: ClosingCtx) => boolean
}

export interface FieldDef {
  key: keyof ClosingCtx
  label: string
  type: 'text' | 'select' | 'toggle' | 'textarea' | 'dollar' | 'checkbox'
  options?: string[]
  placeholder?: string
  half?: boolean
}

export const CLOSING_STEPS: ScriptStep[] = [
  {
    id: 'intro',
    title: 'Close Intro',
    icon: '✍️',
    fields: [
      { key: 'clientName', label: 'Client First Name', type: 'text', placeholder: 'e.g. Maria', half: true },
      { key: 'state', label: 'State', type: 'text', placeholder: 'e.g. Texas', half: true },
      { key: 'agentName', label: 'Your Name', type: 'text', placeholder: 'Pio Carrillo', half: true },
      { key: 'agentPhone', label: 'Your Phone', type: 'text', placeholder: '(555) 000-0000', half: true },
      { key: 'producerNumber', label: 'Producer / Badge Number', type: 'text', placeholder: '12345678' },
    ],
    script: (c) => `"Alright ${c.clientName || '[Client]'}, go ahead and grab a pen and paper and let me know when you're ready."

(Pause)

"You know how the state and the lenders are — they require me to have you write down my information so you know you're speaking with a licensed professional."

"Go ahead and write down my name — ${c.agentName || '[Your Name]'} — you should also have my callback number on your caller ID, correct?"

(Pause)

"Perfect. They'll also have you write down my field underwriting producer number. This is basically like my badge number."

"Go ahead and write down: ${c.producerNumber || '[Producer Number]'}"

"Now go ahead and repeat that back to me so I can make sure everything's correct."

(Pause)

"Perfect — you pass the test."`,
  },
  {
    id: 'frame',
    title: 'Process & Frame',
    icon: '🎯',
    script: (c) => `"So just so you know how this works — is this your first time going through the mortgage protection process, or have you done something like this before?"

(Pause, acknowledge)

"Either way, it's pretty simple. I'm going to spend about two minutes asking you some basic health and financial questions. Based on that, it's my job as the field underwriter to run this through the carriers in the state of ${c.state || '[State]'} that offer mortgage protection."

"The goal is to see what you qualify for, then — God willing — we find something that actually makes sense financially for you and your family."

"I'll show you a few options, you tell me what's comfortable and affordable, and if everything looks good we'll simply submit a request for coverage."

"Sound fair?"

(Wait for yes)

"Perfect."`,
  },
  {
    id: 'why',
    title: 'Assumptive Why',
    icon: '💬',
    script: (c) => `"Alright ${c.clientName || '[Client]'}, before I put this through the carriers, I just want to confirm why the state had this sent out to you, so I make sure I'm looking at the right programs."

WHY #1 — PURPOSE
"Typically when homeowners look into this, it's because they want to make sure the house doesn't become a financial burden on their family if something unexpected happens. That's the main concern for you as well, correct?"

(Pause — wait for yes)

WHY #2 — CONSEQUENCE
"And the concern is, if something did happen, you'd want to make sure your family isn't forced to sell the home or struggle with the mortgage payments, right?"

(Pause)

WHY #3 — OUTCOME
"So ideally, you're looking for something that would either pay off the mortgage completely or at least cover the payments long enough for your family to breathe and decide what to do. Is that fair to say?"

(Pause)

WHY #4 — DECISION FRAME (soft close seed)
"And as long as it does what it's supposed to do and fits comfortably in your budget, you'd rather take care of this now instead of putting it off again, correct?"

(Pause)`,
  },
  {
    id: 'household',
    title: 'Household Qualification',
    icon: '🏠',
    fields: [
      { key: 'maritalStatus', label: 'Marital Status', type: 'select', options: ['single', 'married'], half: true },
      { key: 'spouseName', label: "Spouse's Name", type: 'text', placeholder: 'e.g. Carlos', half: true },
      { key: 'clientDOB', label: 'Client Date of Birth', type: 'text', placeholder: 'MM/DD/YYYY', half: true },
      { key: 'spouseDOB', label: 'Spouse Date of Birth', type: 'text', placeholder: 'MM/DD/YYYY', half: true },
      { key: 'coversSpouse', label: 'Cover Both?', type: 'checkbox' },
    ],
    script: (c) => `"Alright ${c.clientName || '[Client]'}, just to make sure I'm looking at the right household setup…"

"Are you currently married, or is it just you in the home?"

${c.maritalStatus === 'married' ? `"Okay, and your spouse's name is?" → ${c.spouseName || '[Spouse Name]'}

"Perfect. And just to verify ages, what's your date of birth?" → ${c.clientDOB || '[DOB]'}
"And your spouse's date of birth?" → ${c.spouseDOB || '[Spouse DOB]'}

"Just to make sure, are we looking to get coverage for both of you if something were to happen?"` : `(Single — coverage for client only)`}`,
  },
  {
    id: 'health',
    title: 'Health Qualification',
    icon: '🩺',
    fields: [
      { key: 'height', label: 'Height', type: 'text', placeholder: "5'9\"", half: true },
      { key: 'weight', label: 'Weight (lbs)', type: 'text', placeholder: '185', half: true },
      { key: 'conditions', label: 'Major Medical Conditions', type: 'textarea', placeholder: 'None / Diabetes / High Blood Pressure…' },
      { key: 'prescriptions', label: 'Prescriptions (what they treat)', type: 'textarea', placeholder: 'Metformin → diabetes, Lisinopril → blood pressure…' },
      { key: 'tobacco', label: 'Tobacco / Nicotine Use', type: 'select', options: ['None', 'Cigarettes', 'Vaping', 'Cigars', 'Chew', 'Quit < 1yr', 'Quit > 1yr'] },
    ],
    script: (c) => `"Now for health qualification, I just need to check a few basics here."

"What's your height and weight?" → ${c.height || '[Height]'} / ${c.weight || '[Weight]'} lbs

"Any major medical conditions I should be aware of?" → ${c.conditions || 'None'}

"Are you currently taking any prescriptions?"
(If yes) "I don't need to know the name — just what they treat." → ${c.prescriptions || 'None'}

"And any tobacco or nicotine use at all — cigarettes, vaping, cigars, chew?" → ${c.tobacco || '[Answer]'}${c.maritalStatus === 'married' ? `

(Clarify for ${c.spouseName || 'spouse'} as well)` : ''}`,
  },
  {
    id: 'dependents',
    title: 'Dependents',
    icon: '👨‍👩‍👧',
    fields: [
      { key: 'dependents', label: 'Names of dependents', type: 'textarea', placeholder: 'Sofia (12), Miguel (8)…' },
    ],
    script: (c) => `"Do you have children or anyone else who depends on you financially in the home?"

${c.dependents ? `"Okay — and their names?" → ${c.dependents}

(Pause — write them down. These names are your emotional anchors for later.)` : '(If yes — collect names and write them down)'}`,
  },
  {
    id: 'employment',
    title: 'Employment & Income',
    icon: '💼',
    fields: [
      { key: 'job', label: 'Client Occupation', type: 'text', placeholder: 'Truck driver, teacher, nurse…', half: true },
      { key: 'jobLength', label: 'How long?', type: 'text', placeholder: '7 years', half: true },
      { key: 'spouseJob', label: 'Spouse Occupation', type: 'text', placeholder: 'Works at Amazon…', half: true },
      { key: 'combinedIncome', label: 'Combined Monthly Income ($)', type: 'dollar', placeholder: '5500', half: true },
    ],
    script: (c) => `"Perfect. Now that I have a clear picture of your household and health, let's go over a few financial details so I can make sure the protection actually fits your situation."

"What do you do for a living?" → ${c.job || '[Occupation]'}
"How long have you been doing that?" → ${c.jobLength || '[Duration]'}
"And your schedule — is it pretty steady?"

${c.maritalStatus === 'married' ? `"And does ${c.spouseName || 'your spouse'} also work?" → ${c.spouseJob || '[Spouse Occupation]'}` : ''}

"And roughly, what's your combined monthly household income?" → ${c.combinedIncome ? '$' + Number(c.combinedIncome).toLocaleString() : '[Income]'}/mo`,
  },
  {
    id: 'mortgage',
    title: 'Mortgage & Home',
    icon: '🏡',
    fields: [
      { key: 'mortgagePayment', label: 'Monthly Mortgage Payment ($)', type: 'dollar', placeholder: '1450', half: true },
      { key: 'mortgageBalance', label: 'Balance Owed ($)', type: 'dollar', placeholder: '185000', half: true },
      { key: 'equity', label: 'Estimated Equity ($)', type: 'dollar', placeholder: '60000', half: true },
    ],
    script: (c) => `"Now your mortgage payment — about what does that run you each month?" → ${c.mortgagePayment ? '$' + Number(c.mortgagePayment).toLocaleString() : '[Payment]'}/mo

"And roughly how much do you still owe on the mortgage?" → ${c.mortgageBalance ? '$' + Number(c.mortgageBalance).toLocaleString() : '[Balance]'}

"Do you have a sense of how much equity you have in the home?" → ${c.equity ? '$' + Number(c.equity).toLocaleString() : '[Equity]'}`,
  },
  {
    id: 'expenses',
    title: 'Expenses & Existing Coverage',
    icon: '💳',
    fields: [
      { key: 'otherExpenses', label: 'Other Monthly Expenses ($)', type: 'dollar', placeholder: 'utilities, groceries, car, phones… e.g. 2200', half: true },
      { key: 'otherDebts', label: 'Other Major Debts', type: 'text', placeholder: 'Credit cards, student loans…', half: true },
      { key: 'existingCoverage', label: 'Existing Life Insurance', type: 'text', placeholder: 'Employer / None / MetLife…' },
      { key: 'existingCoverageAmount', label: 'Coverage Amount ($)', type: 'dollar', placeholder: '50000', half: true },
      { key: 'existingCoveragePayment', label: 'Monthly Payment ($)', type: 'dollar', placeholder: '35', half: true },
    ],
    script: (c) => `"If you had to estimate — outside of your mortgage payment — between utilities, groceries, car payments, phones, insurance etc. — about how much goes out monthly?" → ${c.otherExpenses ? '$' + Number(c.otherExpenses).toLocaleString() : '[Expenses]'}/mo

"And aside from the mortgage, any other major debts — credit cards, student loans, anything else?" → ${c.otherDebts || 'None'}

"Are you currently putting anything toward retirement or savings?"

"Do you have any life insurance outside of work?" → ${c.existingCoverage || 'None'}
${c.existingCoverage && c.existingCoverage.toLowerCase() !== 'none' ? `(If employer coverage) "You're aware those usually only cover about a year of income and don't follow you if you leave or retire, right?"

"About how much and what are you paying monthly?" → ${c.existingCoverageAmount ? '$' + Number(c.existingCoverageAmount).toLocaleString() : '[Amount]'} / ${c.existingCoveragePayment ? '$' + Number(c.existingCoveragePayment).toLocaleString() : '[Payment]'}/mo` : ''}`,
    computed: (c) => {
      const leftover = calcLeftover(c)
      if (leftover === null) return []
      return [{ label: 'Monthly leftover after mortgage + expenses', value: fmt$(leftover), highlight: true }]
    },
  },
  {
    id: 'emotional',
    title: 'Emotional Buy-In',
    icon: '❤️',
    fields: [
      { key: 'beneficiaryName', label: 'Beneficiary Name', type: 'text', placeholder: 'e.g. Maria or "the kids"' },
    ],
    script: (c) => {
      const leftover = calcLeftover(c)
      const leftoverStr = leftover !== null ? fmt$(leftover) : '$[calculated]'
      return `"So based on what you told me, after everything goes out each month, it looks like you have around ${leftoverStr} left over. Does that sound about right?"

(Confirm — let them validate the number)

"And earlier, you mentioned that ${c.beneficiaryName || '[Beneficiary]'} would be the one handling everything if something happened to you."

"If your income stopped suddenly, how long do you think it would take before things got tight for them?"

(Pause — let them answer)

${c.dependents ? `"Would the kids be able to stay in the same schools?"` : ''}
${c.maritalStatus === 'married' ? `"Would ${c.spouseName || 'your spouse'} realistically be able to keep the house on their own?"` : ''}

"If something had happened yesterday, would they be choosing to stay in the home — or would they be forced to sell?"

(Let them respond)

"So we can agree — like most families — losing an income would create some really tough decisions. Right?"

(Wait for yes)

"That's exactly why the state has us review this now, before it ever becomes an emergency."`
    },
    computed: (c) => {
      const leftover = calcLeftover(c)
      if (leftover === null) return []
      return [
        { label: 'Combined Monthly Income', value: c.combinedIncome ? '$' + Number(c.combinedIncome).toLocaleString() : '—' },
        { label: 'Mortgage Payment', value: c.mortgagePayment ? '− $' + Number(c.mortgagePayment).toLocaleString() : '—' },
        { label: 'Other Expenses', value: c.otherExpenses ? '− $' + Number(c.otherExpenses).toLocaleString() : '—' },
        { label: 'Monthly Leftover', value: fmt$(leftover), highlight: true },
      ]
    },
  },
  {
    id: 'authority',
    title: 'Authority & Pre-Handle',
    icon: '🛡️',
    script: () => `ROLE & AUTHORITY POSITIONING
"Let me quickly explain my role here."
"I work with families like yours every week to make sure their loved ones aren't left making rushed or painful financial decisions when something unexpected happens."
"I don't work for one company — I work for you. My job is to find the best protection you qualify for at the best price, and let you decide what makes sense."

PRE-HANDLE "I NEED TO THINK ABOUT IT"
"Now, as we go through the options, I want you to know — my goal isn't to push you into anything you're not comfortable with."
"I'll show you the most complete option first, then we can adjust from there."
"And just to be upfront — when someone says 'I need to think about it,' it's usually because the price doesn't feel right."
"That's totally okay."
"So if something I show you doesn't fit your budget, can I count on you to just tell me?"

(Wait for yes — this is a commitment)`,
  },
  {
    id: 'solutions_standard',
    title: 'Solutions (Standard)',
    icon: '📋',
    onlyIf: (c) => c.clientType === 'standard',
    fields: [
      { key: 'option1Price', label: 'Option 1 Monthly Price ($)', type: 'dollar', placeholder: '87', half: true },
      { key: 'option2Price', label: 'Option 2 Monthly Price ($)', type: 'dollar', placeholder: '54', half: true },
    ],
    script: (c) => `"Alright, go ahead and grab that pen and paper again."
"I'm going to walk you through two options. We'd still have to apply to see if you qualify, but this will give you a clear picture."

OPTION 1 — FULL MORTGAGE PAYOFF + LIVING BENEFITS
"This first option completely pays off the mortgage if something happens to you."
"It also includes living benefits — meaning if you're diagnosed with something serious like cancer, heart attack, or stroke, you can access the benefit while you're still alive."
"This option removes the mortgage entirely from the equation."
"The cost for this is ${c.option1Price ? '$' + c.option1Price : '$[___]'} per month."

OPTION 2 — PARTIAL PROTECTION + LIVING BENEFITS
"This second option focuses on affordability."
"It doesn't pay off the full mortgage, but it significantly reduces or covers the payments so your family isn't overwhelmed. This will pay off half the mortgage."
"This option runs about ${c.option2Price ? '$' + c.option2Price : '$[___]'} per month."

DECISION FRAME
"Between these two, which one feels like it makes the most sense for your family right now?"

(SHUT UP — let them choose. If they choose, ask them why that one.)`,
  },
  {
    id: 'solutions_older',
    title: 'Critical Period Coverage',
    icon: '🏦',
    onlyIf: (c) => c.clientType === 'older',
    fields: [
      { key: 'option9mo', label: '9-Month Option ($)', type: 'dollar', placeholder: '42', half: true },
      { key: 'option12mo', label: '12-Month Option ($)', type: 'dollar', placeholder: '54', half: true },
      { key: 'option18mo', label: '18-Month Option ($)', type: 'dollar', placeholder: '71', half: true },
    ],
    script: (c) => `"Now, ${c.clientName || '[Client]'}, at this stage of life, fully paying off the mortgage usually doesn't make sense — it would feel like adding another mortgage payment. And don't worry… most homeowners in your situation don't do that."

(Pause — let relief set in)

"What they do instead is something called a Mortgage Payment Protection Plan, also known as Critical Period Coverage. Has anyone ever broken that down for you before?"

PAINT THE MOMENT
"God forbid something had happened to you yesterday… who would the home go to today?"
(Pause — let them say ${c.beneficiaryName || '[Beneficiary]'})

"And when the house goes to ${c.beneficiaryName || '[Beneficiary]'}, do you feel they'd want to keep the home, or would they probably sell it?"

REFRAME THE PROBLEM
"If something happens, the bank doesn't show up asking for the full mortgage balance — they just want the next payment. People don't lose homes because of payoff amounts… they lose them because they can't make the payments during that first stretch."

"The last thing we want is ${c.beneficiaryName || '[Beneficiary]'} standing at your funeral worried about the next mortgage payment."

THE SOLUTION
"So instead of trying to pay off the whole house, the most practical solution is covering 12 to 24 months of mortgage payments."
"That gives ${c.beneficiaryName || '[Beneficiary]'} the space to stay in the home if they want — or prepare it properly, clean it out, list it, and sell it for full value — not fire-sale it for $20K–$50K less."

THREE OPTIONS
"9 months of payments → ${c.option9mo ? '$' + c.option9mo : '$[___]'}/mo"
"12 months of payments → ${c.option12mo ? '$' + c.option12mo : '$[___]'}/mo"
"18 months of payments → ${c.option18mo ? '$' + c.option18mo : '$[___]'}/mo"

"Out of these three, which one gives ${c.beneficiaryName || '[Beneficiary]'} the most peace of mind — while still staying comfortable for you financially?"

(Silence — let them choose)`,
  },
  {
    id: 'lockdown',
    title: 'Lock Down the Sale',
    icon: '🔒',
    fields: [
      { key: 'carrierName', label: 'Carrier Name', type: 'text', placeholder: 'Banner Life', half: true },
      { key: 'monthlyPremium', label: 'Monthly Premium ($)', type: 'dollar', placeholder: '67', half: true },
      { key: 'billingDate', label: 'Billing Date', type: 'text', placeholder: '15th of each month', half: true },
      { key: 'benefits', label: 'Benefits to Read Back', type: 'textarea', placeholder: 'Living benefits, cash value, permanent coverage…' },
    ],
    script: (c) => `"Alright, ${c.clientName || '[Client]'}, I appreciate your patience — I'm just finishing up the last step here. Do you still have a pen and paper handy?"

(Wait)

"Go ahead and write this down for me:"

  Company: ${c.carrierName || '[Carrier]'}
  Monthly premium: ${c.monthlyPremium ? '$' + c.monthlyPremium : '$[___]'} per month
  Billing date: ${c.billingDate || '[Date]'} each month
  Your benefits: ${c.benefits || '[Living benefits, cash value, etc.]'}
  My name & number: ${c.agentName || '[Your Name]'} – ${c.agentPhone || '[Phone]'}

"Go ahead and save my number in your phone while we're here."

(Pause)

EXPECTATION SETTING
"When you see this charge hit your bank statement, don't be alarmed — that's simply your mortgage protection officially going into effect."
"You'll receive your official policy packet in the mail within about 7 to 10 business days."
"If for any reason it doesn't arrive, just call or text me and I'll handle it for you immediately."

ADVOCACY TIE-DOWN
"Please make sure ${c.beneficiaryName || '[Beneficiary]'} also has my contact saved in their phone. God forbid something ever happens, I'm the person they'll call."`,
  },
  {
    id: 'referral',
    title: 'Referrals',
    icon: '🤝',
    fields: [
      { key: 'referrals', label: '4–5 Referral Names', type: 'textarea', placeholder: 'John Smith, Rosa Lopez, Mike T…' },
    ],
    script: (c) => `"Before I let you go, there's one more really important thing I want to mention."

"Every year, billions of dollars in life insurance benefits go unclaimed simply because beneficiaries don't know a policy exists or don't know which company it's with."

"The last thing I'd ever want is for that to happen to your family."

"So what I do for all my clients is ask for 4 or 5 people you trust that I can list in your file. I'll give them a very quick, professional call — just to let them know they're listed in your file and to make sure they save my contact."

"So who are 4 or 5 people you'd feel comfortable listing?"

${c.referrals ? `Collected:\n${c.referrals}` : '(If they hesitate: "Think close family members, trusted friends, or even an advisor — just people you\'d trust to help your family if needed.")'}`,
  },
  {
    id: 'bridge',
    title: 'Future Planning Bridge',
    icon: '📈',
    script: () => `"One last thing — today we focused on protecting the mortgage, but I also help families with quite a bit more than just mortgage protection insurance."

"For example, we work with debt elimination strategies that help people pay off debt faster without spending a dollar more per month, and we help families with retirement planning and protecting assets from market downside."

"Let me ask you this — if your mortgage and other debts were already handled, would your retirement situation feel more comfortable?"

(If yes)
"That's exactly how most of my clients feel. Would you be open to a quick conversation with a subject-matter expert sometime soon just to explore what that could look like?"

(Book follow-up)`,
  },
  {
    id: 'close',
    title: 'Final Close',
    icon: '✅',
    script: (c) => `"Alright, ${c.clientName || '[Client]'}, it was truly a pleasure helping you today."

"I'll check in with you down the road, but in the meantime — if you need anything at all, whether it's policy questions, adjustments, additional coverage, or future planning, just reach out."

"Have a blessed day, and we'll talk soon."`,
  },
]
