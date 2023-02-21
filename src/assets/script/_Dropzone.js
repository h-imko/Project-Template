class Dropzone {
	/**
	 *
	 * @param {HTMLElement} target
	 */
	constructor(target) {
		this.dropzone = target
		this.input = target.querySelector("input[type=file].dropzone__input")
		this.list = target.querySelector(".dropzone__list")
		this.files = new DataTransfer()
		this.bases = []
		this.changeEvent = new Event("dropzonechange")
		this.bindEvents()
	}

	get entries() {
		return [...this.files.files].map((file, index) => {
			return { file: file, base: this.bases[index] }
		})
	}

	/**
	 *
	 * @param {File} file
	 * @returns	{(Promise<String|null>|ProgressEvent<FileReader>)}
	 */
	getBase(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.readAsDataURL(file)
			reader.onload = () => resolve(reader.result)
			reader.onerror = error => reject(error)
		})
	}

	removeFile(index) {
		this.files.items.remove(index)
		this.bases.splice(index, 1)
		this.dropzone.dispatchEvent(this.changeEvent)
	}

	/**
	 *
	 * @param {File} file
	 * @param {Boolean} addBase
	 * @returns {HTMLLIElement}
	 */
	makeListItem(index, { file, base } = {}) {
		let item = document.createElement("li")
		item.classList.add("dropzone__list__item")

		if (file) {
			item.setAttribute("data-file-name", file.name)

			if (`${file.type}`.startsWith("image")) {
				let img = document.createElement("img")
				img.classList.add("dropzone__list__item__preview")
				img.setAttribute("src", base)
				item.appendChild(img)
			}
			item.addEventListener("click", () => {
				this.removeFile(index)
			})
		} else {
			item.classList.add("dropzone__list__item--placeholder")
		}
		return item
	}

	fillList() {
		if (this.entries.length) {
			this.list.replaceChildren(...[...this.entries].map(((entry, index) => {
				return this.makeListItem(index, entry)
			})))
		} else {
			this.list.replaceChildren(this.makeListItem())
		}
	}

	readInput() {
		let incoming = this.input.files

		for (const file of incoming) {
			this.getBase(file).then(base => {
				if (!this.bases.includes(base)) {
					this.bases.push(base)
					this.files.items.add(file)
					this.dropzone.dispatchEvent(this.changeEvent)
				}
			})
		}
	}

	fillInput() {
		this.input.files = this.files.files
	}

	bindEvents() {
		this.input.addEventListener('change', () => { this.readInput() })

		this.dropzone.addEventListener(this.changeEvent.type, () => {
			this.fillList()
			this.fillInput()
		})
	}
}

export default Dropzone