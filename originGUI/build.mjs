import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import esbuild from "esbuild";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import * as sass from "sass";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(rootDir, "src");
const distDir = path.join(rootDir, "dist");
const bundlePath = path.join(distDir, "bundle.js");

async function collectSourceFiles (directory) {
	const entries = await fs.promises.readdir(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const absolutePath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			files.push(...await collectSourceFiles(absolutePath));
			continue;
		}

		if (!entry.isFile()) {
			continue;
		}

		if ((entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) && !entry.name.endsWith(".d.ts")) {
			files.push(absolutePath);
		}
	}

	return files;
}

function createScssPlugin () {
	return {
		name: "origingui-scss",
		setup (build) {
			build.onLoad({ filter: /\.s[ac]ss$/i }, async args => {
				const result = sass.compile(args.path, {
					style: "expanded",
				});

				const processed = await postcss([autoprefixer]).process(result.css, {
					from: args.path,
				});

				return {
					contents: `(() => {
const css = ${JSON.stringify(processed.css)};
const styleId = "origingui-styles";
const style = document.getElementById(styleId) || document.createElement("style");

style.id = styleId;
style.textContent = css;

if (!style.parentNode) {
	document.head.appendChild(style);
}
})();`,
					loader: "js",
				};
			});
		}
	};
}

function toImportPath (filePath) {
	return `./${path.relative(rootDir, filePath).split(path.sep).join("/")}`;
}

export async function buildBundle ({ mode = "production" } = {}) {
	await fs.promises.mkdir(distDir, { recursive: true });

	const sourceFiles = await collectSourceFiles(srcDir);
	const indexPath = path.join(srcDir, "index.ts");
	const orderedFiles = [
		indexPath,
		...sourceFiles.filter(filePath => filePath !== indexPath),
	];
	const entrySource = orderedFiles.map(filePath => `import ${JSON.stringify(toImportPath(filePath))};`).join("\n");

	await esbuild.build({
		stdin: {
			contents: entrySource,
			resolveDir: rootDir,
			sourcefile: "origingui-entry.ts",
			loader: "ts",
		},
		bundle: true,
		format: "iife",
		platform: "browser",
		target: ["es2022"],
		outfile: bundlePath,
		minify: mode === "production",
		sourcemap: mode === "development",
		legalComments: "none",
		charset: "utf8",
		define: {
			"process.env.NODE_ENV": JSON.stringify(mode),
		},
		plugins: [createScssPlugin()],
		logLevel: "info",
	});
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
	const mode = process.argv.includes("--development") || process.argv.includes("--mode=development") ? "development" : "production";
	await buildBundle({ mode });
}