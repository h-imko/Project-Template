import path from "path"
import stream from "stream"


export function changeExt(fileName, newExt, ...oldExt) {
	let pathObject = path.parse(fileName)
	let currExt = pathObject.ext

	if (oldExt.includes(currExt) || !oldExt.length) {
		return path.format({ ...pathObject, base: '', ext: newExt })
	} else {
		return fileName
	}
}

export function nothing(callback = () => { }) {
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

export function transform(func) {
	return new stream.Transform({
		readableObjectMode: true,
		writableObjectMode: true,
		transform: func
	})
}
