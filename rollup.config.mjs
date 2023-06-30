import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";
import postcss from "rollup-plugin-postcss";
import packageJson from "./package.json" assert { type: "json" };

export default [
  // The default configuration is meant to be used as a LIBRARY from node.
  // It bundles just our files and the three.js examples because those are not properly
  // packaged for node by three.js
  // If you want a stand alone build then use the smbDisplay.js output below
  {
    input: "src/index.ts",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      commonjs(),
      resolve({
        // resolve and bundle the three examples
        modulePaths: ['node_modules/three/examples/jsm/']
      }),
      typescript(),
      postcss(),
    ],
    external: ['three', 'react', 'react-dom'] // do not bundle these
  },
  // The full stand alone bundle output. Minified.
  // With three.js and production react build.
  // No cjs, we don't expect this to run in node.
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.exports['./smbDisplay'].import,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      // to produce a production react build.
      replace({ 'process.env.NODE_ENV': JSON.stringify('production'), preventAssignment:true}),
      commonjs(),
      resolve(), // nothing is external everything is resolve() - ed by this one
      typescript({inlineSources: true}),
      postcss(),
      terser(), // minify the bundle
    ],
  },
  {
    input: "dist/esm/build/types/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "esm" }],
    plugins: [dts()],
    external: [/\.css$/u],
  },
];
