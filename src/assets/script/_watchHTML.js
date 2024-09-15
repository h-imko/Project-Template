export default function watchHTML(...callbacks) {
	new MutationObserver(mutations => {
		for (const mutation of mutations) {
			if (mutation.addedNodes.length) {
				console.log(mutation)
				for (const callback of callbacks) {
					callback(mutation.target)
				}
			}
		}
	}).observe(document.body, {
		childList: true,
		subtree: true,
	})
}
