import fs from "fs"
import rename from "gulp-rename"
import path from "path"
import { changeExt, transform } from "./service.mjs"
import ejs from "ejs"
import * as sass from "sass"
import { bs, argv, convertingImgTypes } from "./env.mjs"
import sharp from "sharp"
import wawoff2 from "wawoff2"

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
			beautify: false,
			compileDebug: argv.min ?? false,
		}).then(html => {
			chunk.contents = Buffer.from(html, encoding)
			callback(null, chunk)
		}).catch(error => {
			callback(new Error(error.message, {
				cause: chunk.path
			}), chunk)
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
	return transform((chunk, encoding, callback) => {
		try {
			let compiled = sass.compileString(chunk.contents.toString(encoding), {
				sourceMap: true,
				sourceMapIncludeSources: true,
				style: argv.min ? "compressed" : "expanded",
				loadPaths: ["node_modules", chunk.base]
			})
			chunk.contents = Buffer.from(compiled.css, encoding)
			Object.assign(chunk.sourceMap, compiled.sourceMap)
			chunk.sourceMap.file = path.basename(chunk.path)
			callback(null, chunk)
		}
		catch (error) {
			callback(new Error(error.message, {
				cause: chunk.path
			}), chunk)
		}
	})
}

function iconsToCSS() {
	return transform((chunk, encoding, callback) => {
		let name = chunk.relative.replaceAll(path.sep, '__').replace(/\.[^/.]+$/, "").replaceAll(" ", '-')
		let css = `.icon--${name}{mask-image: url(/src/assets/static/img/icon/stack.svg#${name});}`
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

export { ext, newer, replace, reload, replaceSrc, clean, ejsCompile, removeExcess, sassCompile, iconsToCSS, ttfToWoff, sharpWebp }