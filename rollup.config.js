import { nodeResolve } from '@rollup/plugin-node-resolve';
import { visualizer } from "rollup-plugin-visualizer";
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'dist/fetch-github-folder.js',
  output: {
    dir: 'dist/minified',
    format: 'es',
    compact: true
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    terser(),
    visualizer({
      sourcemap: "true",
      filename: "report/bundled_deps/index.html",
    })
  ],
};
