import gulp from "gulp"
import GulpSass from 'gulp-sass'
import Sass from 'sass'
import autoPrefixer from "gulp-autoprefixer"
import browserSync from "browser-sync"
import replace from 'gulp-replace'
import ttf2woff2 from 'gulp-ttf2woff2'
import uglify from "gulp-uglify"
import include from "gulp-include"
import clean from "gulp-clean"
import csso from "gulp-csso"
import buffer from 'vinyl-buffer'
import sourcemaps from "gulp-sourcemaps"
import GulpMem from "gulp-mem"
import imagemin from "gulp-imagemin"
import browserify from 'browserify'
import source from 'vinyl-source-stream'
import flatmap from 'gulp-flatmap'
import path from 'path'
import cache from 'gulp-cached'
import yargs from 'yargs'
import {
	hideBin
} from 'yargs/helpers'
const argv = yargs(hideBin(process.argv))
	.argv
const gulpMem = new GulpMem()
const sass = GulpSass(Sass)

function browserSyncInit() {
	gulpMem.logFn = null
	gulpMem.serveBasePath = "./build"
	browserSync.create()
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
		.pipe(sass.sync({
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
		}))
		.pipe(sourcemaps.init({
			loadMaps: true
		}))
		.pipe(argv.min ? uglify() : emptyStream())
		.pipe(sourcemaps.write('./'))
		.pipe(argv.ram ? gulpMem.dest("./build/src/assets/script/") : gulp.dest("./build/assets/script/"))
		.pipe(browserSync.stream())
}

function HTML() {
	return gulp.src(["./src/*.html", "!./src/_*.html"])
		.pipe(flatmap(function (stream, file) {
			return stream.pipe(include()
					.on('error', console.log))
				.pipe(argv.ram ? emptyStream() : replace('/src/', '/'))
				.pipe(argv.separate ? replace("style.css", `${path.basename(file.path , ".html")}.css`) : emptyStream())
				.pipe(argv.separate ? replace("script.js", `${path.basename(file.path, ".html")}.js`) : emptyStream())
		}))
		.pipe(argv.ram ? gulpMem.dest("./build") : gulp.dest("./build"))
		.pipe(browserSync.stream())
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
	gulp.watch("./src/*.html", {
		ignoreInitial: false
	}, HTML)
	gulp.watch("./src/assets/script/*", {
		ignoreInitial: false
	}, JS)
	gulp.watch("./src/assets/style/**/*", {
		ignoreInitial: false
	}, CSS)
	gulp.watch("./src/assets/static/**/*", {
		ignoreInitial: false
	}, copyStatic)
}

function cleanBuild() {
	return gulp.src("./build", {
			allowEmpty: true,
			read: false
		})
		.pipe(clean())
}

function ttfToWoff() {
	return gulp.src(['./src/assets/static/font/*.ttf'])
		.pipe(clean())
		.pipe(ttf2woff2())
		.pipe(gulp.dest('./src/assets/static/font/'))
}
gulp.task('default', argv.watch ? gulp.parallel(watch, browserSyncInit) : gulp.series(cleanBuild, gulp.parallel(CSS, JS, HTML, copyStatic)))
gulp.task('imagemin', minimizeImgs)
gulp.task('ttfToWoff', ttfToWoff)