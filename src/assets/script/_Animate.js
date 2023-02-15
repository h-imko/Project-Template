class Animate {
	/**
	 *
	 * @param {HTMLElement} group
	 */
	constructor(group) {
		this.list = {}

		group.querySelectorAll("[data-animate]").forEach(item => {
			let priority = item.dataset.animatePriority ?? null
			this.list[priority] = this.list[priority] || {}
			this.list[priority].items = this.list[priority].items || []
			this.list[priority].target = this.list[priority].target || new EventTarget()
			this.list[priority].items.push({ target: item, animations: item.getAnimations() })
		})

		this.bindEnds()
		this.bindQueue()

		this.start()
	}

	get groups() {
		return Object.values(this.list)
	}

	get items() {
		return Object.values(this.list).reduce((acc, item) => {
			return [...acc, item.items]
		}, []).flat()
	}

	bindQueue() {
		this.items.forEach(item => {
			item.animations.forEach((animation, index, animations) => {
				animation.addEventListener("finish", () => {
					animations[index + 1]?.play()
				})
			})
		})

		this.groups.forEach((group, index, groups) => {
			group.target.addEventListener("animationgroupend", () => {
				this.startGroup(groups[index + 1])
			})
		})
	}

	bindEnds() {
		function isGroupDone(group) {
			return group.items.reduce((acc, item) => {
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
			group.items.forEach(item => {
				item.target.addEventListener("animationsend", () => {
					if (isGroupDone(group)) {
						group.target.dispatchEvent(new Event("animationgroupend"))
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
		group?.items.forEach(item => {
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