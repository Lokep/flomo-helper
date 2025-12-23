// eslint.config.mjs
import antfu from '@antfu/eslint-config'

export default antfu({
  // 可选配置：开启/关闭某些规则，比如指定 vue 版本、是否用 TypeScript 等
  vue: true,
  typescript: true,
  // 若需要自定义 Prettier 规则，通过此处配置（无需单独的 .prettierrc）
  formatters: {
    /**
     * @antfu/eslint-config 的 Prettier 配置在这里定义
     * 覆盖默认的 Prettier 规则，和你之前的需求对应
     */
    prettier: {
      printWidth: 100,
      semi: false,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
    },
  },
})
