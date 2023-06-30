import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';

export default [
  {
    input: 'index.tsx',
    output: [
      {
        file: 'bundle.js',
        format: 'umd',
        sourcemap: true,
      },
    ],
    plugins: [
      commonjs(),
      resolve(),
      typescript(), 
      replace({ 'process.env.NODE_ENV': JSON.stringify('development'), preventAssignment:true}),
    ]
  }
]