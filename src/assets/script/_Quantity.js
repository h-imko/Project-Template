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
		this.step = Number(this.input.step) || 1
		console.log(this.step)


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

	limit() {
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

	floor() {
		let curr = Number(this.input.value)
		let floored = curr - curr % this.step
		if (curr == floored) {
			return false
		} else {
			this.input.value = floored
			return true
		}
	}

	bindInputEvents() {
		this.input.addEventListener("change", () => {
			if (this.limit()) {
				this.input.dispatchEvent(new Event("change"))
			}
			if (this.floor()) {
				this.input.dispatchEvent(new Event("change"))
			}
		})
	}
}

export default Quantity