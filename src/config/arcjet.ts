import arcjet, {
  shield,
  detectBot,
  slidingWindow,
  tokenBucket,
} from '@arcjet/node';

if (!process.env.ARCJET_KEY && process.env.NODE_ENV !== 'test') {
  throw new Error('ARCJET_KEY is not set');
}

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: 'LIVE' }),

    detectBot({
      mode: 'LIVE', // Blocks requests. Use "DRY_RUN" to log only
      // Block all bots except the following
      allow: [
        'CATEGORY:SEARCH_ENGINE', // Google, Bing, etc
        // Uncomment to allow these other common bot categories
        // See the full list at https://arcjet.com/bot-list
        //"CATEGORY:MONITOR", // Uptime monitoring services
        'CATEGORY:PREVIEW', // Link previews e.g. Slack, Discord
      ],
    }),
    slidingWindow({
      mode: 'LIVE', // Blocks requests. Use "DRY_RUN" to log only
      interval: '2s', // 1 minute
      max: 5,
    }),
  ],
});

export default aj;
