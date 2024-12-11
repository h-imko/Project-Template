import fs from "fs"
import gulp from "gulp"
import sourcemaps from "gulp-sourcemaps"
import { stacksvg } from "gulp-stacksvg"
import { nothing, printPaintedMessage, transform } from "./gulp/service.mjs"
import { reload, replaceSrc, clean, newer, ext, ejsCompile, removeExcess, replace, iconsToCSS, ttfToWoff, sharpWebp, getDestPath } from "./gulp/custom.mjs"
import { bs, argv, convertingImgTypes, gulpMem, destGulp } from "./gulp/env.mjs"
import { createGulpEsbuild } from "gulp-esbuild"
import gSass from "gulp-sass"
import * as rawsass from "sass"
import autoprefixer from 'gulp-autoprefixer'

let esbuild = createGulpEsbuild({
	piping: true,
	incremental: argv.fwatch,
})

const sass = gSass(rawsass)

function cleanExtraImgs() {
	return gulp.src(["./src/assets/static/img/**/*.*", "!./src/assets/static/img/icon/stack.svg"], {
		allowEmpty: true,
		read: false,
	})
		.pipe(removeExcess("img-raw", "img", ...convertingImgTypes))
		.on("error", function (error) {
			printPaintedMessage(error.message, "Files")
			bs.notify("Files Error")
			this.emit("end")
		})
}

function browserSyncInit() {
	bs.init({
		server: {
			baseDir: "./build",
			middleware: argv.ram ? gulpMem.middleware : false,
		},
		port: argv.port ?? 80
	})
}

function css() {
	return gulp.src(["./src/assets/style/**/*.scss", "!./src/assets/style/**/_*.scss"])
		.pipe(sourcemaps.init())
		.pipe(sass({
			style: "compressed"
		}))
		.pipe(replaceSrc())
		.pipe(autoprefixer())
		.on("error", function (error) {
			printPaintedMessage(error.message, "CSS")
			bs.notify("CSS Error")
			this.emit("end")
		})
		.pipe(sourcemaps.write())
		.pipe(destGulp.dest(getDestPath()))
		.pipe(bs.stream())
}

function js() {
	return gulp.src(["./src/assets/script/**/*.js", "!./src/assets/script/**/_*.js"])
		.pipe(sourcemaps.init())
		.pipe(esbuild({
			outbase: "./",
			sourcemap: "linked",
			bundle: true,
			drop: argv.min ? ["console", "debugger"] : [],
			minify: argv.min
		}))
		.on("error", function (error) {
			printPaintedMessage(error.message, "JS")
			bs.notify("JS Error")
			this.emit("end")
		})
		.pipe(sourcemaps.write())
		.pipe(destGulp.dest(getDestPath()))
		.pipe(bs.stream())
}

function html() {
	return gulp.src(["./src/*.ejs", "./src/*.html"])
		.pipe(ejsCompile())
		.on("error", function (error) {
			printPaintedMessage(error.message, "EJS")
			bs.notify("EJS Error")
			this.emit("end")
		})
		.pipe(replaceSrc())
		.pipe(destGulp.dest(getDestPath()))
		.pipe(bs.stream())
}

function copyStatic() {
	return gulp.src(["./src/assets/static/**/*.*", "!./src/assets/static/img-raw/**/*.*"], {
		allowEmpty: true,
		since: gulp.lastRun(copyStatic),
		encoding: false
	})
		.pipe(destGulp.dest(getDestPath()))
		.pipe(reload())
}

function makeIconsSCSS() {
	return gulp.src("./src/assets/static/img-raw/icon/**/*.svg", {
		allowEmpty: true,
		read: false
	})
		.pipe(iconsToCSS())
		.pipe(fs.createWriteStream("./src/assets/style/_icons.scss"))
}

function makeIconsStack() {
	return gulp.src("./src/assets/static/img-raw/icon/**/*.svg")
		.pipe(stacksvg({
			separator: "__"
		}))
		.pipe(transform((chunk, encoding, callback) => {
			chunk.path = `${chunk.base}/src/assets/static/img-raw/icon/${chunk.path}`
			callback(null, chunk)
		}))
		.pipe(gulp.dest(getDestPath(true, ["/img-raw", "/img"])))
}

function imageMin() {
	return gulp.src("./src/assets/static/img-raw/**/*.*", {
		allowEmpty: true,
		encoding: false
	})
		.pipe(newer("./src/assets/static/img/", ".webp", ...convertingImgTypes))
		.pipe(sharpWebp())
		.pipe(ext(".webp", ...convertingImgTypes))
		.pipe(gulp.dest(getDestPath(true, ["/img-raw", "/img"])))
}

function cleanBuild() {
	return gulp.src("./build/", {
		read: false,
		allowEmpty: true
	})
		.pipe(clean())
}

function convertFont() {
	return gulp.src("./src/assets/static/font/**/*.ttf", {
		encoding: false
	})
		.pipe(ttfToWoff())
		.pipe(clean())
		.pipe(ext(".woff2"))
		.pipe(gulp.dest(getDestPath(true)))
}

function cleanInitials() {
	return gulp.src("./src/**/.gitkeep", {
		allowEmpty: true,
		read: false
	})
		.pipe(clean())
}

function remakeEsbuild() {
	esbuild = createGulpEsbuild({
		piping: true,
		incremental: argv.fwatch,
	})

	return nothing()
}

function watch() {
	gulp.watch(["./src/**/*.html", "./src/**/*.ejs"], html)
	gulp.watch(["./src/assets/script/**/*.*"], { events: "add" }, gulp.series(remakeEsbuild, js))
	gulp.watch(["./src/assets/script/**/*.*"], { events: "change" }, js)
	gulp.watch(["./src/assets/style/**/*.*"], css)
	gulp.watch(["./src/assets/static/img-raw/icon/**/*.svg"], gulp.parallel(makeIconsStack, makeIconsSCSS))
	gulp.watch(["./src/assets/static/img-raw/**/*.*"], { events: ["change", "add"] }, imageMin)
	gulp.watch(["./src/assets/static/img-raw/**/*.*"], { events: ["unlink", "unlinkDir"] }, cleanExtraImgs)
	gulp.watch(["./src/assets/static/**/*.*", "!./src/assets/static/img-raw/**/*.*"], copyStatic)
}

export default gulp.series(
	gulp.parallel(
		argv.ram ? nothing : cleanBuild,
		imageMin,
		cleanExtraImgs,
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

export { imageMin, convertFont as ttfToWoff, cleanInitials }