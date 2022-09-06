import "fslightbox"
import Cleave from "cleave.js"
import 'cleave.js/dist/addons/cleave-phone.ru'
import Splide from "@splidejs/splide"
import Tippy from "tippy.js"
import { Popup } from "./_Popup"

document.addEventListener('DOMContentLoaded', function () {
	initPopups()
	initTabs()
	initPhoneMask()
})

window.addEventListener("load", function () {
	headerHeightToCSS()
	initSpoilers()
})

function initPhoneMask() {
	document.querySelectorAll('input[type=tel]')
		.forEach(input => {
			new Cleave(input, {
				phone: true,
				phoneRegionCode: "RU",
				delimiter: "-",
				prefix: "+7",
				noImmediatePrefix: true
			})
		})
}

function headerHeightToCSS() {
	document.querySelector(':root')
		.style.setProperty('--header-height', `${document.querySelector('header').getBoundingClientRect().height}px`)
}

function initPopups() {
	document.querySelectorAll("[data-popup]").forEach(function (popup) {
		new Popup(popup).bindGlobalControls()
	})
}

function initTabs() {
	let controls = document.querySelectorAll(".tabs__control input[type=radio]")

	function updateSlave(master, slave) {
		if (master.checked) {
			slave.checked = true
		}
	}

	controls.forEach(master => {
		let slave = document.querySelector(`#${master.dataset.target}`)

		updateSlave(master, slave)
		master.addEventListener("change", () => {
			updateSlave(master, slave)
		})
	})
}

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

function makeSlideToggle(elem) {
	let initialHeight = getComputedStyle(elem)
		.maxHeight
	return function (event) {
		event?.preventDefault()

		if (elem.style.maxHeight == "") {
			elem.focus()
			elem.style.maxHeight = `${elem.scrollHeight}px`
		} else if (elem.style.maxHeight != initialHeight) {
			elem.blur()
			elem.style.maxHeight = initialHeight
		} else {
			elem.focus()
			elem.style.maxHeight = `${elem.scrollHeight}px`
		}
	}
}

function initSpoilers() {
	document.querySelectorAll('.spoiler')
		.forEach(spoiler => {
			let slideToggle = makeSlideToggle(spoiler.querySelector(".spoiler__content"))
			spoiler.querySelector('.spoiler__toggler')
				.addEventListener('click', function () {
					if (!spoiler.classList.contains("spoiler--hard")) {
						slideToggle()
					}
					spoiler.classList.toggle("spoiler--is-opened")
				})
			if (spoiler.dataset.spoilerDefaultOpened) {
				slideToggle()
			}
		})
}

function initQuantity() {
	function initQuantityItem(quantity) {
		let input = quantity.querySelector('input[type="number"]')
		let btnPlus = quantity.querySelector(".quantity--button:last-of-type")
		let btnMinus = quantity.querySelector(".quantity--button:first-of-type")
		new Array(btnPlus, btnMinus)
			.forEach((btn) => {
				btn.addEventListener("click", function () {
					let newValue = +input.value + +this.dataset.value
					if (input.min == "" || input.max == "") {
						input.value = newValue
						return
					}
					if (newValue < input.min) {
						btnMinus.setAttribute("disabled", "")
					} else if (newValue > input.max) {
						btnPlus.setAttribute("disabled", "")
					} else if (newValue == input.max) {
						input.value = newValue
						btnPlus.setAttribute("disabled", "")
					} else if (newValue == input.min) {
						input.value = newValue
						btnMinus.setAttribute("disabled", "")
					} else {
						input.value = newValue
						btnPlus.removeAttribute("disabled")
						btnMinus.removeAttribute("disabled")
					}
				})
			})
		input.addEventListener("change", function () {
			if (!input.checkValidity()) {
				if (input.value > input.max) {
					input.value = input.max ? input.max : 0
				}
				if (input.value < input.min) {
					input.value = input.min ? input.min : 0
				}
			}
		})
	}
	document.querySelectorAll('.quantity')
		.forEach(initQuantityItem)
	window.initQuantityItem = initQuantityItem
}