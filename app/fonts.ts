import { Poppins } from "next/font/google"
import { Arimo } from 'next/font/google'
import { Rubik } from 'next/font/google'



export const poppins  = Poppins({
    subsets: ["latin"],
    weight: ["100","200","300","500","700","800"]
  })


export const arimo = Arimo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-arimo',
})
export const rubik = Rubik({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-rubik',
})