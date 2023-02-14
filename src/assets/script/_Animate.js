class Animate {
	constructor() {
		this.list = new Map()
		document.querySelectorAll("[data-animate-group]").forEach(group => {
			let animates = [...group.querySelectorAll("[data-animate]")].sort((animateA, animateB) => {
				return (animateA.dataset.animatePriority ?? Number.MAX_VALUE) - (animateB.dataset.animatePriority ?? Number.MAX_VALUE)
			})
			// animates.filter((animate) => {
			// 	return animate.dataset.animatePriority
			// }).forEach(animate=>{
			// 	console.log(
			// 		animates.filter(animateInner=>{
			// 			return animate.dataset.animatePriority == animateInner.dataset.animatePriority
			// 		})
			// 	)

			// })
			let grouped = animates.reduce((r, v, i, a) => {
        if (v?.dataset.animatePriority === a[i - 1]?.dataset.animatePriority) {
            r[r.length - 1].push(v);
        } else {
            r.push(v?.dataset.animatePriority === a[i + 1]?.dataset.animatePriority ? [v] : v);
        }
        return r;
    }, []);
console.log(grouped)

			this.list.set(group, animates)
		})
		console.log(this.list)

	}
}
export default Animate