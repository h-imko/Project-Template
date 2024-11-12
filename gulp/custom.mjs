import fs from "fs"
import rename from "gulp-rename"
import path from "path"
import { changeExt, transform } from "./service.mjs"
import ejs from "ejs"
import { argv, bs, convertingImgTypes, gulpMem } from "./env.mjs"
import sharp from "sharp"
import wawoff2 from "wawoff2"
import Vinyl from "vinyl"


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
						callback(null, chunk)
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
			html = html.replaceAll(".scss", ".css").replaceAll(".ejs", ".html")
			chunk.path = chunk.path.replace(chunk.extname, ".html")
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

				if (argv.ram) {
					gulpMem.fs.unlinkSync(path.relative(chunk.cwd, chunk.path).replace("src", "/build").replaceAll(path.sep, path.posix.sep))
				}
			}

			callback(null, chunk)
		} catch (error) {
			callback(error, chunk)
		}
	})
}

function iconsToCSS() {
	return transform((chunk, encoding, callback) => {
		let name = chunk.relative.replaceAll(path.sep, "_").replace(/\.[^/.]+$/, "").replaceAll(" ", "-")
		let css = `.icon--${name}, %icon--${name}{--mask: url(/src/assets/static/img/icon/stack.svg#${name});}`
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
 * @param {boolean} inSrc 
 * @param {...[string, string]} replaces 
 */
function getDestPath(inSrc, ...replaces) {
	/**
	 * @param {Vinyl} chunk 
	 */
	return function (chunk) {
		let newpath = chunk.path.replaceAll(path.sep, path.posix.sep).replace("src", "")

		replaces.forEach(pair => {
			newpath = newpath.replace(pair[0], pair[1])
		})

		chunk.base = "./"
		chunk.path = newpath

		return inSrc ? "./src" : "./build"
	}
}


export { ext, newer, replace, reload, replaceSrc, clean, ejsCompile, removeExcess, iconsToCSS, ttfToWoff, sharpWebp, getDestPath }