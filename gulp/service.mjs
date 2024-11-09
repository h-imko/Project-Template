import path from "path"
import stream from "stream"
import Vinyl from "vinyl"

function changeExt(fileName, newExt, ...oldExt) {
	let pathObject = path.parse(fileName)
	let currExt = pathObject.ext

	if (oldExt.includes(currExt) || !oldExt.length) {
		return path.format({ ...pathObject, base: "", ext: newExt })
	} else {
		return fileName
	}
}

function nothing() {
	return new stream.PassThrough().end()
}

/**
 *
 * @param {(chunk: Vinyl, encoding: BufferEncoding, callback: stream.TransformCallback)=> void } func
 * @returns stream.Transform
 */

function transform(func) {
	return new stream.Transform({
		readableObjectMode: true,
		writableObjectMode: true,
		transform: func
	})
}

function printPaintedMessage(message, module) {
	message = message.replaceAll("..\\", "").replaceAll(/[A-Za-z]+:*[\\/][а-яА-Яa-zA-Z-_.\\/]+/gm, "\x1b[35m$&\x1b[0m")
	console.log(`[\x1b[31m${module}\x1b[0m] ${message}`)
}

export { changeExt, nothing, transform, printPaintedMessage }