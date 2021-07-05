const gulp = require("gulp");
const rename = require("gulp-rename");
const sass = require('gulp-sass')(require('sass'));
const autoPrefixer = require("gulp-autoprefixer");
const browserSync = require("browser-sync")
	.create();
const ttfToWoff = require('gulp-ttf2woff2');
const uglify = require("gulp-uglify");
const include = require("gulp-file-include");
const clean = require("gulp-clean");
const csso = require("gulp-csso");
const sourcemaps = require("gulp-sourcemaps");
const GulpMem = require("gulp-mem");
const imagemin = require("gulp-imagemin");
const browserify = require('gulp-browserify');
const gulpMem = new GulpMem();
gulpMem.serveBasePath = "./build";
gulpMem.logFn = null;

function browserSyncF() {
	return browserSync.init({
		server: {
			baseDir: "./build",
			middleware: gulpMem.middleware,
		},
		port: 3000,
	});
}

function browserSyncFProd() {
	return browserSync.init({
		server: {
			baseDir: "./build",
		},
		port: 3000,
	});
}

function CSS() {
	return (gulp.src("./src/style/style.scss")
		.pipe(sourcemaps.init())
		.pipe(sass({
			errLogToConsole: true,
			outputStyle: "expanded",
		}))
		.on("error", console.error.bind(console))
		// .pipe(autoPrefixer({
		// 	cascade: true,
		// 	overrideBrowserslist: ["last 3 versions"],
		// }))
		.pipe(rename({
			extname: ".css"
		}))
		.pipe(sourcemaps.write("."))
		.pipe(gulpMem.dest("./build/style/"))
		.pipe(browserSync.stream()));
}

function CSSProd() {
	return gulp.src("./src/style/style.scss")
		// .pipe(sourcemaps.init())
		.pipe(sass({
			errLogToConsole: true,
			outputStyle: "compressed",
		}))
		.on("error", console.error.bind(console))
		.pipe(autoPrefixer({
			cascade: true,
			overrideBrowserslist: ["last 3 versions"],
		}))
		.pipe(rename({
			extname: ".css"
		}))
		.pipe(csso())
		// .pipe(sourcemaps.write("."))
		.pipe(gulp.dest("./build/style/"))
		.pipe(browserSync.stream());
}

function JS() {
	return gulp.src('./src/script/script.js')
		.pipe(sourcemaps.init())
		.pipe(browserify({
			insertGlobals: true,
		}))
		.pipe(sourcemaps.write("."))
		.pipe(gulpMem.dest("./build/script"))
		.pipe(browserSync.stream());
}

function JSProd() {
	return gulp.src("./src/script/script.js")
		// .pipe(sourcemaps.init())
		.pipe(browserify({
			insertGlobals: true,
		}))
		.pipe(uglify())
		// .pipe(sourcemaps.write("."))
		.pipe(gulp.dest("./build/script"))
		.pipe(browserSync.stream());
}

function HTML() {
	return gulp.src(["./src/*.html", "!./src/_*.html"])
		.pipe(include())
		.pipe(gulpMem.dest("./build"))
		.pipe(browserSync.stream());
}

function HTMLProd() {
	return gulp.src(["./src/*.html", "!./src/_*.html"])
		.pipe(include())
		.pipe(gulp.dest("./build"))
		.pipe(browserSync.stream());
}

function copyAssets() {
	return gulp.src("./src/assets/**/*", {
			allowEmpty: true
		})
		.pipe(gulpMem.dest("./build/assets"))
		.pipe(browserSync.stream());
}

function copyPlugins() {
	return gulp.src("./src/plugins/**/*", {
			allowEmpty: true
		})
		.pipe(gulpMem.dest("./build/plugins"))
		.pipe(browserSync.stream());
}

function imageminF() {
	return gulp.src("./src/assets/img/**/*", {
			allowEmpty: true
		})
		.pipe(imagemin({
			optimizationLevel: 5,
			verbose: true,
		}))
		.pipe(gulp.dest("./build/assets/img"))
}

function copyAssetsProd() {
	return gulp.src("./src/assets/**/*", {
			allowEmpty: true
		})
		.pipe(gulp.dest("./build/assets"))
		.pipe(browserSync.stream());
}

function copyPluginsProd() {
	return gulp.src("./src/plugins/**/*", {
			allowEmpty: true
		})
		.pipe(gulp.dest("./build/plugins"))
		.pipe(browserSync.stream());
}

function cleanCSS() {
	return gulp.src("./build/style/", {
			read: false,
			allowEmpty: true
		})
		.pipe(clean());
}

function cleanHTML() {
	return gulp.src("./build/*.html", {
			read: false,
			allowEmpty: true
		})
		.pipe(clean());
}

function cleanJS() {
	return gulp.src("./build/script/*", {
			read: false,
			allowEmpty: true
		})
		.pipe(clean());
}

function cleanAssets() {
	return gulp.src("./build/assets/*", {
			read: false,
			allowEmpty: true
		})
		.pipe(clean());
}

function cleanPlugins() {
	return gulp.src("./build/plugins/*", {
			read: false,
			allowEmpty: true
		})
		.pipe(clean());
}

function cleanBuild() {
	return gulp.src("./build", {
			read: false,
			allowEmpty: true
		})
		.pipe(clean());
}

function reload(done) {
	browserSync.stream();
	done();
}

function watch() {
	gulp.watch("./src/*.html", gulp.series(HTML));
	gulp.watch("./src/script/*", gulp.series(JS));
	gulp.watch("./src/style/**/*", gulp.series(CSS));
	gulp.watch("./src/assets/**/*", gulp.series(copyAssets));
	gulp.watch("./src/plugins/**/*", gulp.series(copyPlugins));
	// gulp.watch(["./build/**/*", "!./build/style/*", "!./build/assets/*"], reload);
}

function watchProd() {
	gulp.watch("./src/*.html", gulp.series(HTMLProd));
	gulp.watch("./src/script/*", gulp.series(JSProd));
	gulp.watch("./src/style/**/*", gulp.series(CSSProd));
	gulp.watch("./src/assets/**/*", gulp.series(copyAssetsProd));
	gulp.watch("./src/plugins/**/*", gulp.series(copyPluginsProd));
	gulp.watch(["./build/**/*", "!./build/style/*", "!./build/assets/*"], reload);
}

function ttfToWoffF() {
	return gulp.src(['./src/assets/font/*.ttf'])
		.pipe(clean())
		.pipe(ttfToWoff())
		.pipe(gulp.dest('./src/assets/font/'));
}
exports.default = gulp.series(gulp.parallel(CSS, JS, HTML, copyAssets, copyPlugins), browserSyncF, gulp.parallel(watch));
exports.prod = gulp.series(cleanBuild, gulp.parallel(CSSProd, JSProd, HTMLProd, copyAssetsProd, copyPluginsProd), browserSyncFProd, gulp.parallel(watchProd));
exports.imagemin = gulp.series(imageminF);
exports.ttfToWoffG = gulp.series(ttfToWoffF);
