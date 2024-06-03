import {poppins}  from "@/app/fonts"

const Closed = () => {
    
    return (
      <div className={`h-screen w-full flex items-center justify-center bg-gray-100 ${poppins.className}`}>
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-red-500 mb-4">This form is currently closed</h1>
          <h2 className="text-lg text-gray-700 mb-2">We apologize for the inconvenience.</h2>
          <p className="text-md text-gray-600">If you believe this is an error or have any questions, please contact the administrator.</p>
          <p className="text-md text-gray-600 mt-2">Thank you for your understanding.</p>
        </div>
      </div>
    )
  }
  
  export default Closed;
  