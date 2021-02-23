const copy = require('rollup-plugin-copy')

module.exports = {
  rollup(config) {
    config.plugins.push(
      copy({
        targets: [{ src: './src/tokens/*', dest: './dist/tokens' }],
      })
    )
    return config
  },
}
