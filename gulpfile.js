const gulp = require("gulp")
const sass = require('gulp-sass')(require('sass'))
const autoPrefixer = require("gulp-autoprefixer")
const browserSync = require("browser-sync")
	.create()
const replace = require('gulp-replace')
const ttf2woff2 = require('gulp-ttf2woff2')
const uglify = require("gulp-uglify")
const include = require("gulp-include")
const clean = require("gulp-clean")
const csso = require("gulp-csso")
const buffer = require('vinyl-buffer')
const sourcemaps = require("gulp-sourcemaps")
const GulpMem = require("gulp-mem")
const imagemin = require("gulp-imagemin")
const browserify = require('browserify')
const source = require('vinyl-source-stream')
const flatmap = require('gulp-flatmap')
const path = require('path')
const cache = require('gulp-cached')
const argv = require('yargs')
	.argv
const gulpMem = new GulpMem()
gulpMem.logFn = null
gulpMem.serveBasePath = "./build"

function browserSyncInit() {
	browserSync.init({
		server: {
			baseDir: "./build",
			middleware: argv.ram ? gulpMem.middleware : false
		},
		port: 3000
	})
}

function emptyStream() {
	return gulp.src('neverUsedName', {
		allowEmpty: true
	})
}

function CSS() {
	return gulp.src(["./src/assets/style/*.scss", "!./src/assets/style/_*.scss"])
		.pipe(sourcemaps.init())
		.pipe(sass({
				errLogToConsole: true,
				outputStyle: argv.min ? "compressed" : "expanded",
				includePaths: ['node_modules']
			})
			.on('error', sass.logError))
		.pipe(argv.ram ? emptyStream() : autoPrefixer({
			cascade: true,
			overrideBrowserslist: ["last 3 versions"],
		}))
		.pipe(argv.min ? csso() : emptyStream())
		.pipe(argv.ram ? emptyStream() : replace('/src/', '/'))
		.pipe(sourcemaps.write("."))
		.pipe(argv.ram ? gulpMem.dest("./build/src/assets/style/") : gulp.dest("./build/assets/style/"))
		.pipe(browserSync.stream())
}

function JS() {
	return gulp.src(['./src/assets/script/*.js', '!./src/assets/script/_*.js'])
		.pipe(flatmap(function (stream, file) {
			return browserify(`./src/assets/script/${path.basename(file.path)}`, {
					debug: true,
				})
				.bundle()
				.on('error', function (err) {
					console.log(err.message)
					this.emit('end')
				})
				.pipe(source(`${path.basename(file.path)}`))
				.pipe(buffer())
				.pipe(sourcemaps.init({
					loadMaps: true
				}))
				.pipe(argv.min ? uglify() : emptyStream())
				.pipe(sourcemaps.write('./'))
				.pipe(argv.ram ? gulpMem.dest("./build/src/assets/script/") : gulp.dest("./build/assets/script/"))
				.pipe(browserSync.stream())
		}))
}

function HTML() {
	return gulp.src(["./src/*.html", "!./src/_*.html"])
		.pipe(flatmap(function (stream, file) {
			return stream.pipe(include()
					.on('error', console.log))
				.pipe(argv.ram ? emptyStream() : replace('/src/', '/'))
				.pipe(argv.separate ? replace("style.css", `${path.basename(file.path , ".html")}.css`) : emptyStream())
				.pipe(argv.separate ? replace("script.js", `${path.basename(file.path, ".html")}.js`) : emptyStream())
				.pipe(argv.ram ? gulpMem.dest("./build") : gulp.dest("./build"))
				.pipe(browserSync.stream())
		}))
}

function copyStatic() {
	return gulp.src("./src/assets/static/**/*", {
			allowEmpty: true
		})
		.pipe(cache('static'))
		.pipe(argv.ram ? gulpMem.dest("./build/src/assets/static/") : gulp.dest("./build/assets/static/"))
		.pipe(browserSync.stream())
}

function minimizeImgs() {
	return gulp.src("./src/assets/static/img/**/*")
		.pipe(imagemin({
			optimizationLevel: 5,
			verbose: true,
		}))
		.pipe(gulp.dest("./build/assets/static/img"))
}

function watch() {
	gulp.watch("./src/*.html", HTML)
	gulp.watch("./src/assets/script/*", JS)
	gulp.watch("./src/assets/style/**/*", CSS)
	gulp.watch("./src/assets/static/**/*", copyStatic)
}

function ttfToWoffF() {
	return gulp.src(['./src/assets/static/font/*.ttf'])
		.pipe(clean())
		.pipe(ttf2woff2())
		.pipe(gulp.dest('./src/assets/static/font/'))
}
exports.default = gulp.series(gulp.parallel(CSS, JS, HTML, copyStatic), argv.watch ? gulp.parallel(browserSyncInit, watch) : gulp.series(emptyStream))
exports.imagemin = gulp.series(minimizeImgs)
exports.ttfToWoff = gulp.series(ttfToWoffF)