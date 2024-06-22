import fs from "fs"
import gulp from "gulp"
import autoPrefixer from "gulp-autoprefixer"
import sourcemaps from "gulp-sourcemaps"
import esbuild from "gulp-esbuild"
import { stacksvg } from "gulp-stacksvg"
import { nothing, printPaintedMessage } from "./gulp/service.mjs"
import { reload, replaceSrc, clean, newer, ext, ejsCompile, sassCompile, removeExcess, replace, iconsToCSS, ttfToWoff, sharpWebp } from "./gulp/custom.mjs"
import { bs, argv, convertingImgTypes, gulpMem, destGulp } from "./gulp/env.mjs"

function cleanExtraImgs() {
	return gulp.src([`./src/assets/static/img/**/*`, `!./src/assets/static/img/icon/stack.svg`], {
		allowEmpty: true,
		read: false,
		nodir: true
	})
		.pipe(removeExcess('img-raw', 'img', ...convertingImgTypes))
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
		.pipe(sassCompile()
			.on("error", function (error) {
				printPaintedMessage(`${error.message} in file ${error.cause}`, "SASS")
				bs.notify("SASS Error")
				this.emit("end")
			}))
		.pipe(ext(".css"))
		.pipe(autoPrefixer({
			cascade: false,
			flexbox: false,
		}))
		.pipe(replaceSrc())
		.pipe(sourcemaps.write("./"))
		.pipe(destGulp.dest("./build/assets/style/"))
		.pipe(bs.stream())
}

function js() {
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
				bs.notify("JS Error")
				this.emit("end")
			})
		)
		.pipe(replaceSrc())
		.pipe(sourcemaps.write("./"))
		.pipe(destGulp.dest("./build/assets/script/"))
		.pipe(bs.stream())
}

function html() {
	return gulp.src(["./src/*.ejs", "./src/*.html"])
		.pipe(ejsCompile()
			.on("error", function (error) {
				printPaintedMessage(`${error.message} in file ${error.cause}`, "EJS")
				bs.notify("EJS Error")
				this.emit("end")
			})
		)
		.pipe(ext(".html"))
		.pipe(replace(".scss", `.css?timestamp=${new Date().getTime()}`))
		.pipe(replace(".ejs", ".html"))
		.pipe(replace(".js", `.js?timestamp=${new Date().getTime()}`))
		.pipe(replaceSrc())
		.pipe(destGulp.dest("./build"))
		.pipe(bs.stream())
}

function copyStatic() {
	return gulp.src(["./src/assets/static/**/*", "!./src/assets/static/img-raw/**/*"], {
		allowEmpty: true,
		since: gulp.lastRun(copyStatic),
		nodir: true,
		encoding: false
	})
		.pipe(destGulp.dest("./build/assets/static/"))
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
	return gulp.src(`./src/assets/static/img-raw/icon/**/*.svg`)
		.pipe(stacksvg({
			separator: "__"
		}))
		.pipe(gulp.dest(`./src/assets/static/img/icon/`))
}

function imageMin() {
	return gulp.src("./src/assets/static/img-raw/**/*", {
		allowEmpty: true,
		nodir: true,
		encoding: false
	})
		.pipe(newer("./src/assets/static/img/", ".webp", ...convertingImgTypes))
		.pipe(sharpWebp())
		.pipe(ext(".webp", ...convertingImgTypes))
		.pipe(gulp.dest("./src/assets/static/img/"))
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
		.pipe(gulp.dest("./src/assets/static/font/"))
}

function cleanInitials() {
	return gulp.src("./src/**/.gitkeep", {
		allowEmpty: true,
		read: false
	})
		.pipe(clean())
}

function watch() {
	gulp.watch(["./src/**/*.html", "./src/**/*.ejs"], html)
	gulp.watch(["./src/assets/script/**/*"], js)
	gulp.watch(["./src/assets/style/**/*"], css)
	gulp.watch(["./src/assets/static/img-raw/icon/**/*.svg"], gulp.parallel(makeIconsStack, makeIconsSCSS))
	gulp.watch(["./src/assets/static/img-raw/"], gulp.parallel(imageMin, cleanExtraImgs))
	gulp.watch(["./src/assets/static/**/*", "!./src/assets/static/img-raw/**/*"], copyStatic)
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