import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 overflow-hidden">
      {/* Background decorative elements - matching landing page theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-200/30 blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-blue-200/30 blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-200/20 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Thank You Content */}
        <main className="pt-20 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center">

              {/* Main Thank You Message */}
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">
                  Thank You!
                </span>
                <br />
                <span className="text-gray-800">Your Response Has Been Recorded</span>
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-10">
                We appreciate you taking the time to share your feedback. Your anonymous response helps us build better products and services.
              </p>

              {/* Additional Info */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-10 max-w-2xl border border-indigo-100 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-gray-800">What's Next?</h3>
                </div>
                <p className="text-gray-600 text-left">
                  Your feedback has been securely stored and will be reviewed by our team.
                  Since this is anonymous, you won't receive a direct response, but your input
                  will directly influence our product decisions.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard">
                  <Button className="min-w-[180px] h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 font-medium shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/create">
                  <Button variant="outline" className="min-w-[180px] h-12 rounded-full border-2 border-indigo-200 text-indigo-700 px-6 font-medium bg-white/90 hover:bg-indigo-50 hover:border-indigo-300 shadow-md hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300">
                    Create Another Form
                  </Button>
                </Link>
              </div>

              {/* Decorative Footer */}
              <div className="mt-16 text-center">
                <p className="text-sm text-gray-500">
                  Built with <span className="text-red-500">❤</span> by the Anoq team
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}