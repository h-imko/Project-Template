class Quantity {
	quantity: HTMLElement
	input: HTMLInputElement
	contols: {
		all: HTMLElement[],
		add: HTMLElement[],
		subtract: HTMLElement[],
		reset: HTMLElement[]
	}
	max: {
		value: number,
		exists: Boolean
	}
	min: {
		value: number,
		exists: Boolean
	}
	initialValue: Number

	constructor(target: HTMLElement) {
		this.input = target.querySelector('input[type="number"]')

		this.contols.all = [...target.querySelectorAll<HTMLElement>(".quantity__button")]

		this.contols.add.push(...this.contols.all.filter((current) => {
			return parseInt(current.dataset?.delta) > 0
		}))

		this.contols.subtract.push(...this.contols.all.filter((current) => {
			return parseInt(current.dataset?.delta) < 0
		}))

		this.contols.reset.push(...this.contols.all.filter((current) => {
			return current.dataset?.delta == "reset"
		}))

		this.max = {
			value: parseInt(this.input.max),
			exists: this.input.max.length ? true : false
		}

		this.min = {
			value: parseInt(this.input.min),
			exists: this.input.min.length ? true : false
		}

		this.initialValue = parseInt(this.input.value)
	}

	get value() {
		return parseInt(this.input.value)
	}

	set value(newVal) {
		this.input.value = newVal.toString()
	}

	setInitial() {
		this.input.value = this.initialValue.toString()
	}

	bindInputEvents() {
		this.input.addEventListener("change", () => {
			this.processLimit()
		})
	}

	processLimit() {
		if (this.max.exists && (this.value >= this.max.value)) {
			this.value = this.max.value
			this.contols.add.forEach(control => {
				control.toggleAttribute("disabled", true)
			})
		} else if (this.min.exists && (this.value <= this.min.value)) {
			this.value = this.min.value
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

	bindControls() {
		this.contols.all.forEach(control => {
			control.addEventListener("click", () => {
				if (this.contols.reset.includes(control)) {
					this.setInitial()
				} else {
					this.value += parseInt(control.dataset?.delta)
				}
				this.input.dispatchEvent(new Event("change"))
			})
		})
	}
}

export default Quantity