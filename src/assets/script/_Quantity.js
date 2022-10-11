class Quantity {
	/**
	 *
	 * @param {HTMLElement} target
	 */
	constructor(target) {
		this.quantity = target
		this.input = target.querySelector('input[type="number"]')
		this.contols = {
			all: [...target.querySelectorAll(".quantity__button")],
			add: [],
			subtract: [],
			reset: [],
		}
		this.contols.add.push(...this.contols.all.filter((current) => {
			return +current.dataset?.delta > 0
		}))
		this.contols.subtract.push(...this.contols.all.filter((current) => {
			return +current.dataset?.delta < 0
		}))
		this.contols.reset.push(...this.contols.all.filter((current) => {
			return current.dataset?.delta == "reset"
		}))
		this.max = {
			value: +this.input.max,
			exists: this.input.max.length ? true : false
		}
		this.min = {
			value: +this.input.min,
			exists: this.input.min.length ? true : false
		}
		this.initialValue = +this.input.value

		this.setInitial()
		this.bindControls()
		this.bindInputEvents()
	}

	setInitial() {
		this.input.value = this.initialValue
	}

	processLimit() {
		console.log(this.min.exists, this.input.value, this.min.value)
		if (this.max.exists && (this.input.value >= this.max.value)) {
			this.input.value = this.max.value
			this.contols.add.forEach(control => {
				control.toggleAttribute("disabled", true)
			})
		} else if (this.min.exists && (this.input.value <= this.min.value)) {
			this.input.value = this.min.value
			this.contols.subtract.forEach(control => {
				control.toggleAttribute("disabled", true)
			})
		} else {
			this.contols.subtract.forEach(control => {
				control.toggleAttribute("disabled", false)
			})
			return
		}
	}

	bindInputEvents() {
		this.input.addEventListener("change", () => {
			this.processLimit()
		})
	}

	bindControls() {
		this.contols.all.forEach(control => {
			control.addEventListener("click", () => {
				if (this.contols.reset.includes(control)) {
					this.setInitial()
				} else {
					this.input.value = +this.input.value + +control.dataset?.delta
				}
				this.input.dispatchEvent(new Event("change"))
			})
		})
	}
}
export default Quantity