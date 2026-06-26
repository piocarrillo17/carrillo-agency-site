// Encouraging / motivational Bible verses for the dashboard.
// Rotates hourly so the team sees a fresh one through the day.
export const VERSES: { text: string; ref: string }[] = [
  { text: 'I can do all things through Christ who strengthens me.', ref: 'Philippians 4:13' },
  { text: 'Commit your work to the Lord, and your plans will be established.', ref: 'Proverbs 16:3' },
  { text: 'Whatever you do, work heartily, as for the Lord and not for men.', ref: 'Colossians 3:23' },
  { text: 'Be strong and courageous. Do not be afraid; do not be discouraged.', ref: 'Joshua 1:9' },
  { text: 'The plans of the diligent lead surely to abundance.', ref: 'Proverbs 21:5' },
  { text: 'Let us not grow weary of doing good, for in due season we will reap.', ref: 'Galatians 6:9' },
  { text: 'For I know the plans I have for you, plans to prosper you and not to harm you.', ref: 'Jeremiah 29:11' },
  { text: 'She is clothed with strength and dignity; she can laugh at the days to come.', ref: 'Proverbs 31:25' },
  { text: 'The Lord will fight for you; you need only to be still.', ref: 'Exodus 14:14' },
  { text: 'Trust in the Lord with all your heart, and lean not on your own understanding.', ref: 'Proverbs 3:5' },
  { text: 'And whatever you do, in word or deed, do everything in the name of the Lord.', ref: 'Colossians 3:17' },
  { text: 'In all toil there is profit, but mere talk tends only to poverty.', ref: 'Proverbs 14:23' },
  { text: 'Do not be anxious about anything, but in everything by prayer present your requests.', ref: 'Philippians 4:6' },
  { text: 'The hand of the diligent will rule, while the slothful will be put to forced labor.', ref: 'Proverbs 12:24' },
  { text: 'Cast all your anxiety on Him because He cares for you.', ref: '1 Peter 5:7' },
  { text: 'Be strong and let your heart take courage, all you who wait for the Lord.', ref: 'Psalm 31:24' },
  { text: 'Whatever your hand finds to do, do it with all your might.', ref: 'Ecclesiastes 9:10' },
  { text: 'The Lord is my strength and my shield; my heart trusts in Him.', ref: 'Psalm 28:7' },
  { text: 'Let all that you do be done in love.', ref: '1 Corinthians 16:14' },
  { text: 'A man’s heart plans his way, but the Lord directs his steps.', ref: 'Proverbs 16:9' },
  { text: 'They who wait for the Lord shall renew their strength; they shall mount up with wings like eagles.', ref: 'Isaiah 40:31' },
  { text: 'Therefore encourage one another and build one another up.', ref: '1 Thessalonians 5:11' },
  { text: 'The blessing of the Lord makes rich, and He adds no sorrow with it.', ref: 'Proverbs 10:22' },
  { text: 'God is within her, she will not fall; God will help her at break of day.', ref: 'Psalm 46:5' },
]

// Pick the verse for the current local hour (switches every hour).
export function hourlyVerse(d: Date = new Date()): { text: string; ref: string } {
  return VERSES[d.getHours() % VERSES.length]
}
