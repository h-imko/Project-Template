import browserSync from "browser-sync"
import browserify from "browserify"
import esmify from "esmify"
import fs from "fs"
import { globby, globbySync } from "globby"
import gulp from "gulp"
import autoPrefixer from "gulp-autoprefixer"
import hb from "gulp-hb"
import imagemin, {
	gifsicle, mozjpeg, svgo
} from "gulp-imagemin"
import GulpMem from "gulp-mem"
import newer from "gulp-newer"
import rename from "gulp-rename"
import replace from "gulp-replace"
import GulpSass from "gulp-sass"
import sourcemaps from "gulp-sourcemaps"
import uglify from "gulp-uglify"
import pngquant from "imagemin-pngquant"
import path from "path"
import Sass from "sass"
import tsify from "tsify"
import esbuild from "gulp-esbuild"
import ttf2woff2 from "ttf2woff2"
import buffer from "vinyl-buffer"
import source from "vinyl-source-stream"
import yargs from "yargs"
import {
	hideBin
} from "yargs/helpers"

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
		.pipe(sass.sync({
			outputStyle: argv.min ? "compressed" : null,
			includePaths: ["node_modules"],
		})
			.on("error", function (error) {
				printPaintedMessage(error.message, "Sass")
				browserSync.notify("SASS Error")
				this.emit("end")
			}))
		.pipe(autoPrefixer({
			cascade: false,
			flexbox: false,
		}))
		.pipe(argv.ram ? nothing() : replace("/src/", "/"))
		.pipe(sourcemaps.write("./"))
		.pipe(argv.ram ? gulpMem.dest("./build/src/assets/style/") : gulp.dest("./build/assets/style/"))
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
			sourcemap: "linked"
		}))
		.on("error", function (error) {
			printPaintedMessage(error.message, "JS")
			browserSync.notify("JS Error")
			this.emit("end")
		})
		.pipe(argv.ram ? nothing() : replace("/src/", "/"))
		.pipe(argv.min ? uglify() : nothing())
		.pipe(sourcemaps.write("./"))
		.pipe(argv.ram ? gulpMem.dest("./build/src/assets/script/") : gulp.dest("./build/assets/script/"))
		.pipe(browserSync.stream())
}

function HTML() {
	return gulp.src(["./src/*.html", "./src/*.hbs"])
		.pipe(
			hb()
				.partials('./src/assets/hbs/**/*.hbs').on("error", function (error) {
					printPaintedMessage(`${error.fileName} ${error.message}`, "HBS")
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
		allowEmpty: true
	})
		.pipe(newer("./src/assets/static/img"))
		.pipe(imagemin([
			pngquant(),
			mozjpeg(),
			svgo(),
			gifsicle()
		]))
		.pipe(gulp.dest("./src/assets/static/img/"))
}

function cleanBuild() {
	if (!argv.ram) {
		fs.rmSync("./build", { recursive: true, force: true })
	}
	return nothing()
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

function cleanInitials() {
	globbySync("./src/**/.placeholder").forEach(function (file) {
		fs.unlinkSync(file)
	})
	return nothing()
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
		argv.fwatch ?
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