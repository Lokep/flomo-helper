import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,

  name: pkg.name,

  version: pkg.version,

  icons: {
    48: 'public/logo.png',
  },

  // 后台服务 Worker
  background: {
    service_worker: 'src/background/main.ts',
    type: 'module',
  },

  action: {
    default_icon: {
      48: 'public/logo.png',
    },
  },

  content_scripts: [{
    js: ['src/content/main.ts'],
    matches: [
      // 'https://*/*',
      'https://*.flomoapp.com/*',
      'https://weread.qq.com/*' ,
      'https://x.com/*'
    ],
  }],

  permissions: [
    'storage',
    'tabs',
    'activeTab',
    'scripting',
    // 'contextMenus',
    // 'clipboardWrite',
    // 'clipboardRead',
  ],
})
