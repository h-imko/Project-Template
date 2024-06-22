/**
 * @type {Object.<string, Set<HTMLInputElement> >} 
 */
let groups = {}

/**
 * @this HTMLInputElement
 */
function update() {
	groups[this.dataset.syncedInputs].forEach(elem => {
		elem.checked = this.checked
	})
}

/**
 * 
 * @param {NodeList | HTMLInputElement[]} [newElements] 
 */
export default function (newElements) {
	(newElements ?? document.querySelectorAll("input[data-synced-inputs]")).forEach(input => {
		let groupID = input.dataset.syncedInputs
		groups[groupID] ??= new Set()
		groups[groupID].add(input)
	})
	Object.values(groups).forEach(group => {
		group.forEach(elem => {
			elem.addEventListener("change", update)
		})
	})
}