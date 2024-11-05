import Splide, { FADE } from "@splidejs/splide"
import { ifClickInside } from "./_helpers"

export const childGalleryPropertyName = "childGallery"

/**
 * Должна быть вызвана до инициализации слайдеров
 */
export default function () {
	let galleries = {}

	document.querySelectorAll("[data-gallery]").forEach(link => {
		(galleries[link.dataset.gallery] ??= []).push(link)
	})

	Object.values(galleries).forEach(links => {
		const dialog = document.createElement("dialog")
		const dialogCloser = document.createElement("button")
		const splide = document.createElement("div")
		const splideTrack = document.createElement("div")
		const splideList = document.createElement("ul")
		const splideArrows = document.createElement("div")
		const splideArrowPrev = document.createElement("button")
		const splideArrowNext = document.createElement("button")
		const parentSplide = links.at(0).closest(".splide")
		const splideInstance = new Splide(splide, {
			perMove: 1,
			perPage: 1,
			pagination: false,
			type: FADE
		})

		{
			dialog.classList.add("dialog-gallery")
			dialogCloser.classList.add("dialog-gallery__closer")
			splide.classList.add("splide")
			splideTrack.classList.add("splide__track")
			splideList.classList.add("splide__list")
			splideArrows.classList.add("splide__arrows")
			splideArrowPrev.classList.add("splide__arrow", "splide__arrow--prev")
			splideArrowNext.classList.add("splide__arrow", "splide__arrow--next")
		}

		{
			dialog.append(splide)
			dialog.append(dialogCloser)
			splide.append(splideTrack)
			splide.append(splideArrows)
			splideTrack.append(splideList)
			splideArrows.append(splideArrowPrev)
			splideArrows.append(splideArrowNext)
		}

		links.forEach(link => {
			const splideSlide = document.createElement("li")
			const img = document.createElement("img")

			img.setAttribute("src", link.getAttribute("href"))

			splideSlide.classList.add("splide__slide")
			splideSlide.append(img)
			splideList.append(splideSlide)

			link.addEventListener("click", event => {
				event.preventDefault()
				dialog.showModal()
			})

			if (parentSplide) {
				parentSplide[childGalleryPropertyName] = splideInstance
			}
		})

		if (!parentSplide) {
			splideInstance.mount()
		}

		dialog.addEventListener("click", event => {
			if (!ifClickInside(event, ...splideInstance.Components.Elements.slides, splideArrows)) {
				dialog.close()
			}
		})

		document.body.append(dialog)
	})
}