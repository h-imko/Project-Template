import browserSync from "browser-sync"
import gulp from "gulp"
import gulpMemory from "gulp-mem"

function getArgs() {
	return process.argv.slice(2).reduce(function (acc, curr, index, array) {
		if (curr.startsWith("--")) {
			return Object.assign(acc, { [curr.replace("--", "")]: (!array[index + 1] || array[index + 1]?.startsWith("--")) ? true : array[index + 1] })
		}
		else {
			return acc
		}
	}, {})
}

const gulpMem = new gulpMemory(),
	argv = getArgs(),
	destGulp = argv.ram ? gulpMem : gulp,
	bs = browserSync.create(),
	convertingImgTypes = [".png", ".jpg", ".jpeg", ".webp"]

gulpMem.logFn = null
gulpMem.serveBasePath = "./build"

export { bs, argv, convertingImgTypes, gulpMem, destGulp }