import browserSync from "browser-sync"
import fs from "fs"
import gulp from "gulp"
import autoPrefixer from "gulp-autoprefixer"
import Imagemin, {
	svgo, mozjpeg
} from "gulp-imagemin"
import gulpMemory from "gulp-mem"
import sourcemaps from "gulp-sourcemaps"
import pngquant from "imagemin-pngquant"
import path from "path"
import sass from "sass"
import esbuild from "gulp-esbuild"
import ttf2woff2 from "ttf2woff2"
import stream from "stream"
import { stacksvg } from "gulp-stacksvg"
import ejs from "ejs"
import { cwd } from "process"

const gulpMem = new gulpMemory(),
	argv = getArgs(),
	currentGulp = argv.ram ? gulpMem : gulp,
	bs = browserSync.create()

gulpMem.logFn = null
gulpMem.serveBasePath = "./build"

ejs.fileLoader = function (filePath) {
	return fs.readFileSync(filePath.replace(/^(\w:\\src\\|\/src\/)/, `${cwd()}${path.sep}src${path.sep}`))
}

const pathTransform = {
	toPosix: (pathString) => `${pathString}`.split(path.sep).join(path.posix.sep),
	ext: (file, newExt) => path.join(path.dirname(file), path.basename(file, path.extname(file)) + newExt)
}

function getArgs() {
	return process.argv.slice(2).reduce(function (acc, curr) {
		return { ...acc, [curr.replace("--", "")]: true }
	}, {})
}

function nothing(callback = () => { }) {
	callback()
	return new stream.PassThrough({
		readableObjectMode: true,
		writableObjectMode: true
	})
}

function ejsCompile() {
	return new stream.Transform({
		writableObjectMode: true,
		readableObjectMode: true,
		transform(chunk, encoding, callback) {
			ejs.renderFile(chunk.path).then(html => {
				chunk.contents = Buffer.from(html, encoding)
				chunk.path = pathTransform.ext(chunk.path, ".html")
				callback(null, chunk)
			})
		}
	})
}

function clean() {
	return new stream.Transform({
		readableObjectMode: true,
		writableObjectMode: true,
		transform(chunk, encoding, callback) {
			fs.rm(chunk.path, {
				recursive: true,
				force: true
			}, callback)
		}
	})
}

function replace(searchValue, repaceValue) {
	return new stream.Transform({
		writableObjectMode: true,
		readableObjectMode: true,
		transform(chunk, encoding, callback) {
			chunk.contents = Buffer.from(chunk.contents.toString(encoding).replaceAll(searchValue, repaceValue), encoding)
			callback(null, chunk)
		}
	})
}

function repaceSrc() {
	return replace("/src/", "/")
}

function newer(relatedTo) {
	return new stream.Transform({
		readableObjectMode: true,
		writableObjectMode: true,
		transform(chunk, encoding, callback) {
			fs.stat(path.join(relatedTo, path.relative(chunk.base, chunk.path)), function (relatedError, relatedStat) {
				callback(null, (relatedError || (relatedStat.mtime < chunk.stat.mtime)) ? chunk : null)
			})
		}
	})
}

function sassCompile() {
	return new stream.Transform({
		writableObjectMode: true,
		readableObjectMode: true,
		transform(chunk, encoding, callback) {
			try {
				let compiled = sass.compileString(chunk.contents.toString(encoding), {
					sourceMap: true,
					sourceMapIncludeSources: true,
					style: argv.min ? "compressed" : "expanded",
					loadPaths: ["node_modules", chunk.base]
				})
				chunk.contents = Buffer.from(compiled.css, encoding)
				chunk.path = pathTransform.ext(chunk.path, ".css")
				Object.assign(chunk.sourceMap, compiled.sourceMap)
				chunk.sourceMap.file = path.basename(chunk.path)
				callback(null, chunk)
			}
			catch (error) {
				callback(error, chunk)
			}
		}
	})
}

function browserSyncInit() {
	bs.init({
		server: {
			baseDir: "./build",
			middleware: argv.ram ? gulpMem.middleware : false,
		},
		port: 3000
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
				printPaintedMessage(error.message, "Sass")
				bs.notify("SASS Error")
				this.emit("end")
			}))
		.pipe(autoPrefixer({
			cascade: false,
			flexbox: false,
		}))
		.pipe(repaceSrc())
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
		.pipe(repaceSrc())
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
		.pipe(repaceSrc())
		.pipe(currentGulp.dest("./build"))
		.pipe(bs.stream())
}

function copyStatic() {
	return gulp.src(["./src/assets/static/**/*", "!./src/assets/static/img-raw/**/*"], {
		allowEmpty: true,
		since: gulp.lastRun(copyStatic)
	})
		.pipe(currentGulp.dest("./build/assets/static/"))
		.pipe(new stream.PassThrough({
			readableObjectMode: true,
			writableObjectMode: true,
			transform(chunk, encoding, callback) {
				bs.reload()
				callback(null, chunk)
			}
		}))
}

function makeIconsSCSS() {
	return gulp.src("./src/assets/static/img-raw/icon/**/*.svg", {
		allowEmpty: true,
		read: false
	})
		.pipe(new stream.Transform({
			readableObjectMode: true,
			writableObjectMode: true,
			transform(chunk, encoding, callback) {
				let name = path.relative(chunk.base, chunk.path).replaceAll(path.sep, '__').replace(/\.[^/.]+$/, "").replaceAll(" ", '-')
				let css = `.icon--${name},%icon--${name}{mask-image: url(/src/assets/static/img/icon/stack.svg#${name});}`
				callback(null, css)
			}
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

function imagemin() {
	return gulp.src("./src/assets/static/img-raw/**/*", {
		allowEmpty: true
	})
		.pipe(newer("./src/assets/static/img/"))
		.pipe(Imagemin([
			svgo(),
			mozjpeg(),
			pngquant(),
		]))
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
		.pipe(new stream.Transform({
			writableObjectMode: true,
			readableObjectMode: true,
			transform(chunk, encoding, callback) {
				fs.createWriteStream(pathTransform.ext(chunk.path, ".woff2"), {
					autoClose: true
				}).write(ttf2woff2(chunk.contents))
				fs.rm(chunk.path, callback)
			}
		}))
}

function cleanInitials() {
	return gulp.src("./src/**/.placeholder", {
		allowEmpty: true,
		read: false
	})
		.pipe(clean())
}

function watch() {
	gulp.watch(["./src/**/*.html", "./src/**/*.ejs"], html)
	gulp.watch(["./src/assets/script/**/*"], js)
	gulp.watch(["./src/assets/style/**/*"], css)
	gulp.watch("./src/assets/static/img-raw/icon/**/*.svg", {
		events: ["add", "unlink", "unlinkDir"]
	}, gulp.parallel(makeIconsStack, makeIconsSCSS))
	gulp.watch("./src/assets/static/img-raw/**/*", imagemin)
	gulp.watch(["./src/assets/static/**/*", "!./src/assets/static/img-raw/**/*"], copyStatic)
}

export default gulp.series(
	gulp.parallel(
		argv.ram ? nothing : cleanBuild,
		imagemin,
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

export { imagemin, ttfToWoff, cleanInitials }