import svelte from 'rollup-plugin-svelte';
import preprocess from 'svelte-preprocess';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import image from '@rollup/plugin-image';
import { terser } from 'rollup-plugin-terser';

export default {
	input: 'src/main.js',
	output: [
		{ file: 'dist/captcha.mjs', 'format': 'esm' },
		{ file: 'dist/captcha.js', 'format': 'umd', name: 'captcha' },
	],
	plugins: [
		svelte({
			compilerOptions: {
				customElement: true,
				dev: false,
			},
			preprocess: preprocess()
		}),

		resolve({
			browser: true,
			dedupe: ['svelte']
		}),

		image(),

		commonjs(),

		babel({
			babelHelpers: 'bundled',
			presets: ['@babel/preset-env']
		}),

		terser()
	]
};
