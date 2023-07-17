class PrioritySubgroup extends EventTarget {
	constructor() {
		super()
		this.items = []
	}
}

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
		this.#items = group.querySelectorAll("[data-animate]")

		this.#items.forEach(item => {
			let priority = item.dataset.animatePriority ?? null
			list[priority] ??= new PrioritySubgroup()
			item.animations = item.getAnimations()
			list[priority].items.push(item)
		})

		this.#groups = Object.values(list)

		this.#groups.forEach((group, index, groups) => {
			group.addEventListener("animationgroupend", () => {
				if (this.#followQueue) {
					this.#startGroup(groups[index + 1])
				}
			})

			group.items.forEach(item => {
				item.addEventListener("animationsend", () => {
					if (this.#isGroupDone(group)) {
						group.dispatchEvent(new Event("animationgroupend"))
					}
				})

				item.animations.forEach((animation, index, animations) => {
					animation.addEventListener("finish", () => {
						if (animations[index + 1]) {
							animations[index + 1].play()
						} else {
							item.dispatchEvent(new Event("animationsend"))
						}
					})
				})
			})
		})
	}

	#isGroupDone(group) {
		return group.items.every((item => item.animations.some(animation => animation.playState == "finished")))
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