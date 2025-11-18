import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import awsAmplify from 'astro-aws-amplify';

export default defineConfig({
  output: 'server',
  adapter: awsAmplify(),
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false
    })
  ]
});
