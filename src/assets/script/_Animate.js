class Animate {
	#followQueue = false
	#groups
	#items
	/**
	 *
	 * @param {HTMLElement} group
	 */
	constructor(group) {
		let list = {}

		group.querySelectorAll("[data-animate]").forEach(item => {
			let priority = item.dataset.animatePriority ?? null
			list[priority] = list[priority] || {}
			list[priority].items = list[priority].items || []
			list[priority].target = list[priority].target || new EventTarget()

			list[priority].items.push({ target: item, animations: item.getAnimations() })
		})

		this.#groups = Object.values(list)

		this.#items = this.#groups.reduce((acc, item) => {
			return [...acc, item.items]
		}, []).flat()


		this.#bindEnds()
		this.#bindQueue()
	}

	#bindQueue() {
		this.#items.forEach(item => {
			item.animations.forEach((animation, index, animations) => {
				animation.addEventListener("finish", () => {
					animations[index + 1]?.play()
				})
			})
		})

		this.#groups.forEach((group, index, groups) => {
			group.target.addEventListener("animationgroupend", () => {
				if (this.#followQueue) {
					this.#startGroup(groups[index + 1])
				}
			})
		})
	}

	#bindEnds() {
		function isGroupDone(group) {
			return group.items.reduce((acc, item) => {
				return acc && item.animations.reduce((acc, animation) => {
					return acc && animation.playState == "finished"
				}, true)
			}, true)
		}

		this.#items.forEach(item => {
			item.animations.forEach((animation, index, animations) => {
				animation.addEventListener("finish", () => {
					animations[index + 1] || item.target.dispatchEvent(new Event("animationsend"))
				})
			})
		})

		this.#groups.forEach(group => {
			group.items.forEach(item => {
				item.target.addEventListener("animationsend", () => {
					if (isGroupDone(group)) {
						group.target.dispatchEvent(new Event("animationgroupend"))
					}
				})
			})
		})
	}

	/**
	 * Останавливает анимации элемента и запускает их заново
	 */
	#restartOne(item) {
		this.#stopOne(item)
		this.#startOne(item)
	}

	/**
	 * Останавливает анимации элементов группы и запускает их заново одновременно
	 */
	#restartGroup(group) {
		group?.items.forEach(item => {
			this.#restartOne(item)
		})
	}

	/**
	 * Останавливает анимации всех элементов и запускает их заново одновременно
	 */
	restartAll() {
		this.#followQueue = false
		this.#items.forEach(item => {
			this.#restartOne(item)
		})
	}

	/**
	 * Останавливает анимации всех элементов и запускает их заново в общей очереди
	 */
	restart() {
		this.stopAll()
		requestAnimationFrame(() => {
			this.start()
		})
	}

	/**
	 * Останавливает анимации элемента
	 */
	#stopOne(item) {
		item.animations.forEach(animation => {
			animation.cancel()
		})
	}

	/**
	 * Останавливает анимации всех элементов
	 */
	stopAll() {
		this.#items.forEach(item => {
			this.#stopOne(item)
		})
	}

	/**
	 * Запускает анимации одного элемента
	 */
	#startOne(item) {
		item.animations[0].play()
	}

	/**
	 * Запускает анимации элементов группы
	 */
	#startGroup(group) {
		group?.items.forEach(item => {
			this.#startOne(item)
		})
	}

	/**
	 * Запускает анимации всех элементов в общей очереди
	 */
	start() {
		this.#followQueue = true
		this.#startGroup(this.#groups[0])
	}
}

export default Animate