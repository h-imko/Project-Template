import Splide from "@splidejs/splide"
import "fslightbox"
document.addEventListener('DOMContentLoaded', function () {})

function initQuantity() {
	function initQuantityItem(quantity) {
		let input = quantity.querySelector('input[type="number"]')
		quantity.querySelectorAll(".icon")
			.forEach((btn) => {
				btn.addEventListener("click", function () {
					let lastValue = input.value
					input.value = +input.value + +this.dataset.value
					if (+input.value > input.max || +input.value < input.min) {
						input.value = lastValue
					}
				})
			})
		input.addEventListener("input", function () {
			if (!input.checkValidity()) {
				input.value = 0
			}
		})
	}
	document.querySelectorAll('.quantity')
		.forEach(initQuantityItem)
	window.initQuantityItem = initQuantityItem
}

function makeSlideToggle(elem) {
	let initialHeight = getComputedStyle(elem)
		.maxHeight
	return function () {
		if (event) {
			event.preventDefault()
		}
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

function toggleNoscrollBody() {
	if (document.body.classList.contains('noscroll')) {
		document.querySelector('html')
			.classList.remove('noscroll')
		document.body.classList.remove('noscroll')
		document.body.style.paddingRight = ""
	} else {
		document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`
		document.body.classList.add('noscroll')
		document.querySelector('html')
			.classList.add('noscroll')
	}
}

function initPopups() {
	document.querySelectorAll(".popup-opener")
		.forEach(function (button) {
			let targetId = button.dataset.target
			let popup = document.querySelector(`#${targetId}`)
			button.addEventListener('click', function () {
				event.preventDefault()
				event.stopPropagation()
				toggleNoscrollBody()
				popup.classList.add("show")
			})
			popup.querySelectorAll(".popup-closer")
				.forEach(closer => {
					closer.addEventListener("click", function () {
						event.preventDefault()
						event.stopPropagation()
						toggleNoscrollBody()
						popup.classList.remove("show")
					})
				})
		})
}