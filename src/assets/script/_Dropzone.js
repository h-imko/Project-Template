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
		this.dragOverClass = "dropzone--dragover"
		this.emptyClass = "dropzone--empty"
		this.dragCounter = 0
		this.checkEmptyState()
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

	/**
	 *
	 * @param {number} index
	 */
	removeFile(index) {
		this.files.items.remove(index)
		this.bases.splice(index, 1)
		this.fillInput()
		this.checkEmptyState()
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

		return item
	}

	/**
	 *
	 * @param {HTMLElement} item
	 */
	appendItem(item) {
		this.list.insertBefore(item, this.placeholder)
	}

	add() {
		let incoming = this.input.files
		this.dropzone.classList.add("dropzone--processing")

		for (let index = 0; index < incoming.length; index++) {
			this.getBase(incoming[index]).then((base) => {
				if (!this.bases.includes(base)) {
					this.bases.push(base)
					this.files.items.add(incoming[index])
					this.fillInput()
					this.appendItem(this.makeListItem(incoming[index], base))
					this.checkEmptyState()
				}
			}).catch((error) => {
				alert("Произошла ошибка обработки файла")
			}).finally(() => {
				if (index == incoming.length - 1) {
					this.dropzone.classList.remove("dropzone--processing")
				}
			})
		}
	}

	checkEmptyState() {
		this.dropzone.classList.toggle(this.emptyClass, !this.files.items.length)
	}

	fillInput() {
		this.input.files = this.files.files
	}

	checkDragStatus() {
		this.dropzone.classList.toggle(this.dragOverClass, this.dragCounter)
	}

	resetDragStatus() {
		this.dragCounter = 0
		this.checkDragStatus()
	}

	bindEvents() {
		this.input.addEventListener('change', () => {
			this.resetDragStatus()
			this.add()
		})

		this.dropzone.addEventListener('dragenter', () => {
			this.dragCounter++
			this.checkDragStatus()
		})

		this.dropzone.addEventListener('dragenter', () => {
			this.checkDragStatus()
		})

		this.dropzone.addEventListener('dragleave', () => {
			this.dragCounter--
			this.checkDragStatus()
		})
	}
}

export default Dropzone