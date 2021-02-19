const copy = require('rollup-plugin-copy')

module.exports = {
  rollup(config) {
    config.plugins.push(
      copy({
        targets: [{ src: 'src/contracts/*', dest: 'dist/contracts' }],
      })
    )
    return config
  },
}
