import browserSync from "browser-sync"
import fs from "fs"
import gulp from "gulp"
import autoPrefixer from "gulp-autoprefixer"
import imagemin from "gulp-imagemin"
import gulpMemory from "gulp-mem"
import sourcemaps from "gulp-sourcemaps"
import webp from "imagemin-webp"
import path from "path"
import * as sass from "sass"
import esbuild from "gulp-esbuild"
import ttf2woff2 from "ttf2woff2"
import stream from "stream"
import { stacksvg } from "gulp-stacksvg"
import ejs from "ejs"
import Vinyl from "vinyl"
import { cwd } from "process"
import rename from "gulp-rename"

const gulpMem = new gulpMemory(),
	argv = getArgs(),
	currentGulp = argv.ram ? gulpMem : gulp,
	bs = browserSync.create(),
	convertingImgTypes = [".png", ".jpg", ".jpeg", ".webp"]

gulpMem.logFn = null
gulpMem.serveBasePath = "./build"

function changeExt(fileName, newExt, ...oldExt) {
	let pathObject = path.parse(fileName)
	let currExt = pathObject.ext
	return path.format({ ...pathObject, base: '', ext: oldExt.includes(currExt) ? newExt : oldExt.length ? currExt : newExt })
}

function getArgs() {
	return process.argv.slice(2).reduce(function (acc, curr, index, array) {
		if (curr.startsWith("--")) {
			return Object.assign(acc, { [curr.replace("--", "")]: (!array[index + 1] || array[index + 1]?.startsWith("--")) ? true : array[index + 1] })
		}
		else {
			return acc
		}
	}, {})
}
/**
 * 
 * @param {function(Vinyl, BufferEncoding, stream.TransformCallback): void } func 
 * @returns stream.Transform
 */
function transform(func) {
	return new stream.Transform({
		readableObjectMode: true,
		writableObjectMode: true,
		transform: func
	})
}

function nothing(callback = () => { }) {
	callback()
	return new stream.PassThrough({
		readableObjectMode: true,
		writableObjectMode: true
	})
}

function ejsCompile() {
	return transform((chunk, encoding, callback) => {
		ejs.renderFile(chunk.path, {}, {
			root: path.join(cwd(), "src", "assets", "ejs"),
			beautify: false,
			compileDebug: argv.min ?? false,
		}).then(html => {
			chunk.contents = Buffer.from(html, encoding)
			callback(null, chunk)
		}).catch(error => {
			callback(error, chunk)
		})
	})
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

function replace(searchValue, repaceValue) {
	return transform((chunk, encoding, callback) => {
		chunk.contents = Buffer.from(chunk.contents.toString(encoding).replaceAll(searchValue, repaceValue), encoding)
		callback(null, chunk)
	})
}

function replaceSrc() {
	return replace("/src/", "/")
}

function cleanExtraImgs() {
	return gulp.src([`./src/assets/static/img/**/*`, `!./src/assets/static/img/icon/stack.svg`], {
		allowEmpty: true,
		read: false,
		nodir: true
	})
		.pipe(transform((chunk, encoding, callback) => {
			try {
				let exists = [chunk.extname, ...convertingImgTypes].some(ext => {
					return fs.existsSync(changeExt(chunk.path, ext).replace(`${path.sep}img${path.sep}`, `${path.sep}img-raw${path.sep}`))
				})

				if (!exists) {
					fs.rmSync(chunk.path)
				}

				callback(null, chunk)
			} catch (error) {
				callback(error, chunk)
			}
		}))
}

function newer(relatedTo, newExt, ...oldExt) {
	return transform((chunk, encoding, callback) => {
		let newPath = path.join(relatedTo, path.relative(chunk.base, chunk.path))

		if (newExt) {
			newPath = changeExt(newPath, newExt, ...oldExt)
		}

		fs.stat(newPath, function (relatedError, relatedStat) {
			callback(null, (relatedError || (relatedStat.mtime < chunk.stat.mtime)) ? chunk : null)
		})
	})
}

function ext(newExt, ...oldExt) {
	return rename((path) => {
		if (oldExt.includes(path.extname) || !oldExt.length) {
			path.extname = newExt
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
		}
		catch (err) {
			var error = err
			error.fileName = path.relative(cwd(), chunk.path)
		}
		callback(error, chunk)
	})
}

function browserSyncInit() {
	bs.init({
		server: {
			baseDir: "./build",
			middleware: argv.ram ? gulpMem.middleware : false,
		},
		port: argv.port ?? 3000
	})
}

function printPaintedMessage(message, module) {
	let errs = [...message.matchAll(new RegExp(/(?:[A-Za-z]+:*\\[а-яА-Яa-zA-Z-_.\\/]+)|('[а-яА-Яa-zA-Z-_.\\/]+')/gm))]
		.map(function (curr) {
			return {
				text: curr[0],
				index: curr.index,
				length: curr[0].length
			}
		})
		.reverse()
	message = message.split("")
	errs.forEach(item => {
		message.splice(item.index, item.length, "\x1b[0m", '\x1b[35m', item.text, "\x1b[0m")
	})
	console.log(`[\x1b[31m${module}\x1b[0m] ${message.join("")}`)
}

function css() {
	return gulp.src(["./src/assets/style/**/*.scss", "!./src/assets/style/**/_*.scss"])
		.pipe(sourcemaps.init())
		.pipe(sassCompile()
			.on("error", function (error) {
				printPaintedMessage(`${error.fileName} ${error.message}`, "SASS")
				bs.notify("SASS Error")
				this.emit("end")
			}))
		.pipe(ext(".css"))
		.pipe(autoPrefixer({
			cascade: false,
			flexbox: false,
		}))
		.pipe(replaceSrc())
		.pipe(sourcemaps.write("./"))
		.pipe(currentGulp.dest("./build/assets/style/"))
		.pipe(bs.stream())
}

function js() {
	return gulp.src(["./src/assets/script/**/*.js", "!./src/assets/script/**/_*.js"])
		.pipe(sourcemaps.init())
		.pipe(esbuild({
			bundle: true,
			minify: argv.min,
			drop: argv.min ? ["console", "debugger"] : [],
			treeShaking: true,
			sourcemap: argv.min ? false : "linked"
		})
			.on("error", function (error) {
				printPaintedMessage(error.message, "JS")
				bs.notify("JS Error")
				this.emit("end")
			})
		)
		.pipe(replaceSrc())
		.pipe(sourcemaps.write("./"))
		.pipe(currentGulp.dest("./build/assets/script/"))
		.pipe(bs.stream())
}

function html() {
	return gulp.src(["./src/*.ejs", "./src/*.html"])
		.pipe(ejsCompile()
			.on("error", function (error) {
				printPaintedMessage(`${error.fileName} ${error.message}`, "EJS")
				bs.notify("EJS Error")
				this.emit("end")
			})
		)
		.pipe(ext(".html"))
		.pipe(replace(".scss", ".css"))
		.pipe(replaceSrc())
		.pipe(currentGulp.dest("./build"))
		.pipe(bs.stream())
}

function copyStatic() {
	return gulp.src(["./src/assets/static/**/*", "!./src/assets/static/img-raw/**/*"], {
		allowEmpty: true,
		since: gulp.lastRun(copyStatic),
		nodir: true
	})
		.pipe(currentGulp.dest("./build/assets/static/"))
		.pipe(transform((chunk, encoding, callback) => {
			bs.reload()
			callback(null, chunk)
		}))
}

function makeIconsSCSS() {
	return gulp.src("./src/assets/static/img-raw/icon/**/*.svg", {
		allowEmpty: true,
		read: false
	})
		.pipe(transform((chunk, encoding, callback) => {
			let name = path.relative(chunk.base, chunk.path).replaceAll(path.sep, '__').replace(/\.[^/.]+$/, "").replaceAll(" ", '-')
			let css = `.icon--${name}{mask-image: url(/src/assets/static/img/icon/stack.svg#${name});}`
			callback(null, css)
		}))
		.pipe(fs.createWriteStream("./src/assets/style/_icons.scss"))
}

function makeIconsStack() {
	return gulp.src(`./src/assets/static/img-raw/icon/**/*.svg`)
		.pipe(stacksvg({
			separator: "__"
		}))
		.pipe(gulp.dest(`./src/assets/static/img/icon/`))
}

function imageMin() {
	return gulp.src("./src/assets/static/img-raw/**/*", {
		allowEmpty: true,
		nodir: true
	})
		.pipe(newer("./src/assets/static/img/", ".webp", ...convertingImgTypes))
		.pipe(imagemin([webp({ method: 6 })]))
		.pipe(ext(".webp", ...convertingImgTypes))
		.pipe(gulp.dest("./src/assets/static/img/"))
}

function cleanBuild() {
	return gulp.src("./build/", {
		read: false,
		allowEmpty: true
	})
		.pipe(clean())
}

function ttfToWoff() {
	return gulp.src("./src/assets/static/font/**/*.ttf")
		.pipe(transform((chunk, encoding, callback) => {
			fs.createWriteStream(changeExt(chunk.path, ".woff2"), {
				autoClose: true
			}).write(ttf2woff2(chunk.contents))
			fs.rm(chunk.path, callback)
		}))
}

function cleanInitials() {
	return gulp.src("./src/**/.gitkeep", {
		allowEmpty: true,
		read: false
	})
		.pipe(clean())
}

function watch() {
	gulp.watch(["./src/**/*.html", "./src/**/*.ejs"], html)
	gulp.watch(["./src/assets/script/**/*"], js)
	gulp.watch(["./src/assets/style/**/*"], css)
	gulp.watch(["./src/assets/static/img-raw/icon/**/*.svg"], gulp.parallel(makeIconsStack, makeIconsSCSS))
	gulp.watch(["./src/assets/static/img-raw/"], gulp.parallel(imageMin, cleanExtraImgs))
	gulp.watch(["./src/assets/static/**/*", "!./src/assets/static/img-raw/**/*"], copyStatic)
}

export default gulp.series(
	gulp.parallel(
		argv.ram ? nothing : cleanBuild,
		imageMin,
		cleanExtraImgs,
		makeIconsSCSS,
		makeIconsStack
	), gulp.parallel(
		copyStatic,
		css,
		js,
		html
	), argv.fwatch ? gulp.parallel(
		watch,
		browserSyncInit
	) : nothing
)

export { imageMin, ttfToWoff, cleanInitials }