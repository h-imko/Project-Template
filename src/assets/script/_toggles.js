let toggles = {}

let toggleObserver = new MutationObserver((mutatuions) => {
	mutatuions.forEach(mutation => {
		let oldClass = mutation.oldValue.length ? mutation.oldValue.split(" ") : []
		let diff = oldClass.filter(x => ![...mutation.target.classList].includes(x)).concat([...mutation.target.classList].filter(x => !oldClass.includes(x)))

		diff.forEach(diffClass => {
			let currentState = mutation.target.classList.contains(diffClass)
			toggles[mutation.target.dataset.toggleId][diffClass]?.forEach(toggler => {
				toggler.classList.toggle("is-active", toggler.force == undefined ? currentState : toggler.force == currentState)
			})
		})
	})
})

export default function () {
	document.querySelectorAll("[data-toggle-id]").forEach(target => {
		let id = target.dataset.toggleId
		toggles[id] ??= {}

		toggleObserver.observe(target, {
			attributes: true,
			attributeFilter: ["class"],
			attributeOldValue: true
		})

		document.querySelectorAll(`[data-toggle-for=${id}]:not([data-toggle-initialized])`).forEach(toggler => {
			toggler.toggleAttribute("data-toggle-initialized")
			let token = toggler.dataset.toggleToken ?? "is-active"
			let defaultState = target.classList.contains(token)
			let force = toggler.dataset.toggleState ? Boolean(+toggler.dataset.toggleState) : undefined

			toggles[id][token] ??= new Set()
			toggler.force = force
			toggles[id][token].add(toggler)

			toggler.classList.toggle("is-active", force == undefined ? defaultState : force == defaultState)
			toggler.addEventListener("click", () => {
				target.classList.toggle(toggler.dataset.toggleToken ?? "is-active", force)
			})
		})
	})
}