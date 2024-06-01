import { poppins } from "@/app/fonts"
const AlreadySubmitted = () => {
  return (
    <div className={`${poppins.className} h-screen flex justify-center items-center w-full flex-col `}>
        <h2 className="text-3xl text-center md:text-2xl sm:text-xl text-balance text-zinc-900 font-bold ">Already Submitted ...</h2>
        <h3 className="text-lg ">Your Response has been Recorded Already 😀</h3>
        <p className="text-md text-balance">Contact the adminstrator for more information or if you think this is wrong</p>
    </div>
  )
}

export default AlreadySubmitted
