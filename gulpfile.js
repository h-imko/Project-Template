import gulp from "gulp"
import GulpSass from "gulp-sass"
import Sass from "sass"
import autoPrefixer from "gulp-autoprefixer"
import browserSync from "browser-sync"
import replace from "gulp-replace"
import ttf2woff2 from "ttf2woff2"
import uglify from "gulp-uglify"
import newer from "gulp-newer"
import include from "gulp-include"
import esmify from "esmify"
import tsify from "tsify"
import buffer from "vinyl-buffer"
import sourcemaps from "gulp-sourcemaps"
import GulpMem from "gulp-mem"
import pngquant from "imagemin-pngquant"
import imagemin, {
	mozjpeg,
	gifsicle,
	svgo,
} from "gulp-imagemin"
import browserify from "browserify"
import source from "vinyl-source-stream"
import flatmap from "gulp-flatmap"
import path from "path"
import del from "del"
import vinylPaths from "vinyl-paths"
import cache from "gulp-cached"
import yargs from "yargs"
import {
	hideBin
} from "yargs/helpers"
const argv = yargs(hideBin(process.argv))
	.argv,
	sass = GulpSass(Sass),
	gulpMem = new GulpMem()
gulpMem.logFn = null
gulpMem.serveBasePath = "./build"

function universalDel(anypath, options) {
	return del(pathToPOSIX(anypath), options)
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

function nothing() {
	return gulp.src("neverUsedName", {
		allowEmpty: true,
		read: false
	})
}

function printPaintedMessage(message, module) {
	let errs = [...message.matchAll(new RegExp(/(?:[A-Za-z]+:*\\[а-яА-Яa-zA-Z-_.\\/]+)|('[а-яА-Яa-zA-Z-_.\\/]+')/gm))].map(function (curr) {
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
		.pipe(sass.sync({
			errLogToConsole: true,
			outputStyle: argv.min ? "compressed" : null,
			includePaths: ["node_modules"]
		})
			.on("error", function (error) {
				printPaintedMessage(error.message, "Sass")
				browserSync.notify("SASS Error")
				this.emit("end")
			}))
		.pipe(argv.ram ? nothing() : autoPrefixer({
			cascade: false,
		}))
		.pipe(argv.ram ? nothing() : replace("/src/", "../../"))
		.pipe(sourcemaps.write("."))
		.pipe(argv.ram ? gulpMem.dest("./build/src/assets/style/") : gulp.dest("./build/assets/style/"))
		.pipe(browserSync.stream())
}

function JS() {
	return gulp.src(["./src/assets/script/**/*.js", "!./src/assets/script/**/_*.js"])
		.pipe(flatmap(function (stream, file) {
			return browserify(file.path, {
				debug: true,
			})
				.plugin(tsify)
				.plugin(esmify)
				.bundle()
				.on("error", function (error) {
					printPaintedMessage(error.message, "Browserify")
					browserSync.notify("JS Error")
					this.emit("end")
				})
				.pipe(source(`${path.basename(file.path)}`))
				.pipe(buffer())
		}))
		.pipe(sourcemaps.init({
			loadMaps: true
		}))
		.pipe(argv.ram ? nothing() : replace("/src/", "../../"))
		.pipe(argv.min ? uglify() : nothing())
		.pipe(sourcemaps.write("./"))
		.pipe(argv.ram ? gulpMem.dest("./build/src/assets/script/") : gulp.dest("./build/assets/script/"))
		.pipe(browserSync.stream())
}

function HTML() {
	return gulp.src(["./src/*.html", "!./src/_*.html"])
		.pipe(flatmap(function (stream, file) {
			return stream.pipe(include()
				.on("error", console.log)
				.on("error", function () {
					browserSync.notify("HTML Error")
				}))
				.pipe(argv.ram ? nothing() : replace("/src/", "./"))
				.pipe(argv.separate ? replace("style.css", `${path.basename(file.path, ".html")}.css`)
					.pipe(replace("script.js", `${path.basename(file.path, ".html")}.js`)) : nothing())
		}))
		.pipe(argv.ram ? gulpMem.dest("./build") : gulp.dest("./build"))
		.pipe(browserSync.stream())
}

function copyStatic() {
	return gulp.src(["./src/assets/static/**/*", "!./src/assets/static/img-raw/**/*"], {
		allowEmpty: true
	})
		.pipe(cache("static"))
		.pipe(argv.ram ? gulpMem.dest("./build/src/assets/static/") : gulp.dest("./build/assets/static/"))
		.pipe(browserSync.stream())
}

function minimizeImgs() {
	return gulp.src("./src/assets/static/img-raw/**/*", {
		allowEmpty: true,
	})
		.pipe(newer("./src/assets/static/img/**/*"))
		.pipe(imagemin([
			pngquant(),
			mozjpeg(),
			svgo(),
			gifsicle()
		]))
		.pipe(gulp.dest("./src/assets/static/img/"))
}

function watch() {
	gulp.watch("./src/*.html", HTML)
	gulp.watch("./src/assets/script/**/*", JS)
	gulp.watch("./src/assets/style/**/*", CSS)
	gulp.watch("./src/assets/static/img-raw/**/*", minimizeImgs)
	gulp.watch(["./src/assets/static/**/*", "!./src/assets/static/img-raw/**/*"], copyStatic)
}

function pathToPOSIX(anypath) {
	return anypath.split(path.sep)
		.join(path.posix.sep)
}

function cleanBuild() {
	if (argv.ram) {
		return nothing()
	} else {
		return del("./build")
	}
}

function ttfToWoff() {
	return gulp.src(["./src/assets/static/font/**/*.ttf"], {
		allowEmpty: true
	})
		.pipe(vinylPaths(universalDel))
		.pipe(flatmap((function (stream, file) {
			stream = source(`${path.basename(file.path, path.extname(file.path))}.woff2`)
			stream.write(ttf2woff2(file.contents))
			process.nextTick(function () {
				stream.end()
			})
			return stream.pipe(buffer())
		})))
		.pipe(gulp.dest("./src/assets/static/font/"))
}

function cleanInitials() {
	return del("./src/**/.placeholder")
}
gulp.task("default", gulp.series(cleanBuild, gulp.parallel(CSS, JS, HTML, gulp.series(minimizeImgs, copyStatic)), argv.watch ? gulp.parallel(watch, browserSyncInit) : nothing))
gulp.task("imagemin", minimizeImgs)
gulp.task("ttfToWoff", ttfToWoff)
gulp.task("init", cleanInitials)