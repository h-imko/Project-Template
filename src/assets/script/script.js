import Splide from "@splidejs/splide"
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