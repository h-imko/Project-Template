import gulp from "gulp"
import GulpSass from "gulp-sass"
import Sass from "sass"
import autoPrefixer from "gulp-autoprefixer"
import browserSync from "browser-sync"
import replace from "gulp-replace"
import ttf2woff2 from "gulp-ttf2woff2"
import uglify from "gulp-uglify"
import include from "gulp-include"
import clean from "gulp-clean"
import csso from "gulp-csso"
import pngquant from "imagemin-pngquant"
import esmify from "esmify"
import buffer from "vinyl-buffer"
import sourcemaps from "gulp-sourcemaps"
import GulpMem from "gulp-mem"
import imagemin, {
	mozjpeg,
	optipng,
	svgo,
	gifsicle
} from "gulp-imagemin"
import browserify from "browserify"
import source from "vinyl-source-stream"
import flatmap from "gulp-flatmap"
import path from "path"
import cache from "gulp-cached"
import yargs from "yargs"
import notify from "gulp-notify"
import {
	hideBin
} from "yargs/helpers"
const argv = yargs(hideBin(process.argv))
	.argv,
	sass = GulpSass(Sass),
	gulpMem = new GulpMem()
gulpMem.logFn = null
gulpMem.serveBasePath = "./build"
notify.logLevel(0)

function browserSyncInit() {
	browserSync.create()
	browserSync.init({
		server: {
			baseDir: "./build",
			middleware: argv.ram ? gulpMem.middleware : false
		},
		port: 3000,
		logConnections: true
	})
}

function emptyTask(cb) {
	cb()
}

function emptyBuffer() {
	return gulp.src("neverUsedName", {
		allowEmpty: true
	})
}

function CSS() {
	return gulp.src(["./src/assets/style/**/*.scss", "!./src/assets/style/**/_*.scss"])
		.pipe(sourcemaps.init())
		.pipe(sass.sync({
				errLogToConsole: true,
				outputStyle: argv.min ? "compressed" : "expanded",
				includePaths: ["node_modules"]
			})
			.on("error", sass.logError)
			.on("error", notify.onError({
				message: "<%= error.message %>",
				title: "SASS"
			})))
		.pipe(argv.ram ? emptyBuffer() : autoPrefixer({
			cascade: true,
			overrideBrowserslist: ["last 3 versions"],
		}))
		.pipe(argv.min ? csso() : emptyBuffer())
		.pipe(argv.ram ? emptyBuffer() : replace("/src/", "/"))
		.pipe(sourcemaps.write("."))
		.pipe(argv.ram ? gulpMem.dest("./build/src/assets/style/") : gulp.dest("./build/assets/style/"))
		.pipe(browserSync.stream())
}

function JS() {
	return gulp.src(["./src/assets/script/**/*.js", "!./src/assets/script/**/_*.js"])
		.pipe(flatmap(function (stream, file) {
			return browserify(`./src/assets/script/${path.basename(file.path)}`, {
					debug: true,
				})
				.plugin(esmify)
				.bundle()
				.on("error", function (error) {
					console.log(error.message)
					this.emit("end")
				})
				.on("error", notify.onError({
					message: "<%= error.message %>",
					title: "JS"
				}))
				.pipe(source(`${path.basename(file.path)}`))
				.pipe(buffer())
		}))
		.pipe(sourcemaps.init({
			loadMaps: true
		}))
		.pipe(argv.ram ? emptyBuffer() : replace("/src/", "/"))
		.pipe(argv.min ? uglify() : emptyBuffer())
		.pipe(sourcemaps.write("./"))
		.pipe(argv.ram ? gulpMem.dest("./build/src/assets/script/") : gulp.dest("./build/assets/script/"))
		.pipe(browserSync.stream())
}

function HTML() {
	return gulp.src(["./src/*.html", "!./src/_*.html"])
		.pipe(flatmap(function (stream, file) {
			return stream.pipe(include()
					.on("error", console.log)
					.on("error", notify.onError({
						message: "<%= error.message %>",
						title: "HTML"
					})))
				.pipe(argv.ram ? emptyBuffer() : replace("/src/", "/"))
				.pipe(argv.separate ? replace("style.css", `${path.basename(file.path , ".html")}.css`) : emptyBuffer())
				.pipe(argv.separate ? replace("script.js", `${path.basename(file.path, ".html")}.js`) : emptyBuffer())
		}))
		.pipe(argv.ram ? gulpMem.dest("./build") : gulp.dest("./build"))
		.pipe(browserSync.stream())
}

function copyStatic() {
	return gulp.src("./src/assets/static/**/*", {
			allowEmpty: true
		})
		.pipe(cache("static"))
		.pipe(argv.ram ? gulpMem.dest("./build/src/assets/static/") : gulp.dest("./build/assets/static/"))
		.pipe(browserSync.stream())
}

function minimizeImgs() {
	return gulp.src("./src/assets/static/img/**/*")
		.pipe(imagemin([
			argv.pnglossy ? pngquant() : optipng(),
			svgo(),
			mozjpeg()
		]))
		.pipe(gulp.dest("./build/assets/static/img"))
}

function watch() {
	gulp.watch("./src/*.html", HTML)
	gulp.watch("./src/assets/script/**/*", JS)
	gulp.watch("./src/assets/style/**/*", CSS)
	gulp.watch("./src/assets/static/**/*", copyStatic)
}

function cleanBuild() {
	return gulp.src("./build", {
			allowEmpty: true,
			read: false
		})
		.pipe(clean())
}

function ttfToWoff() {
	return gulp.src(["./src/assets/static/font/**/*.ttf"])
		.pipe(clean())
		.pipe(ttf2woff2())
		.pipe(gulp.dest("./src/assets/static/font/"))
}
gulp.task("default", gulp.series(argv.ram ? emptyBuffer : cleanBuild, gulp.parallel(CSS, JS, HTML, copyStatic), argv.watch ? gulp.parallel(watch, argv.server ? browserSyncInit : emptyTask) : emptyBuffer))
gulp.task("imagemin", minimizeImgs)
gulp.task("ttfToWoff", ttfToWoff)
