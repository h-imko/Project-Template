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

export default initQuantity