import { defineConfig, mergeConfig } from 'vite'
import player from './vite.player.config.ts'
export default mergeConfig(player, defineConfig({
  build: { outDir: '.single-build', assetsInlineLimit: 20 * 1024 * 1024, cssCodeSplit: false, rolldownOptions: { output: { codeSplitting: false } } },
}))
