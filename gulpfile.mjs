import fs from "fs"
import gulp from "gulp"
import sourcemaps from "gulp-sourcemaps"
import { stacksvg } from "gulp-stacksvg"
import { nothing, printPaintedMessage, transform } from "./gulp/service.mjs"
import { reload, replaceSrc, clean, newer, ext, ejsCompile, removeExcess, iconsToCSS, ttfToWoff, sharpWebp, getDestPath, svgOptimize } from "./gulp/custom.mjs"
import { bs, argv, convertingImgTypes, gulpMem, destGulp } from "./gulp/env.mjs"
import { createGulpEsbuild } from "gulp-esbuild"
import gSass from "gulp-sass"
import * as rawsass from "sass-embedded"
import autoprefixer from 'gulp-autoprefixer'

let esbuild = createGulpEsbuild({
	piping: true,
})

const sass = gSass(rawsass)

function cleanExtraImgs(cb) {
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
		.on("finish", () => cb())
}

function browserSyncInit(cb) {
	bs.init({
		ui: false,
		middleware: argv.ram ? gulpMem.middleware : false,
		port: argv.port ?? 80,
		server: {
			baseDir: "./build",
		}
	})
	cb()
}

function css(cb) {
	return gulp.src(["./src/assets/style/**/*.scss", "!./src/assets/style/**/_*.scss"])
		.pipe(sourcemaps.init())
		.pipe(sass({
			style: "compressed",
		})).on("error", function (error) {
			printPaintedMessage(error.message, "CSS")
			bs.notify("CSS Error")
			this.emit("end")
		})
		.pipe(replaceSrc())
		.pipe(autoprefixer())
		.pipe(sourcemaps.write("./"))
		.pipe(destGulp.dest(getDestPath()))
		.pipe(bs.stream())
		.on("finish", () => cb())
}

function js(cb) {
	return gulp.src(["./src/assets/script/**/*.js", "!./src/assets/script/**/_*.js"])
		.pipe(sourcemaps.init())
		.pipe(esbuild({
			outbase: "./src/assets/script",
			outdir: "./build/assets/script",
			sourcemap: "linked",
			format: "esm",
			bundle: true,
			splitting: true,
			treeShaking: true,
			drop: argv.min ? ["console", "debugger"] : [],
			minify: argv.min,
		}))
		.on("error", function (error) {
			printPaintedMessage(error.message, "JS")
			bs.notify("JS Error")
			this.emit("end")
		})
		.pipe(sourcemaps.write())
		.pipe(destGulp.dest(getDestPath()))
		.pipe(bs.stream())
		.on("finish", () => cb())
}

function html(cb) {
	return gulp.src(["./src/**/*.ejs", "./src/**/*.html", "!./src/assets/**/*"])
		.pipe(ejsCompile())
		.on("error", function (error) {
			printPaintedMessage(error.message, "EJS")
			bs.notify("EJS Error")
			this.emit("end")
		})
		.pipe(replaceSrc())
		.pipe(destGulp.dest(getDestPath()))
		.pipe(bs.stream())
		.on("finish", () => cb())
}

function copyStatic(cb) {
	return gulp.src(["./src/assets/static/**/*.*", "!./src/assets/static/img-raw/**/*.*"], {
		allowEmpty: true,
		since: gulp.lastRun(copyStatic),
		encoding: false
	})
		.pipe(destGulp.dest(getDestPath()))
		.pipe(reload())
		.on("finish", () => cb())
}

function makeIconsSCSS(cb) {
	return gulp.src("./src/assets/static/img-raw/icon/**/*.svg", {
		allowEmpty: true,
		read: false
	})
		.pipe(iconsToCSS())
		.pipe(fs.createWriteStream("./src/assets/style/_icons.scss"))
		.on("finish", () => cb())
}

function makeIconsStack(cb) {
	return gulp.src("./src/assets/static/img-raw/icon/**/*.svg")
		.pipe(stacksvg({
			separator: "__"
		}))
		.pipe(transform((chunk, encoding, callback) => {
			chunk.path = `${chunk.base}/src/assets/static/img-raw/icon/${chunk.path}`
			callback(null, chunk)
		}))
		.pipe(gulp.dest(getDestPath(true, ["/img-raw", "/img"])))
		.on("finish", () => cb())
}

function imageMin(cb) {
	return gulp.src("./src/assets/static/img-raw/**/*.*", {
		allowEmpty: true,
		encoding: false
	})
		.pipe(newer("./src/assets/static/img/", ".webp", ...convertingImgTypes))
		.pipe(sharpWebp())
		.pipe(svgOptimize())
		.pipe(ext(".webp", ...convertingImgTypes))
		.pipe(gulp.dest(getDestPath(true, ["/img-raw", "/img"])))
		.on("finish", () => cb())
}

function cleanBuild(cb) {
	return gulp.src("./build/", {
		read: false,
		allowEmpty: true
	})
		.pipe(clean())
		.on("finish", () => cb())
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