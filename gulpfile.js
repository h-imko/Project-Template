import BrowserSync from "browser-sync"
import Fs from "fs"
import Gulp from "gulp"
import AutoPrefixer from "gulp-autoprefixer"
import Hb from "gulp-hb"
import Imagemin from "gulp-imagemin"
import GulpMem from "gulp-mem"
import Sourcemaps from "gulp-sourcemaps"
import Pngquant from "imagemin-pngquant"
import Path from "path"
import Sass from "sass"
import Esbuild from "gulp-esbuild"
import Ttf2woff2 from "ttf2woff2"
import Stream from "stream"

const gulpMem = new GulpMem(),
	argv = process.argv.slice(2).reduce(function (acc, curr) {
		return { ...acc, [curr.replace("--", "")]: true }
	}, {}), currentGulp = argv.ram ? gulpMem : Gulp

gulpMem.logFn = null
gulpMem.serveBasePath = "./build"

const tree = {
	build: {
		assets: {
			script: null,
			static: {
				font: null,
				img: null,
			},
			style: null,
		}
	},
	src: {
		assets: {
			hbs: null,
			script: null,
			static: {
				font: null,
				img: null,
				"img-raw": null,
			},
			style: null,
		}
	}
}

function getGlob(key, build = false, allOf = "", prefix = "", exclude = false) {
	let foundPath = []
	function keyExists(obj = build ? tree.build : tree.src) {
		if (!obj || (typeof obj !== "object" && !Array.isArray(obj))) {
			return false
		} else if (obj.hasOwnProperty(key)) {
			return true
		} else if (Array.isArray(obj)) {
			let parentKey = foundPath.length ? foundPath.pop() : ""
			for (let i = 0; i < obj.length; i++) {
				foundPath.push(`${parentKey}[${i}]`)
				const result = keyExists(obj[i], key)
				if (result) {
					return result
				}
				foundPath.pop()
			}
		} else {
			for (const k in obj) {
				foundPath.push(k)
				const result = keyExists(obj[k], key)
				if (result) {
					return result
				}
				foundPath.pop()
			}
		}
		return false
	}
	keyExists()
	foundPath = pathTransform.toPosix(Path.join(...foundPath, key))
	return `${exclude ? "!" : ""}./${build ? "build/" : "src/"}${foundPath}/${allOf ? `**/${prefix}*.${allOf}` : ""}`
}

const pathTransform = {
	toPosix: (pathString) => `${pathString}`.split(Path.sep).join(Path.posix.sep),
	ext: (file, newExt) => Path.join(Path.dirname(file), Path.basename(file, Path.extname(file)) + newExt)
}

function nothing(callback = () => { }) {
	callback()
	return new Stream.PassThrough({
		readableObjectMode: true,
		writableObjectMode: true
	})
}

function clean() {
	return new Stream.Transform({
		readableObjectMode: true,
		writableObjectMode: true,
		transform(chunk, encoding, callback) {
			Fs.rm(chunk.path, {
				recursive: true,
				force: true
			}, callback)
		}
	})
}

function replace(searchValue, repaceValue) {
	return new Stream.Transform({
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
	return new Stream.Transform({
		readableObjectMode: true,
		writableObjectMode: true,
		transform(chunk, encoding, callback) {
			Fs.stat(Path.join(relatedTo, Path.relative(chunk.base, chunk.path)), function (relatedError, relatedStat) {
				callback(null, (relatedError || (relatedStat.mtime < chunk.stat.mtime)) ? chunk : null)
			})
		}
	})
}

function sass() {
	return new Stream.Transform({
		writableObjectMode: true,
		readableObjectMode: true,
		transform(chunk, encoding, callback) {
			try {
				let compiled = Sass.compileString(chunk.contents.toString(encoding), {
					sourceMap: true,
					sourceMapIncludeSources: true,
					style: argv.min ? "compressed" : "expanded",
					loadPaths: ["node_modules", chunk.base]
				})
				chunk.contents = Buffer.from(compiled.css, encoding)
				chunk.path = pathTransform.ext(chunk.path, ".css")
				Object.assign(chunk.sourceMap, compiled.sourceMap)
				chunk.sourceMap.file = Path.basename(chunk.path)
				callback(null, chunk)
			}
			catch (error) {
				callback(error, chunk)
			}
		}
	})
}

function browserSyncInit() {
	BrowserSync.init({
		server: {
			baseDir: "./build",
			middleware: argv.ram ? gulpMem.middleware : false
		},
		port: 3000,
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
	return Gulp.src(["./src/assets/style/**/*.scss", "!./src/assets/style/**/_*.scss"])
		.pipe(Sourcemaps.init())
		.pipe(sass()
			.on("error", function (error) {
				printPaintedMessage(error.message, "Sass")
				BrowserSync.notify("SASS Error")
				this.emit("end")
			}))
		.pipe(AutoPrefixer({
			cascade: false,
			flexbox: false,
		}))
		.pipe(repaceSrc())
		.pipe(Sourcemaps.write("./"))
		.pipe(currentGulp.dest("./build/assets/style/"))
		.pipe(BrowserSync.stream())
}

function js() {
	return Gulp.src(["./src/assets/script/**/*.js", "!./src/assets/script/**/_*.js"])
		.pipe(Sourcemaps.init())
		.pipe(Esbuild({
			bundle: true,
			minify: argv.min,
			drop: argv.min ? ["console", "debugger"] : [],
			treeShaking: true,
			sourcemap: argv.min ? false : "linked"
		})
			.on("error", function (error) {
				printPaintedMessage(error.message, "JS")
				BrowserSync.notify("JS Error")
				this.emit("end")
			})
		)
		.pipe(repaceSrc())
		.pipe(Sourcemaps.write("./"))
		.pipe(currentGulp.dest("./build/assets/script/"))
		.pipe(BrowserSync.stream())
}

function html() {
	return Gulp.src(["./src/*.html"])
		.pipe(Hb()
			.partials('./src/assets/hbs/**/*.hbs').on("error", function (error) {
				printPaintedMessage(`${error.fileName} ${error.message}`, "HBS")
				BrowserSync.notify("HBS Error")
				this.emit("end")
			})
		)
		.pipe(repaceSrc())
		.pipe(currentGulp.dest("./build"))
		.pipe(BrowserSync.stream())
}

function copyStatic() {
	return Gulp.src(["./src/assets/static/**/*", "!./src/assets/static/img-raw/**/*"], {
		allowEmpty: true,
		since: Gulp.lastRun(copyStatic)
	})
		.pipe(currentGulp.dest("./build/assets/static/"))
		.pipe(BrowserSync.stream())
}

function makeIconsSCSS() {
	return Gulp.src("./src/assets/static/img-raw/icon/**/*.svg", {
		allowEmpty: true,
		read: false
	})
		.pipe(new Stream.Transform({
			readableObjectMode: true,
			writableObjectMode: true,
			transform(chunk, encoding, callback) {
				let relative = pathTransform.toPosix(Path.relative(chunk.base, chunk.path))
				let name = relative.replaceAll(Path.sep, '__')
				let target = relative.replace("/img-raw/", "/img/")
				let css = `.icon--${name},%icon--${name}{mask-image: url(/${target});}`
				callback(null, css)
			}
		}))
		.pipe(Fs.createWriteStream("./src/assets/style/_icons.scss"))
}

function imagemin() {
	return Gulp.src("./src/assets/static/img-raw/**/*", {
		allowEmpty: true
	})
		.pipe(newer("./src/assets/static/img/"))
		.pipe(Imagemin([
			Imagemin.svgo,
			Imagemin.mozjpeg,
			Imagemin.gifsicle,
			Pngquant(),
		]))
		.pipe(Gulp.dest("./src/assets/static/img/"))
}

function cleanBuild() {
	return Gulp.src("./build/", {
		read: false,
		allowEmpty: true
	})
		.pipe(clean())
}

function ttfToWoff() {
	return Gulp.src("./src/assets/static/font/**/*.ttf")
		.pipe(new Stream.Transform({
			writableObjectMode: true,
			readableObjectMode: true,
			transform(chunk, encoding, callback) {
				Fs.createWriteStream(pathTransform.ext(chunk.path, ".woff2"), {
					autoClose: true
				}).write(Ttf2woff2(chunk.contents))
				Fs.rm(chunk.path, callback)
			}
		}))
}

function cleanInitials() {
	return Gulp.src("./src/**/.placeholder", {
		allowEmpty: true,
		read: false
	})
		.pipe(clean())
}

function watch() {
	Gulp.watch(["./src/**/*.html", "./src/**/*.hbs"], html)
	Gulp.watch(["./src/assets/script/**/*"], js)
	Gulp.watch(["./src/assets/style/**/*"], css)
	Gulp.watch("./src/assets/static/img-raw/icon/**/*.svg", {
		events: ["add", "unlink", "unlinkDir"]
	}, makeIconsSCSS)
	Gulp.watch("./src/assets/static/img-raw/**/*", imagemin)
	Gulp.watch(["./src/assets/static/**/*", "!./src/assets/static/img-raw/**/*"], copyStatic)
}

export default Gulp.series(
	Gulp.parallel(
		argv.ram ? nothing : cleanBuild,
		imagemin,
		makeIconsSCSS
	), Gulp.parallel(
		copyStatic,
		css,
		js,
		html
	), argv.fwatch ? Gulp.parallel(
		watch,
		browserSyncInit
	) : nothing
)

export { imagemin, ttfToWoff, cleanInitials }