import Link from "next/link";

const Navbar = async () => {


  return (
    <nav className="flex container w-full p-6 items-center border-none">
        <span className="font-bold mr-auto text-black">
          <Link href={"/"}>Anoq</Link>
        </span>
      </nav>
  )
}

export default Navbar
