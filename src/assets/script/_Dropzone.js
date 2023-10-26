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
		this.dragOverClass = "dropzone--dragover"
		this.emptyClass = "dropzone--empty"
		this.fullClass = "dropzone--full"
		this.dragCounter = 0
		this.isMultiple = this.input.multiple
		this.initialFiles = target.querySelectorAll(".dropzone__list__item--initial")
		this.loadInitials()
		this.checkEmptyState()
		this.bindEvents()
	}

	loadInitials() {
		this.initialFiles.forEach(async (node) => {
			let url = node.dataset.base

			let file = fetch(url)
				.then(res => res.blob())
				.then(blob => {
					return new File([blob], node.dataset.fileName, { type: url.split(";")[0].split(":")[1] })
				})

			let files = new DataTransfer()
			files.items.add(await file)
			node.remove()
			this.add(files.files)
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

	/**
	 *
	 * @param {number} index
	 */
	removeFile(index) {
		this.files.items.remove(index)
		this.bases.splice(index, 1)
		this.fillInput()
		this.checkEmptyState()
		this.checkFullState()
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

	testFileType(type) {
		return this.input.accept.split(",").reduce((acc, pattern) => {
			return new RegExp(pattern).test(type) || acc
		}, false)
	}

	add(incoming) {
		incoming = incoming ?? this.input.files

		this.dropzone.classList.add("dropzone--processing")

		if (Boolean(this.files.items.length && !this.isMultiple)) {
			this.dropzone.querySelector(".dropzone__list__item").remove()
			this.removeFile(0)
		}

		for (let index = 0; index < incoming.length; index++) {
			this.getBase(incoming[index])
				.then((base) => {
					if (!this.testFileType(incoming[index].type)) {
						throw new Error(`Выбран файл недопустимого типа - ${incoming[index].name}`)
					}
					if (!this.bases.includes(base)) {
						this.bases.push(base)
						this.files.items.add(incoming[index])
						this.fillInput()
						this.appendItem(this.makeListItem(incoming[index], base))
						this.checkEmptyState()
						this.checkFullState()
					}
				})
				.catch(error => { alert(error.message ?? "Произошла ошибка обработки файла") })
				.finally(() => {
					if (index == incoming.length - 1) {
						this.dropzone.classList.remove("dropzone--processing")
					}
				})
		}
	}

	checkFullState() {
		this.dropzone.classList.toggle(this.fullClass, Boolean(this.files.items.length) && !this.isMultiple)
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