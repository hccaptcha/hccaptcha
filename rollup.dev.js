import svelte from 'rollup-plugin-svelte';
import preprocess from 'svelte-preprocess';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import image from '@rollup/plugin-image';
import livereload from 'rollup-plugin-livereload';

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

export default {
	input: 'src/main.js',
	output: {
		file: 'public/build/captcha.js',
		format: 'iife',
		name: 'captcha',
		sourcemap: true
	},
	plugins: [
		svelte({
			compilerOptions: {
				customElement: true,
				dev: true,
			},
			preprocess: preprocess()
		}),

		resolve({
			browser: true,
			dedupe: ['svelte']
		}),

		image(),

		commonjs(),

		serve(),

		livereload('public'),
	],
	watch: {
		clearScreen: false
	}
};
