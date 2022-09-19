class Dropzone {
	/**
	 *
	 * @param {Element} target
	 */
	constructor(target) {
		this.fileList = {}
		this.fileListRaw = []
		this.dropzone = target
		this.inner = target.querySelector(".inner")
		this.input = target.querySelector("input[type=file]")
		this.limit = this.input.dataset.fileLimit || Number.MAX_SAFE_INTEGER
		this.changeEvent = new Event("filelistChanged")

		this.bindEvents()
	}

	clearVisual() {
		this.inner.innerHTML = ""
	}

	async prepareFileList() {
		this.fileList = {}

		for (let index = 0; index < this.fileListRaw.length; index++) {
			const file = this.fileListRaw[index]
			this.fileList[await file.text()] = file
		}

		Object.keys(this.fileList).slice(this.limit - 1, -1).forEach(key => {
			delete this.fileList[key]
		})

		this.fileListRaw = Object.values(this.fileList)
	}

	setFullStatus() {
		if (this.fileList.length == this.limit) {
			this.dropzone.classList.add("dropzone-full")
		} else {
			this.dropzone.classList.remove("dropzone-full")
		}
	}

	/**
	 *
	 * @param {File} file
	 * @returns	{(Promise<String|null>|ProgressEvent<FileReader>)}
	 */
	getBase64(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.readAsDataURL(file)
			reader.onload = () => resolve(reader.result)
			reader.onerror = error => reject(error)
		})
	}

	makeMiniatures() {
		Object.entries(this.fileList).forEach(([key, value], index) => {
			let wrapper = document.createElement("div")
			wrapper.classList.add("file")
			wrapper.setAttribute("data-filename", value.name)

			wrapper.addEventListener("click", (event) => {
				event.stopPropagation()
				this.fileListRaw.splice(index, 1)
				this.dropzone.dispatchEvent(this.changeEvent)
			})

			this.getBase64(value).then(base => {
				wrapper.style.setProperty("background-image", `url(${base})`)
			})

			this.inner.append(wrapper)
		})
	}

	/**
	 *
	 * @param {Event} event
	 */
	handleDrop(event) {
		event.preventDefault()

		if (event.dataTransfer.items) {
			for (let item of event.dataTransfer.items) {
				if (item.kind === 'file' && item.type === "image/jpeg" || item.type === "image/png") {
					this.fileListRaw.push(item.getAsFile())
				}
			}
		} else if (event.dataTransfer.files) {
			for (const item of event.dataTransfer.files) {
				if (item.type === "image/jpeg" || item.type === "image/png") {
					this.fileListRaw.push(item)
				}
			}
		} else {
			console.warn("такой дроп не поддерживается")
		}

		this.dropzone.dispatchEvent(this.changeEvent)
	}

	async handleChoose() {
		for (const file of this.input.files) {
			this.fileListRaw.push(file)
		}
		this.dropzone.dispatchEvent(this.changeEvent)
	}

	syncInputToFileList() {
		let dt = new DataTransfer()
		Object.values(this.fileList).forEach(file => {
			dt.items.add(file)
		})
		this.input.files = dt.files
	}

	async refreshDropzone() {
		await this.prepareFileList()
		this.clearVisual()
		this.makeMiniatures()
		this.setFullStatus()
		this.syncInputToFileList()
	}

	bindEvents() {
		this.input.addEventListener('change', () => { this.handleChoose() })

		this.dropzone.addEventListener('drop', (event) => { this.handleDrop(event) })

		this.dropzone.addEventListener('dragover', (event) => {
			event.preventDefault()
		})

		this.inner.addEventListener("click", () => {
			this.input.click()
		})

		this.dropzone.addEventListener('filelistChanged', () => {
			this.refreshDropzone()
		})
	}
}

export default Dropzone