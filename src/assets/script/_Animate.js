class Animate {
	constructor(group) {
		this.list = {}
		this.animates = [...group.querySelectorAll("[data-animate]")]
		this.ignorePriority = false

		this.animates.forEach(animate => {
			let priority = animate.dataset.animatePriority ?? null
			this.list[priority] ? this.list[priority].push(animate) : this.list[priority] = [animate]
			//
			let animations = animate.getAnimations()
			console.log(animations)
			animate.addEventListener("animationend", console.log)
			animate.addEventListener("click", () => {
				animations.forEach((animation, index) => {
					animation.addEventListener("finish", () => {
						animations[index + 1]?.play()
						console.log("finish")

					})
				})
				animations[0].play()
			})
		})

		console.log(this.list)

	}

	get groups() {
		return Object.values(this.list)
	}

	bindQueue() {
		function isGroupDone(doneList) {
			return doneList.reduce((acc, curr) => {
				return acc || curr
			}, false)
		}

		this.groups.forEach((group, index, groups) => {
			let doneList = new Array(group.length).fill(false)

			group.forEach(animate => {
				animate.addEventListener("animationend", () => {
					doneList[index] = true
					if (isGroupDone(doneList)) {
						this.runGroup(groups[index + 1])
					}
				})
			})
		})
	}

	bindEndState() {
		this.animates.forEach(animate => {
			animate.addEventListener("animationend", () => {
				this.stopOne(animate)
			})
		})
	}

	runOne(animate) {
		animate.style.setProperty("--play", "running")
	}

	runGroup(group) {
		group?.forEach(animate => {
			this.runOne(animate)
		})
	}

	runAll() {
		this.animates.forEach(animate => {
			this.runOne(animate)
		})
	}

	stopOne(animate) {
		animate.style.setProperty("--play", "paused")
	}

	resetOne(animate) {
		let iterations = getComputedStyle(animate).getPropertyValue("--iterations")
		animate.style.setProperty("--iterations", iterations + 1)
	}

	resetAll() {
		this.animates.forEach(animate => {
			this.resetOne(animate)
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

export default Animate