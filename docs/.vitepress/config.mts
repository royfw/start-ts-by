import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'start-ts-by',
  description: 'Scaffold TypeScript projects with templates.',
  base: process.env.VITEPRESS_BASE || '/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Registry', link: '/registry' },
      { text: 'Development', link: '/development' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'README', link: '/README' },
          { text: 'README (中文)', link: '/README.zh-TW' },
        ],
      },
      {
        text: 'Documentation',
        items: [
          { text: 'Registry System', link: '/registry' },
          { text: 'Development', link: '/development' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/royfw/start-ts-by' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/start-ts-by' },
    ],
  },
});
