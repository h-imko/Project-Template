class Quantity {
	/**
	 *
	 * @param {HTMLElement} target
	 */
	constructor(target) {
		this.quantity = target
		this.input = target.querySelector('input[type="number"].quantity__input')
		this.controls = {
			add: [...target.querySelectorAll(".quantity__button.quantity__button--add")],
			subtract: [...target.querySelectorAll(".quantity__button.quantity__button--subtract")]
		}
		this.max = Number(this.input.getAttribute("max")) ?? Number.MAX_SAFE_INTEGER
		this.min = Number(this.input.getAttribute("min")) ?? Number.MIN_SAFE_INTEGER

		this.bindControls()
		this.bindInputEvents()
	}

	bindControls() {
		this.controls.add.forEach(button => {
			button.addEventListener("click", () => {
				this.input.stepUp(button.dataset.step || undefined)
			})
		})

		this.controls.subtract.forEach(button => {
			button.addEventListener("click", () => {
				this.input.stepDown(button.dataset.step || undefined)
			})
		})
	}

	bringToLimit() {
		let curr = Number(this.input.value)

		if (curr > this.max) {
			this.input.value = this.max
			return true
		} else if (curr < this.min) {
			this.input.value = this.min
			return true
		} else {
			return false
		}
	}

	bindInputEvents() {
		this.input.addEventListener("change", () => {
			if (this.bringToLimit()) {
				this.input.dispatchEvent(new Event("change"))
			}
		})
	}
}

export default Quantity