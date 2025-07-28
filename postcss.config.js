module.exports = {
  plugins: {
    'tailwindcss': {},
    'postcss-preset-env': {
      // Enable modern CSS features
      stage: 1,
      features: {
        'nesting-rules': true,
        'custom-media-queries': true,
        'media-query-ranges': true,
      },
      // Target modern browsers
      browsers: 'last 2 versions',
    },
    'autoprefixer': {},
  },
}
