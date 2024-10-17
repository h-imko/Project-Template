import fs from "fs"
import rename from "gulp-rename"
import path from "path"
import { changeExt, transform } from "./service.mjs"
import ejs from "ejs"
import esbuild from "esbuild"
import { sassPlugin } from "esbuild-sass-plugin"
import { bs, argv, convertingImgTypes } from "./env.mjs"
import sharp from "sharp"
import wawoff2 from "wawoff2"
import Vinyl from "vinyl"
import { cwd } from "process"


/**
 * @type {esbuild.BuildContext} 
 */
let buildCSS
/**
 * @type {esbuild.BuildContext} 
 */
let buildJS

function ext(newExt, ...oldExt) {
	return rename((path) => {
		if (oldExt.includes(path.extname) || !oldExt.length) {
			path.extname = newExt
		}
	})
}

function newer(relatedTo, newExt, ...oldExt) {
	return transform((chunk, encoding, callback) => {
		let newPath = path.join(relatedTo, chunk.relative)

		if (newExt) {
			newPath = changeExt(newPath, newExt, ...oldExt)
		}

		fs.stat(newPath, function (relatedError, relatedStat) {
			callback(null, (relatedError || (relatedStat.mtime < chunk.stat.mtime)) ? chunk : null)
		})
	})
}

function sharpWebp() {
	return transform((chunk, encoding, callback) => {
		if (convertingImgTypes.includes(chunk.extname)) {
			sharp(chunk.contents)
				.resize({
					fit: "inside",
					width: 2000,
					height: 2000,
					withoutEnlargement: true
				})
				.webp({
					effort: 6,
					quality: 80
				})
				.toBuffer((error, buffer) => {
					if (error) {
						error.cause = chunk.path
						callback(error, chunk)
					} else {
						chunk.contents = buffer
						callback(error, chunk)
					}
				})
		} else {
			callback(null, chunk)
		}
	})
}

function replace(searchValue, repaceValue) {
	return transform((chunk, encoding, callback) => {
		chunk.contents = Buffer.from(chunk.contents.toString(encoding).replaceAll(searchValue, repaceValue), encoding)
		callback(null, chunk)
	})
}

function reload() {
	return transform((chunk, encoding, callback) => {
		bs.reload()
		callback(null, chunk)
	})
}

function replaceSrc() {
	return replace("/src/", "/")
}

function clean() {
	return transform((chunk, encoding, callback) => {
		fs.rm(chunk.path, {
			recursive: true,
			force: true
		}, (error) => {
			callback(error, chunk)
		})
	})
}

function ejsCompile() {
	return transform((chunk, encoding, callback) => {
		ejs.renderFile(chunk.path, {}, {
			root: path.join(chunk.cwd, "src", "assets", "ejs"),
		}).then(html => {
			chunk.contents = Buffer.from(html, encoding)
			callback(null, chunk)
		}).catch(error => {
			callback(error, chunk)
		})
	})
}

function removeExcess(src, dest, ...extraExts) {
	return transform((chunk, encoding, callback) => {
		try {
			let exists = [chunk.extname, ...extraExts].some(ext => {
				return fs.existsSync(changeExt(chunk.path, ext).replace(`${path.sep}${dest}${path.sep}`, `${path.sep}${src}${path.sep}`))
			})

			if (!exists) {
				fs.rmSync(chunk.path)
			}

			callback(null, chunk)
		} catch (error) {
			callback(error, chunk)
		}
	})
}

function sassCompile() {
	return transform(async (chunk, encoding, callback) => {
		buildCSS ??= await esbuild.context({
			sourcemap: "linked",
			entryPoints: [chunk.path],
			minify: true,
			write: false,
			logLevel: "silent",
			outfile: `./build/${path.relative("./src/", chunk.path)}`,
			plugins: [sassPlugin({
				embedded: true,
				style: "compressed",
				precompile(source) {
					return source.replaceAll("/src/", "/")
				},
			})]
		})
		buildCSS.rebuild().then(result => {
			for (const file of result.outputFiles) {
				if (file.path.endsWith(".map")) {
					Object.assign(chunk.sourceMap, JSON.parse(file.text))
					chunk.sourceMap.file = path.basename(chunk.path).replace(".scss", ".css")
				} else {
					chunk.contents = Buffer.from(file.contents)
					chunk.extname = ".css"
				}
			}
			callback(null, chunk)
		}).catch(error => {
			callback(error, chunk)
		})
	})
}

function jsCompile() {
	return transform(async (chunk, encoding, callback) => {
		buildJS ??= await esbuild.context({
			bundle: true,
			minify: argv.min,
			logLevel: "silent",
			entryPoints: [chunk.path],
			drop: argv.min ? ["console", "debugger"] : [],
			treeShaking: true,
			sourcemap: argv.min ? false : "linked",
			write: false,
			outfile: `./build/${path.relative("./src/", chunk.path)}`,
		})

		buildJS.rebuild().then(result => {
			for (const file of result.outputFiles) {
				if (file.path.endsWith(".map")) {
					Object.assign(chunk.sourceMap, JSON.parse(file.text))
					chunk.sourceMap.file = path.basename(chunk.path)
				} else {
					chunk.contents = Buffer.from(file.contents)
				}
			}
			callback(null, chunk)
		}).catch(error => {
			callback(error, chunk)
		})
	})
}

function iconsToCSS() {
	return transform((chunk, encoding, callback) => {
		let name = chunk.relative.replaceAll(path.sep, '_').replace(/\.[^/.]+$/, "").replaceAll(" ", '-')
		let css = `.icon--${name}{--mask: url(/src/assets/static/img/icon/stack.svg#${name});}%icon--${name}{--mask: url(/src/assets/static/img/icon/stack.svg#${name}) }`
		callback(null, css)
	})
}

function ttfToWoff() {
	return transform((chunk, encoding, callback) => {
		wawoff2.compress(chunk.contents).then(woff => {
			chunk.contents = Buffer.from(woff)
			callback(null, chunk)
		})
	})
}

/**
 * @param {Vinyl} chunk 
 */
function getDestPath(chunk) {
	let destPath = chunk.base.replace("\\src", "\\build").replace("\\img-raw", "\\img").replace(cwd(), ".\\")
	return destPath
}

function cleanESBuild(callback) {
	buildCSS.dispose()
	buildJS.dispose()
	callback()
}

export { ext, newer, replace, reload, replaceSrc, clean, ejsCompile, removeExcess, sassCompile, iconsToCSS, ttfToWoff, sharpWebp, jsCompile, cleanESBuild, getDestPath }