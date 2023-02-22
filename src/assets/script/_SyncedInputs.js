class SyncedInputs {
	/**
	 *
	 * @param  {...HTMLInputElement} inputs
	 */
	constructor(...inputs) {
		this.items = inputs
		this.items.forEach(item => {
			item.addEventListener("change", () => {
				let checked = item.checked
				this.items.forEach(item => {
					item.checked = checked
				})
			})
		})
	}

	static findGroups() {
		return Object.values([...document.querySelectorAll("[data-synced-inputs]")].reduce((acc, input) => {
			acc[input.dataset.syncedInputs] = [...acc[input.dataset.syncedInputs] ?? [], input]
			return acc
		}, {}))
	}
}
export default SyncedInputs