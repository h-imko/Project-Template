import icons from "./_icons.tsx"

export default function ({ icon }: { icon: keyof icons }) {

  return (
    <span className={ icon }></span>
  )
}