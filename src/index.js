import { Parser } from 'acorn';
import acornJsx from 'acorn-jsx';
import Program from './program/Program.js';
import { features, matrix } from './support.js';
import getSnippet from './utils/getSnippet.js';

const parser = Parser.extend(acornJsx());

const dangerousTransforms = ['dangerousTaggedTemplateString', 'dangerousForOf'];

export function transform(source, options = {}) {
	let ast;
	let jsx = null;

	try {
		ast = parser.parse(source, {
			ecmaVersion: 10,
			preserveParens: true,
			sourceType: 'module',
			allowAwaitOutsideFunction: true,
			allowReturnOutsideFunction: true,
			allowHashBang: true,
			onComment: (block, text) => {
				if (!jsx) {
					const match = /@jsx\s+([^\s]+)/.exec(text);
					if (match) jsx = match[1];
				}
			}
		});
		options.jsx = jsx || options.jsx;
	} catch (err) {
		err.snippet = getSnippet(source, err.loc);
		err.toString = () => `${err.name}: ${err.message}\n${err.snippet}`;
		throw err;
	}

	const transforms = {};
	Object.keys(options.transforms || {}).forEach(name => {
		if (name === 'modules') {
			if (!('moduleImport' in options.transforms))
				transforms.moduleImport = options.transforms.modules;
			if (!('moduleExport' in options.transforms))
				transforms.moduleExport = options.transforms.modules;
			return;
		}

		if (!(name in transforms)) throw new Error(`Unknown transform '${name}'`);
		transforms[name] = options.transforms[name];
	});
	if (options.objectAssign === true) options.objectAssign = 'Object.assign';
	return new Program(source, ast, transforms, options).export(options);
}

export { version as VERSION } from '../package.json';
