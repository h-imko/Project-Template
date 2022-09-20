class InputContollerGroup {
	constructor(members) {
		this.masters = []
		this.slaves = new Map()

		// this.setMasters(members)
		// this.setSlaves(members)

		members.filter((element) => {
			return element.dataset.controlMode == "master"
		})
		members.filter((element) => {
			return element.dataset.controlMode == "slave"
		}).forEach(slave => {
			this.slaves.set(slave, {
				isInverted: slave.dataset.controlInverted,
				controlType: slave.dataset.controlType ? slave.dataset.controlType : "disable",
				requireds: [...[...slave.querySelectorAll("*:required"), slave.required ? slave : null]]
			})
		})
	}

	setMasters(members) {
		members.filter((element) => {
			return element.dataset.controlMode == "master"
		})
	}

	setSlaves(members) {
		members.filter((element) => {
			return element.dataset.controlMode == "slave"
		}).forEach(slave => {
			this.slaves.set(slave, {
				isInverted: slave.dataset.controlInverted,
				controlType: slave.dataset.controlType ? slave.dataset.controlType : "disable",
				requireds: [...[...slave.querySelectorAll("*:required"), slave.required ? slave : null]]
			})
		})
	}


}

function findGroups() {
	// return Object.values([...document.querySelectorAll("[data-control-group]")].reduce((acc, curr) => {
	// 	let groupname = curr.dataset.controlGroup
	// 	acc[groupname] ? acc[groupname].push(curr) : acc[groupname] = [curr]
	// 	return acc
	// }, {}))

	let biba = {}

	document.querySelectorAll("[data-control-group]").forEach(elem => {
		let groupname = elem.dataset.controlGroup
		biba[groupname] ? biba[groupname].push(elem) : biba[groupname] = [elem]
	})

	return Object.values(biba)
}

export { InputContollerGroup, findGroups }
