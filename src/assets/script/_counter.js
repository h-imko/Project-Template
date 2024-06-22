export default function () {
	document.querySelectorAll(".counter:not(.is-initialized)").forEach(counter => {
		let input = counter.querySelector("input")
		counter.classList.add("is-initialized")

		if (!input.step) {
			input.step = 1
		}

		counter.querySelectorAll(".counter__control").forEach(control => {
			control.forInput = input
			control.addEventListener("click", () => {
				input.stepUp(control.dataset.stepMultiply)
				input.dispatchEvent(new Event("change"))
			})
		})
	})
}