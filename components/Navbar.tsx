"use client"
import Link from "next/link";

const Navbar =  () => {


  return (
    <nav className="flex container bg-transparent w-full p-6 items-center border-none ">
        <span className="font-bold mr-auto text-black">
          <Link href={"/"}>Anoq</Link>
        </span>
      </nav>
  )
}

export default Navbar
