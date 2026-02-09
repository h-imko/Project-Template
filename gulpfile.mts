import * as fs from "fs"
import * as gulp from "gulp"
import autoprefixer from 'gulp-autoprefixer'
import { createGulpEsbuild } from "gulp-esbuild"
import gSass from "gulp-sass"
import sourcemaps from "gulp-sourcemaps"
import { stacksvg } from "gulp-stacksvg"
import * as ReactDOMServer from "react-dom/server"
import * as rawsass from "sass-embedded"
import { clean, ext, getDestPath, iconsToCSS, iconsToTS, newer, reload, removeExcess, replace, sharpWebp, svgOptimize, ttfToWoff } from "./gulp/custom.mjs"
import { argv, bs, convertingImgTypes, destGulp, gulpMem } from "./gulp/env.mjs"
import { nothing, printPaintedMessage, transform } from "./gulp/service.mjs"

let esbuild = createGulpEsbuild({})

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
		ui: false,
		middleware: argv.ram ? gulpMem.middleware : false,
		port: argv.port ?? 80,
		server: {
			baseDir: "./build",
		}
	})
}

function css() {
	return gulp.src(["./src/assets/style/**/*.scss", "!./src/assets/style/**/_*.scss"])
		.pipe(sourcemaps.init())
		.pipe(sass({
			style: "compressed",
		})).on("error", function (error) {
			printPaintedMessage(error.message, "CSS")
			bs.notify("CSS Error")
			this.emit("end")
		})
		.pipe(replace("/src/assets/", argv.github ? "/zn-test/assets/" : argv.prod ? "../" : "/assets/"))
		.pipe(autoprefixer({
			overrideBrowserslist: [
				"chrome >= 100"
			]
		}))
		.pipe(sourcemaps.write("./"))
		.pipe(destGulp.dest(getDestPath()))
		.pipe(bs.stream())
}

function js() {
	return gulp.src(["./src/assets/script/**/*.js", "!./src/assets/script/**/_*.js"])
		.pipe(sourcemaps.init())
		.pipe(esbuild({
			outbase: "./src/assets/script",
			outdir: "./build/assets/script",
			sourcemap: "linked",
			format: "esm",
			bundle: true,
			splitting: true,
			target: "es6",
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
}

function passComponents(cb) {
	return nothing(cb)
}

function html() {
	return gulp.src(["./src/**/*.jsx", "!./src/components/**/*.jsx", "./src/**/*.tsx", "!./src/components/**/*.tsx"],
		{
			read: false,
			...(gulp.lastRun(html) > gulp.lastRun(passComponents) && { since: gulp.lastRun(html) })
		}
	)
		.on("error", function (error) {
			console.log(error.chunk.path)
			printPaintedMessage(error.message, "HTML")
			bs.notify("HTML Error")
			this.emit("end")
		})
		.pipe(transform((chunk, encoding, callback) => {
			try {
				import(`file://${chunk.path}`).then((module) => {
					chunk.contents = Buffer.from(ReactDOMServer.renderToString(module.default()).replaceAll(".scss", ".css"))
					callback(null, chunk)
				})
			} catch (error) {
				callback(error, chunk)
			}
		}).on("error", function (error) {
			console.log(error.chunk.path)

			printPaintedMessage(error.message, "HTML")
			bs.notify("HTML Error")
			this.emit("end")
		}))
		.pipe(ext(".html"))
		.pipe(replace("/src/assets/", argv.github ? "/zn-test/assets/" : argv.prod ? "../" : "/assets/"))
		.pipe(replace("/src/", argv.github ? "/zn-test/" : "/"))
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

function makeIconsJSON() {
	const writeStream = fs.createWriteStream("./src/components/_icons.ts")
	writeStream.write("const icons = {\n")

	writeStream.on("close", () => {
		const restWriter = fs.createWriteStream("./src/components/_icons.ts", { flags: 'a' })
		restWriter.write("}\n\nexport default icons", "utf8")
		restWriter.close()
	})

	return gulp.src("./src/assets/static/img-raw/icon/**/*.svg", {
		allowEmpty: true,
		read: false
	})
		.pipe(iconsToTS())
		.pipe(writeStream)
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
		.pipe(svgOptimize())
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
	esbuild = createGulpEsbuild({})

	return nothing()
}

function watch() {
	gulp.watch(["./src/components/**/*.jsx", "./src/components/**/*.tsx"], gulp.series(passComponents, html))
	gulp.watch(["./src/**/*.jsx"], html)
	gulp.watch(["./src/assets/script/**/*.*"], { events: "add" }, gulp.series(remakeEsbuild, js))
	gulp.watch(["./src/assets/script/**/*.*"], { events: "change" }, js)
	gulp.watch(["./src/assets/style/**/*.*"], css)
	gulp.watch(["./src/assets/static/img-raw/icon/**/*.svg"], gulp.parallel(makeIconsStack, makeIconsSCSS, makeIconsJSON))
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
		makeIconsJSON,
		makeIconsStack,
	),
	passComponents,
	gulp.parallel(
		copyStatic,
		css,
		js,
		html
	), argv.fwatch ? gulp.parallel(
		watch,
		browserSyncInit
	) : nothing
)

export { cleanInitials, imageMin, convertFont as ttfToWoff }

