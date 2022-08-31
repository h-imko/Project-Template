import "fslightbox"
import Cleave from "cleave.js"
import 'cleave.js/dist/addons/cleave-phone.ru'
import Splide from "@splidejs/splide"
import Tippy from "tippy.js"

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

function toggleNoscrollBody(action) {

	function disable() {
		document.body.style.setProperty("--scroll-position", `${window.pageYOffset}px`)
		document.body.style.setProperty("--scrollbar-width", `${window.innerWidth - document.documentElement.clientWidth}px`)
		document.body.classList.add('noscroll')
	}

	function enable() {
		document.body.classList.remove('noscroll')
		window.scrollTo({
			top: document.body.style.getPropertyValue('--scroll-position')
				.replace('px', ""),
			left: 0,
			behavior: "instant"
		})
	}

	function toggle() {
		if (document.body.classList.contains('noscroll')) {
			enable()
		} else {
			disable()
		}
	}

	if (typeof action !== "undefined") {
		if (action) {
			disable()
		} else {
			enable()
		}
	} else {
		toggle()
	}

}

function headerHeightToCSS() {
	document.querySelector(':root')
		.style.setProperty('--header-height', `${document.querySelector('header').getBoundingClientRect().height}px`)
}

function initPopups() {
	document.querySelectorAll("[data-popup]").forEach(function (popup) {
		let openedClass = "show"
		let inner = popup.querySelector(".popup__inner")
		let controllers = Array.from(document.querySelectorAll(`[data-popup-target="${popup.id}"]`))
		let openers = controllers.filter(controller => controller.dataset.popupControl == "open")
		let togglers = controllers.filter(controller => controller.dataset.popupControl == "toggle")
		let closers = [...controllers.filter(controller => controller.dataset.popupControl == "close"), ...popup.querySelectorAll(".popup__selfcloser")]

		function closePopup(event) {
			popup.classList.remove(openedClass)
			toggleNoscrollBody(false)
		}

		function openPopup(event) {
			popup.classList.add(openedClass)
			toggleNoscrollBody(true)
		}

		function togglePopup(event) {
			popup.classList.toggle(openedClass)
			toggleNoscrollBody()
		}

		window[`closePopup_${popup.id}`] = closePopup
		window[`openPopup_${popup.id}`] = openPopup
		window[`togglePopup_${popup.id}`] = togglePopup

		openers.forEach(function (opener) {
			opener.addEventListener('click', function () {
				openPopup()
				opener.classList.add("popup-controller--active")
			})
		})

		togglers.forEach(function (toggler) {
			toggler.addEventListener('click', function () {
				togglePopup()
				toggler.classList.toggle("popup-controller--active")
			})
		})

		closers.forEach(function (closer) {
			closer.addEventListener('click', function () {
				closePopup()
			})
		})

		document.addEventListener('click', function (event) {
			if (!ifClickInside(event, [inner, ...openers, ...togglers, ...closers]) && popup.classList.contains(openedClass)) {
				closePopup(event)
			}
		})
	})
}

function ifClickInside(event, targets) {

	targets.reduce(function (accumulator, currentValue, index, array) {
		return accumulator + event.composedPath().includes(currentValue)
	}, false)

	return targets.reduce(function (accumulator, currentValue, index, array) {
		return accumulator + event.composedPath().includes(currentValue)
	}, false)
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
					console.log(input.min, input.max)
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