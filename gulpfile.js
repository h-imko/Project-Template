const gulp = require("gulp")
const sass = require('gulp-sass')(require('sass'))
const autoPrefixer = require("gulp-autoprefixer")
const browserSync = require("browser-sync")
	.create()
const ttf2woff2 = require('gulp-ttf2woff2')
const uglify = require("gulp-uglify")
const include = require("gulp-include")
const clean = require("gulp-clean")
const csso = require("gulp-csso")
const sourcemaps = require("gulp-sourcemaps")
const GulpMem = require("gulp-mem")
const imagemin = require("gulp-imagemin")
const browserify = require('gulp-browserify')
const argv = require('yargs')
	.argv
const gulpMem = new GulpMem()
gulpMem.logFn = null
gulpMem.serveBasePath = "./build"

function browserSyncInit() {
	browserSync.init({
		server: {
			baseDir: "./build",
			middleware: argv.prod ? false : gulpMem.middleware
		},
		port: 3000
	})
}

function emptyStream() {
	return gulp.src('.', {
		allowEmpty: true
	})
}

function CSS() {
	return gulp.src("./src/style/style.scss")
		.pipe(sourcemaps.init())
		.pipe(sass({
			errLogToConsole: true,
			outputStyle: argv.prod ? "compressed" : "expanded",
			includePaths: ['node_modules']
		}))
		.on("error", console.error.bind(console))
		.pipe(argv.prod ? autoPrefixer({
			cascade: true,
			overrideBrowserslist: ["last 3 versions"],
		}) : emptyStream())
		.pipe(argv.prod ? csso() : emptyStream())
		.pipe(sourcemaps.write("."))
		.pipe(argv.prod ? gulp.dest("./build/style/") : gulpMem.dest("./build/style/"))
		.pipe(browserSync.stream())
}

function JS() {
	return gulp.src('./src/script/script.js')
		.pipe(sourcemaps.init())
		.pipe(browserify({
			insertGlobals: true,
		}))
		.pipe(argv.prod ? uglify() : emptyStream())
		.pipe(sourcemaps.write("."))
		.pipe(argv.prod ? gulp.dest("./build/script") : gulpMem.dest("./build/script"))
		.pipe(browserSync.stream())
}

function HTML() {
	return gulp.src(["./src/*.html", "!./src/_*.html"])
		.pipe(include())
		.on('error', console.log)
		.pipe(argv.prod ? gulp.dest("./build") : gulpMem.dest("./build"))
		.pipe(browserSync.stream())
}

function copyAssets() {
	return gulp.src("./src/assets/**/*", {
			allowEmpty: true
		})
		.pipe(argv.prod ? gulp.dest("./build/assets") : gulpMem.dest("./build/assets"))
		.pipe(browserSync.stream())
}

function minimizeImgs() {
	return gulp.src("./src/assets/img/**/*", {
			allowEmpty: true
		})
		.pipe(imagemin({
			optimizationLevel: 5,
			verbose: true,
		}))
		.pipe(gulp.dest("./build/assets/img"))
}

function watch() {
	gulp.watch("./src/*.html", gulp.series(HTML))
	gulp.watch("./src/script/*", gulp.series(JS))
	gulp.watch("./src/style/**/*", gulp.series(CSS))
	gulp.watch("./src/assets/**/*", gulp.series(copyAssets))
}

function ttfToWoffF() {
	return gulp.src(['./src/assets/font/*.ttf'])
		.pipe(clean())
		.pipe(ttf2woff2())
		.pipe(gulp.dest('./src/assets/font/'))
}
exports.default = gulp.series(gulp.parallel(CSS, JS, HTML, copyAssets), gulp.parallel(browserSyncInit, watch))
exports.imagemin = gulp.series(minimizeImgs)
exports.ttfToWoff = gulp.series(ttfToWoffF)
exports.build = gulp.parallel(CSS, JS, HTML, copyAssets)
