import path from "path"
import stream from "stream"
import { cwd } from "process"
import Vinyl from "vinyl"

function changeExt(fileName, newExt, ...oldExt) {
	let pathObject = path.parse(fileName)
	let currExt = pathObject.ext

	if (oldExt.includes(currExt) || !oldExt.length) {
		return path.format({ ...pathObject, base: '', ext: newExt })
	} else {
		return fileName
	}
}

function nothing(callback = () => { }) {
	callback()
	return new stream.PassThrough({
		readableObjectMode: true,
		writableObjectMode: true
	})
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
	let errors = [...message.matchAll(new RegExp(/(?:[A-Za-z]+:*\\[а-яА-Яa-zA-Z-_.\\/]+)|('[а-яА-Яa-zA-Z-_.\\/]+')/gm))]
		.map(function (error) {
			return {
				text: path.relative(cwd(), error[0]),
				index: error.index,
				length: error[0].length
			}
		})
		.reverse()
	message = message.split("")
	errors.forEach(error => {
		message.splice(error.index, error.length, "\x1b[0m", '\x1b[35m', error.text, "\x1b[0m")
	})
	console.log(`[\x1b[31m${module}\x1b[0m] ${message.join("")}`)
}

export { changeExt, nothing, transform, printPaintedMessage }