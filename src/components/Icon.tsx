import icons from "./_icons"

export default function ({ icon }: { icon: keyof typeof icons }) {
  return (
    <span className={ icons[icon] }></span>
  )
}