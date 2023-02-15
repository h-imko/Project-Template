class item {
	/**
	 *
	 * @param {HTMLElement} group
	 */
	constructor(group) {
		this.list = {}
		this.items = [...group.querySelectorAll("[data-animate]")]
		this.ignorePriority = false

		this.items.forEach(item => {
			let priority = item.dataset.animatePriority ?? null
			this.list[priority] ? this.list[priority].push(item) : this.list[priority] = [item]
		})

		this.bindEnds()

		this.items.forEach(item => {
			item.addEventListener("click", () => {
				this.runOne(item)
			})
		})
		this.runGroup(this.groups[0])
	}

	get groups() {
		return Object.values(this.list)
	}

	bindQueue() {

	}

	bindEnds() {
		function isGroupDone() { }

		this.items.forEach(item => {
			let animations = item.getAnimations()
			animations.forEach((animation, index) => {
				animation.addEventListener("finish", () => {
					animations[index + 1] ? animations[index + 1].play() : item.dispatchEvent(new Event("animationsend"))
				})
			})
		})

		this.groups.forEach((group, i, groups) => {
			group.forEach((item, j) => {
				item.addEventListener("animationsend", () => {
					console.log(isGroupDone(group))

					if (false) {
						console.log("done")

						group.forEach(item => {
							item.dispatchEvent(new Event("animationsgroupend"))
						})
					}
				})
			})
		})
	}

	runOne(item) {
		item.getAnimations()[0].play()
	}

	runGroup(group) {
		group?.forEach(item => {
			this.runOne(item)
		})
	}

	runAll() {
		this.items.forEach(item => {
			this.runOne(item)
		})
	}

	stopOne(item) {
		item.style.setProperty("--play", "paused")
	}

	resetOne(item) {
		let iterations = getComputedStyle(item).getPropertyValue("--iterations")
		item.style.setProperty("--iterations", iterations + 1)
	}

	resetAll() {
		this.items.forEach(item => {
			this.resetOne(item)
		})
	}

	start() {
		this.runGroup(this.groups[0])
	}

	restart() {
		this.resetAll()
		this.start()
	}

	restartHard() {
		this.resetAll()
		this.runAll()
	}
}

export default item