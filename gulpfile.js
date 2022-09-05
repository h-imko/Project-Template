import gulp from "gulp"
import GulpSass from "gulp-sass"
import Sass from "sass"
import autoPrefixer from "gulp-autoprefixer"
import browserSync from "browser-sync"
import replace from "gulp-replace"
import ttf2woff2 from "ttf2woff2"
import uglify from "gulp-uglify"
import esmify from "esmify"
import tsify from "tsify"
import buffer from "vinyl-buffer"
import sourcemaps from "gulp-sourcemaps"
import GulpMem from "gulp-mem"
import hb from "gulp-hb"
import { globby, globbySync } from "globby"
import pngquant from "imagemin-pngquant"
import rename from "gulp-rename"
import imagemin, {
	mozjpeg,
	gifsicle,
	svgo,
} from "gulp-imagemin"
import browserify from "browserify"
import source from "vinyl-source-stream"
import path from "path"
import yargs from "yargs"
import {
	hideBin
} from "yargs/helpers"
import fs from "fs"
const argv = yargs(hideBin(process.argv)).argv,
	sass = GulpSass(Sass),
	gulpMem = new GulpMem()
gulpMem.logFn = null
gulpMem.serveBasePath = "./build"

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
		.pipe(argv.ram ? nothing() : replace("/src/", "/"))
		.pipe(sourcemaps.write("."))
		.pipe(argv.ram ? gulpMem.dest("./build/src/assets/style/") : gulp.dest("./build/assets/style/"))
		.pipe(browserSync.stream())
}

function JS() {
	globbySync(["./src/assets/script/**/*.js", "!./src/assets/script/**/_*.js"]).forEach(function (file) {
		browserify(file, {
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
			.pipe(source(`${path.basename(file)}`))
			.pipe(buffer())
			.pipe(sourcemaps.init({
				loadMaps: true
			}))
			.pipe(argv.ram ? nothing() : replace("/src/", "/"))
			.pipe(argv.min ? uglify() : nothing())
			.pipe(sourcemaps.write("./"))
			.pipe(argv.ram ? gulpMem.dest("./build/src/assets/script/") : gulp.dest("./build/assets/script/"))
			.pipe(browserSync.stream())
	})
	return nothing()
}

function HTML() {
	return gulp.src(["./src/*.html", "./src/*.hbs"])
		.pipe(
			hb()
				.partials('./src/assets/hbs/**/*.hbs').on("error", function (error) {
					printPaintedMessage(error.message, "HBS")
					browserSync.notify("HBS Error")
					this.emit("end")
				})
		)
		.pipe(argv.ram ? nothing() : replace("/src/", "/"))
		.pipe(rename(function (path) {
			path.extname = ".html"
		}))
		.pipe(argv.ram ? gulpMem.dest("./build") : gulp.dest("./build"))
		.pipe(browserSync.stream())
}

function copyStatic() {
	return gulp.src(["./src/assets/static/**/*", "!./src/assets/static/img-raw/**/*"], {
		allowEmpty: true,
		since: gulp.lastRun(copyStatic)
	})
		.pipe(argv.ram ? gulpMem.dest("./build/src/assets/static/") : gulp.dest("./build/assets/static/"))
		.pipe(browserSync.stream())
}

function makeIconsSCSS() {
	globby("./src/assets/static/img-raw/icon/**/*.svg", {}, function (er, files) {
		fs.writeFileSync("./src/assets/style/_icons.scss", "")
		fs.appendFileSync("./src/assets/style/_icons.scss", files.reduce(function (prev, curr) {
			let name = path.parse(path.relative("./src/assets/static/img-raw/icon/", curr).replaceAll('\\', '__')).name
			let css = `.icon--${name},%icon--${name}{mask-image: url(${curr.replace(".", "").replace("/img-raw/", "/img/")});}`
			return prev.concat(css)
		}, ""))
	})
	return nothing()
}

function minimizeImgs() {
	return gulp.src("./src/assets/static/img-raw/**/*", {
		allowEmpty: true,
		since: gulp.lastRun(minimizeImgs)
	})
		.pipe(imagemin([
			pngquant(),
			mozjpeg(),
			svgo(),
			gifsicle()
		]))
		.pipe(gulp.dest("./src/assets/static/img/"))
}

function cleanBuild(cb) {
	if (!argv.ram) {
		fs.rmSync("./build", { recursive: true })
	}
	cb()
}

function ttfToWoff() {
	globbySync("./src/assets/static/font/**/*.ttf").forEach(function (file) {
		let relativeDir = path.relative("./src/assets/static/font/", path.dirname(file))
		let name = `${path.basename(file, path.extname(file))}.woff2`
		let destFull = path.join("./src/assets/static/font/", relativeDir, name)
		fs.writeFileSync(destFull, ttf2woff2(fs.readFileSync(file)))
		fs.unlink(file, function () { })
	})
	return nothing()
}

function cleanInitials(cb) {
	globbySync("./src/**/.placeholder").forEach(function (file) {
		fs.unlinkSync(file)
	})
	cb()
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
			cleanBuild,
			makeIconsSCSS
		),
		gulp.parallel(
			CSS,
			JS,
			HTML,
			gulp.series(
				minimizeImgs,
				copyStatic
			)
		),
		argv.watch ?
			gulp.parallel(
				watch,
				browserSyncInit
			)
			:
			nothing
	)
)
gulp.task("imagemin", minimizeImgs)
gulp.task("ttfToWoff", ttfToWoff)
gulp.task("init", cleanInitials)