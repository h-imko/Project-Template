class Slave {
	element: HTMLElement
	controlType: string
	requireds: HTMLElement[]

	constructor(element: HTMLElement) {
		this.element = element
		this.controlType = element.dataset.controlType ? element.dataset.controlType : "disable"
		this.requireds = [...element.querySelectorAll<HTMLElement>("*:required")]

		if (element.hasAttribute("required")) {
			this.requireds.push(this.element)
		}
	}

	#toggleSelf() {
		switch (this.controlType) {
			case "display": {
				this.element.toggleAttribute("hidden")
				break
			}
			case "disable": {
				this.element.toggleAttribute("disabled")
				break
			}
		}
	}

	#toggleRequired() {
		this.requireds.forEach(element => {
			element.toggleAttribute("required")
		})
	}

	toggleAll() {
		this.#toggleSelf()
		this.#toggleRequired()
	}
}

class InputControllerGroup {
	masters: HTMLElement[]
	slaves: Slave[]

	constructor(members: HTMLElement[]) {
		this.masters = members.filter((element) => {
			return element.dataset.controlMode == "master"
		})

		this.slaves = members.filter((element) => {
			return element.dataset.controlMode == "slave"
		}).map((curr) => {
			return new Slave(curr)
		})

		this.#bindEvents()
	}

	#bindEvents() {
		this.masters.forEach(master => {
			master.addEventListener("change", () => {
				this.slaves.forEach(slave => {
					slave.toggleAll()
				})
			})
		})
	}

	static findGroups = function () {
		return Object.values<HTMLElement[]>([...document.querySelectorAll<HTMLElement>("[data-control-group]")].reduce((acc, curr) => {
			let groupname = curr.dataset.controlGroup

			if (groupname) {
				acc[groupname] ? acc[groupname].push(curr) : acc[groupname] = [curr]
			}

			return acc
		}, {}))
	}
}

export default InputControllerGroup