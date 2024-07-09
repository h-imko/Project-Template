import { breakpoints, ifClickInside } from "./_helpers"

export default function select() {
	document.querySelectorAll(".custom-select:not(.is-initialized)").forEach(custom => {
		let select = custom.querySelector("select")
		let options = [...select.options]
		let customList = custom.querySelector(".custom-select__list")
		let customLabel = custom.querySelector(".custom-select__label")
		let customOptions = []

		function toggle(force) {
			customList.classList.toggle("is-active", force)
			customLabel.classList.toggle("is-active", force)
			custom.classList.remove("is-active", force)
		}

		options.forEach(option => {
			let customOption = document.createElement("div")
			customOption.classList.add("custom-select__option")
			customOption.classList.toggle("is-active", option.selected)
			customOption.classList.toggle("is-disabled", option.disabled)
			customOption.textContent = option.text

			if (!option.disabled) {
				customOption.addEventListener("click", () => {
					if (!select.multiple) {
						toggle(false)
					}
					option.selected = !option.selected
					select.dispatchEvent(new Event("change"))
				})
			}

			customOptions.push(customOption)
		})

		customList.append(...customOptions)
		select.classList.add("is-hidden")

		customLabel.addEventListener("click", () => {
			if (window.matchMedia(`(max-width: ${breakpoints.mobile}px)`).matches) {
				select.showPicker()
			} else {
				toggle()
			}
		})

		document.addEventListener("click", (event) => {
			if (!ifClickInside(event, customList, customLabel)) {
				toggle(false)
			}
		})

		custom.classList.add("is-initialized")
	})
}