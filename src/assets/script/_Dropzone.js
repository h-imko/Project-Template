export default function () {
	document.querySelectorAll(".dropzone:not(.is-initialized)").forEach(dropzone => {
		dropzone.classList.add("is-initialized")
		let input = dropzone.querySelector("input")
		let list = dropzone.querySelector(".dropzone__list")
		let files = new Set()
		let accept = input.accept
		let maxlength = input.dataset.maxlength
		let maxsize = input.dataset.maxsize

		/**
		 * 
		 * @param {File} file 
		 */
		function makeThumb(file) {
			let thumb = document.createElement("div")
			thumb.classList.add("dropzone__item")
			thumb.setAttribute("title", file.name)

			let remover = document.createElement("button")
			remover.classList.add("dropzone__item__remove")
			remover.type = "button"
			remover.addEventListener("click", (event) => {
				event.preventDefault()
				files.delete(file)
				thumb.remove()
				URL.revokeObjectURL(file.img)
				update()
			})

			let preview = document.createElement("a")
			preview.classList.add("dropzone__item__preview")
			preview.setAttribute("target", "_blank")

			let previewImg = document.createElement("img")
			preview.append(previewImg)

			if (file.img) {
				previewImg.setAttribute("src", file.img)
				preview.setAttribute("href", file.img)
			}

			thumb.append(preview, remover)

			return thumb
		}

		function update() {
			let fileBuffer = new DataTransfer()
			files.forEach(file => {
				fileBuffer.items.add(file)
			})
			input.files = fileBuffer.files
			dropzone.classList.toggle("is-full", files.size == maxlength)
		}

		input.addEventListener("change", function () {
			for (const file of this.files) {
				if (accept && (!accept.includes(file.type) || !file.type)) {
					alert(`Файл такого типа не поддерживается - ${file.name}`)
				} else if (files.size == maxlength) {
					alert(`Превышено максимальное количество файлов, файл ${file.name} не будет загружен`)
				} else if (file.size > maxsize) {
					alert(`Превышен максимальный размер файла - ${file.name}`)
				} else {
					files.add(file)
					if (file.type.includes("image")) {
						file.img = URL.createObjectURL(file)
					}
					list.append(makeThumb(file))
				}
			}

			update()
		})

		input.addEventListener("dragenter", () => {
			input.classList.add("is-dragover")
		})
		input.addEventListener("dragleave", () => {
			input.classList.remove("is-dragover")
		})
	})
}