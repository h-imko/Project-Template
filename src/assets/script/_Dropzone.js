class Dropzone {
	/**
	 *
	 * @param {HTMLElement} target
	 */
	constructor(target) {
		this.dropzone = target
		this.input = target.querySelector("input[type=file].dropzone__input")
		this.list = target.querySelector(".dropzone__list")
		this.placeholder = target.querySelector(".dropzone__list__item--placeholder")
		this.files = new DataTransfer()
		this.bases = []
		this.changeEvent = new Event("dropzonechange")
		this.bindEvents()
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
		this.fillInput()
	}

	/**
	 *
	 * @param {File} file
	 * @param {Boolean} addBase
	 * @returns {HTMLLIElement}
	 */
	makeListItem(file, base) {
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
				this.removeFile(Array.from(item.parentNode.children).indexOf(item))
				item.remove()
			})
		} else {
			item.classList.add("dropzone__list__item--placeholder")
		}
		return item
	}

	appendItem(item) {
		this.list.insertBefore(item, this.placeholder)
	}

	add() {
		let incoming = this.input.files

		for (const file of incoming) {
			this.getBase(file).then(base => {
				if (!this.bases.includes(base)) {
					this.bases.push(base)
					this.files.items.add(file)
					this.fillInput()
					this.appendItem(this.makeListItem(file, base))
				}
			})
		}
	}

	fillInput() {
		this.input.files = this.files.files
	}

	bindEvents() {
		this.input.addEventListener('change', () => { this.add() })
	}
}

export default Dropzone