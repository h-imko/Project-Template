class Animate {
	/**
	 *
	 * @param {HTMLElement} group
	 */
	constructor(group) {
		this.list = {}

		group.querySelectorAll("[data-animate]").forEach(item => {
			let priority = item.dataset.animatePriority ?? null
			this.list[priority] = this.list[priority] || []
			this.list[priority].push({ target: item, animations: item.getAnimations() })
		})

		this.bindEnds()
		this.bindQueue()

		for (const key in this.list) {
			this.list[key].forEach(item => {
				item.target.addEventListener("click", () => {
					this.stopOne(item)
					this.startOne(item)
				})
			})
		}

		window.biba = this
		this.start()
	}

	get groups() {
		return Object.values(this.list)
	}

	get items() {
		return Object.values(this.list).flat()
	}

	bindQueue() {
		this.items.forEach(item => {
			item.animations.forEach((animation, index, animations) => {
				animation.addEventListener("finish", () => {
					animations[index + 1]?.play()
				})
			})
		})
	}

	bindEnds() {
		function isGroupDone(group) {
			return group.reduce((acc, item) => {
				return acc && item.animations.reduce((acc, animation) => {
					return acc && animation.playState == "finished"
				}, true)
			}, true)
		}

		this.items.forEach(item => {
			item.animations.forEach((animation, index, animations) => {
				animation.addEventListener("finish", () => {
					animations[index + 1] || item.target.dispatchEvent(new Event("animationsend"))
				})
			})
		})

		this.groups.forEach(group => {
			group.forEach(item => {
				item.target.addEventListener("animationsend", () => {
					if (isGroupDone(group)) {
						group.forEach(item => { item.target.dispatchEvent(new Event("animationgroupend")) })
					}
				})
			})
		})
	}

	startOne(item) {
		item.animations[0].play()
	}

	restartOne(item) {
		this.stopOne(item)
		this.startOne(item)
	}

	startGroup(group) {
		group?.forEach(item => {
			this.restartOne(item)
		})
	}

	startAll() {
		this.items.forEach(item => {
			this.restartOne(item)
		})
	}

	stopOne(item) {
		item.animations.forEach(animation => {
			animation.cancel()
		})
	}

	start() {
		this.startGroup(this.groups[0])
	}
}

export default Animate