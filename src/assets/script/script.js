import Splide from "@splidejs/splide";
import "fslightbox";
document.addEventListener('DOMContentLoaded', function () { });

function initSpoilers() {
	document.querySelectorAll('.spoiler')
		.forEach(spoiler => {
			let slideToggle = makeSlideToggle(spoiler.querySelector(".spoiler-content"));
			spoiler.querySelector('.spoiler-toggler')
				.addEventListener('click', function () {
					spoiler.classList.toggle("spoiler-opened");
					slideToggle();
				});
			if (spoiler.dataset.spoilerDefaultOpened) {
				slideToggle();
			}
		});
}

function initQuantity() {
	function initQuantityItem(quantity) {
		let input = quantity.querySelector('input[type="number"]');
		let btnPlus = quantity.querySelector(".quantity--button:last-of-type");
		let btnMinus = quantity.querySelector(".quantity--button:first-of-type");
		new Array(btnPlus, btnMinus)
			.forEach((btn) => {
				btn.addEventListener("click", function () {
					let newValue = +input.value + +this.dataset.value;
					console.log(input.min, input.max);
					if (input.min == "" || input.max == "") {
						input.value = newValue;
						return;
					}
					if (newValue < input.min) {
						btnMinus.setAttribute("disabled", "");
					} else if (newValue > input.max) {
						btnPlus.setAttribute("disabled", "");
					} else if (newValue == input.max) {
						input.value = newValue;
						btnPlus.setAttribute("disabled", "");
					} else if (newValue == input.min) {
						input.value = newValue;
						btnMinus.setAttribute("disabled", "");
					} else {
						input.value = newValue;
						btnPlus.removeAttribute("disabled");
						btnMinus.removeAttribute("disabled");
					}
				});
			});
		input.addEventListener("change", function () {
			if (!input.checkValidity()) {
				if (input.value > input.max) {
					input.value = input.max ? input.max : 0;
				}
				if (input.value < input.min) {
					input.value = input.min ? input.min : 0;
				}
			}
		});
	}
	document.querySelectorAll('.quantity')
		.forEach(initQuantityItem);
	window.initQuantityItem = initQuantityItem;
}

function makeSlideToggle(elem) {
	let initialHeight = getComputedStyle(elem)
		.maxHeight;
	return function () {
		if (event) {
			event.preventDefault();
		}
		if (elem.style.maxHeight == "") {
			elem.focus();
			elem.style.maxHeight = `${elem.scrollHeight}px`;
		} else if (elem.style.maxHeight != initialHeight) {
			elem.blur();
			elem.style.maxHeight = initialHeight;
		} else {
			elem.focus();
			elem.style.maxHeight = `${elem.scrollHeight}px`;
		}
	};
}

function initTabs() {
	document.querySelectorAll(".tabs")
		.forEach(tabgroup => {
			let controls = tabgroup.querySelectorAll(".tabs-control");
			let contents = Array.from(tabgroup.querySelectorAll(".tabs-content"));
			controls.forEach(control => {
				control.addEventListener("click", function () {
					contents.forEach(content => {
						content.classList.remove("active");
					});
					controls.forEach(control => {
						control.classList.remove("active");
					});
					contents.find(function (content) {
						return content.id == control.dataset.tabTarget;
					})
						.classList.add("active");
					control.classList.add("active");
				});
			});
		});
}

function toggleNoscrollBody() {
	if (document.body.classList.contains('noscroll')) {
		document.body.classList.remove('noscroll');
		window.scrollTo({
			top: document.body.style.getPropertyValue('--scroll-position')
				.replace('px', ""),
			left: 0,
			behavior: "instant"
		});
	} else {
		document.body.style.setProperty("--scroll-position", `${window.pageYOffset}px`);
		document.body.style.setProperty("--scrollbar-width", `${window.innerWidth - document.documentElement.clientWidth}px`);
		document.body.classList.add('noscroll');
	}
}

function initPopups() {
	document.querySelectorAll("[data-popup]")
		.forEach(function (popup) {
			function makeClosePopup() {
				return function () {
					popup.blur();
				};
			}

			function makeOpenPopup() {
				return function () {
					popup.focus();
				};
			}
			window[`closePopup_${popup.id}`] = makeClosePopup();
			window[`openPopup_${popup.id}`] = makeOpenPopup();
			document.querySelectorAll(`.popup-opener[data-target="${popup.id}"]`)
				.forEach(function (opener) {
					opener.addEventListener('click', function () {
						popup.focus();
						event.preventDefault();
						event.stopPropagation();
					});
				});
			popup.querySelectorAll("input, textarea")
				.forEach(input => {
					input.addEventListener("focusout", () => {
						popup.focus();
					});
				});
			popup.addEventListener('click', function () {
				popup.blur();
			});
			popup.querySelector(".popup-inner")
				.addEventListener('click', function () {
					event.stopPropagation();
				});
			popup.addEventListener('focus', function () {
				if (!this.classList.contains('show')) {
					toggleNoscrollBody();
					this.classList.add("show");
				}
			});
			popup.addEventListener('focusout', function (event) {
				setTimeout(() => {
					if (!this.matches(":focus-within") && this.classList.contains('show')) {
						toggleNoscrollBody();
						this.classList.remove("show");
					}
				}, 100);
			});
			popup.querySelectorAll(".popup-closer")
				.forEach(closer => {
					closer.addEventListener("click", function () {
						popup.blur();
					});
				});
		});
}