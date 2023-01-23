import browserSync from "browser-sync"
import fs from "fs"
import gulp from "gulp"
import autoPrefixer from "gulp-autoprefixer"
import hb from "gulp-hb"
import imagemin, {
	gifsicle, mozjpeg, svgo
} from "gulp-imagemin"
import GulpMem from "gulp-mem"
import sourcemaps from "gulp-sourcemaps"
import pngquant from "imagemin-pngquant"
import path from "path"
import Sass from "sass"
import esbuild from "gulp-esbuild"
import ttf2woff2 from "ttf2woff2"
import stream from "stream"

const gulpMem = new GulpMem(),
	argv = process.argv.slice(2).reduce(function (acc, curr) {
		return { ...acc, [curr.replace("--", "")]: true }
	}, {}), currentGulp = argv.ram ? gulpMem : gulp

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
	foundPath = pathTransform.toPosix(path.join(...foundPath, key))
	return `${exclude ? "!" : ""}./${build ? "build/" : "src/"}${foundPath}/${allOf ? `**/${prefix}*.${allOf}` : ""}`
}

const pathTransform = {
	toPosix: (pathString) => `${pathString}`.split(path.sep).join(path.posix.sep),
	ext: (file, newExt) => path.join(path.dirname(file), path.basename(file, path.extname(file)) + newExt)
}

function nothing(callback = () => { }) {
	callback()
	return new stream.PassThrough({
		readableObjectMode: true,
		writableObjectMode: true
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

function sass() {
	return new stream.Transform({
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
				chunk.sourceMap.file = path.basename(chunk.path)
				callback(null, chunk)
			}
			catch (error) {
				console.log(error)

				callback(error, chunk)
			}
		}
	})
}

function browserSyncInit() {
	browserSync.init({
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

function CSS() {
	return gulp.src(["./src/assets/style/**/*.scss", "!./src/assets/style/**/_*.scss"])
		.pipe(sourcemaps.init())
		.pipe(sass()
			.on("error", function (error) {
				printPaintedMessage(error.message, "Sass")
				browserSync.notify("SASS Error")
				this.emit("end")
			}))
		.pipe(autoPrefixer({
			cascade: false,
			flexbox: false,
		}))
		.pipe(repaceSrc())
		.pipe(sourcemaps.write("./"))
		.pipe(currentGulp.dest("./build/assets/style/"))
		.pipe(browserSync.stream())
}

function JS() {
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
				browserSync.notify("JS Error")
				this.emit("end")
			})
		)
		.pipe(repaceSrc())
		.pipe(sourcemaps.write("./"))
		.pipe(currentGulp.dest("./build/assets/script/"))
		.pipe(browserSync.stream())
}

function HTML() {
	return gulp.src(["./src/*.html"])
		.pipe(hb()
			.partials('./src/assets/hbs/**/*.hbs').on("error", function (error) {
				printPaintedMessage(`${error.fileName} ${error.message}`, "HBS")
				browserSync.notify("HBS Error")
				this.emit("end")
			})
		)
		.pipe(repaceSrc())
		.pipe(currentGulp.dest("./build"))
		.pipe(browserSync.stream())
}

function copyStatic() {
	return gulp.src(["./src/assets/static/**/*", "!./src/assets/static/img-raw/**/*"], {
		allowEmpty: true,
		since: gulp.lastRun(copyStatic)
	})
		.pipe(currentGulp.dest("./build/assets/static/"))
		.pipe(browserSync.stream())
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
				let relative = pathTransform.toPosix(path.relative(chunk.base, chunk.path))
				let name = relative.replaceAll(path.sep, '__')
				let target = relative.replace("/img-raw/", "/img/")
				let css = `.icon--${name},%icon--${name}{mask-image: url(/${target});}`
				callback(null, css)
			}
		}))
		.pipe(fs.createWriteStream("./src/assets/style/_icons.scss"))
}

function minimizeImgs() {
	return gulp.src("./src/assets/static/img-raw/**/*", {
		allowEmpty: true
	})
		.pipe(newer("./src/assets/static/img/"))
		.pipe(imagemin([
			pngquant(),
			mozjpeg(),
			svgo(),
			gifsicle()
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
	gulp.watch(["./src/**/*.html", "./src/**/*.hbs"], HTML)
	gulp.watch(["./src/assets/script/**/*"], JS)
	gulp.watch(["./src/assets/style/**/*"], CSS)
	gulp.watch("./src/assets/static/img-raw/icon/**/*.svg", {
		events: ["add", "unlink", "unlinkDir"]
	}, makeIconsSCSS)
	gulp.watch("./src/assets/static/img-raw/**/*", minimizeImgs)
	gulp.watch(["./src/assets/static/**/*", "!./src/assets/static/img-raw/**/*"], copyStatic)
}

gulp.task("default",
	gulp.series(
		gulp.parallel(
			argv.ram ? nothing : cleanBuild,
			minimizeImgs,
			makeIconsSCSS
		), gulp.parallel(
			copyStatic,
			CSS,
			JS,
			HTML
		), argv.fwatch ? gulp.parallel(
			watch,
			browserSyncInit
		) : nothing
	)
)
gulp.task("imagemin", minimizeImgs)
gulp.task("ttfToWoff", ttfToWoff)
gulp.task("init", cleanInitials)
