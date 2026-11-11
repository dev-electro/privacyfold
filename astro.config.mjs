// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://privacyfold.com',
  output: 'static',
  i18n: {
    defaultLocale: 'en',
    locales: [
      'en',
      'hi',
      'es',
      'de',
      'fr',
      'ja',
      'pt',
      'it',
      'zh',
      'ar',
      'ko',
      'ru',
      'nl',
      'id',
      'tr',
      'pl',
      'vi',
    ],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
