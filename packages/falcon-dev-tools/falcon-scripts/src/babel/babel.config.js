const nodeEnv = process.env.NODE_ENV;
const rollupCjsBuild = process.env.ROLLUP !== undefined;

const testPlugins =
  nodeEnv === 'test'
    ? [
        require.resolve('@babel/plugin-transform-react-jsx-source'), // Adds component stack to warning messages
        require.resolve('babel-plugin-dynamic-import-node'), // Compiles import() to a deferred require()
        [require.resolve('@babel/plugin-transform-modules-commonjs'), { loose: true }] // Transform ES modules to commonjs for Jest support
      ]
    : [];

module.exports = {
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        modules: false,
        loose: true,
        targets: 'defaults'
      }
    ],
    require.resolve('@babel/preset-typescript'),
    require.resolve('@babel/preset-react')
  ],
  plugins: [
    require.resolve('babel-plugin-graphql-tag'),
    require.resolve('@babel/plugin-proposal-class-properties'),
    [require.resolve('@babel/plugin-transform-runtime'), { useESModules: !(rollupCjsBuild || nodeEnv === 'test') }],
    [require.resolve('@babel/plugin-proposal-object-rest-spread'), { loose: true, useBuiltIns: true }],
    require.resolve('babel-plugin-annotate-pure-calls'),
    ...testPlugins
  ].filter(Boolean)
};
