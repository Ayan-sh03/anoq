import { Sparkles, Lock, BarChart2, MessageSquare, Shield, Users } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-900 to-indigo-900 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-purple-600 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-indigo-600 blur-[120px] animate-pulse delay-300"></div>
      </div>

      {/* Features Section */}
      <main className="container mx-auto px-6 py-24 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 text-sm font-medium bg-white/10 text-white rounded-full backdrop-blur-sm border border-white/10 mb-4">
              ✨ Why Anoq?
            </span>
            <h2 className="text-5xl font-bold text-white leading-tight mb-6">
              Get <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300">honest feedback</span>,<br />
              without the <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-300 to-indigo-300">fear of bias</span>.
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Anoq ensures <strong>100% anonymity</strong>, so you receive <strong>raw, unfiltered insights</strong> to improve your product.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Total Anonymity */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all hover:shadow-lg hover:shadow-purple-500/20">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mb-4">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Total Anonymity</h3>
              <p className="text-gray-300">
                No user data is stored. Feedback is <strong>completely untraceable</strong>, ensuring genuine responses.
              </p>
            </div>

            {/* Feature 2: AI-Powered Insights */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all hover:shadow-lg hover:shadow-purple-500/20">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">AI-Powered Insights</h3>
              <p className="text-gray-300">
                Our AI analyzes feedback to highlight <strong>key trends & sentiment</strong>, saving you hours of manual review.
              </p>
            </div>

            {/* Feature 3: Real-Time Analytics */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all hover:shadow-lg hover:shadow-purple-500/20">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mb-4">
                <BarChart2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Real-Time Analytics</h3>
              <p className="text-gray-300">
                Track feedback trends with <strong>live dashboards</strong> and customizable reports.
              </p>
            </div>

            {/* Feature 4: Secure & Encrypted */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all hover:shadow-lg hover:shadow-purple-500/20">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Secure & Encrypted</h3>
              <p className="text-gray-300">
                All data is <strong>end-to-end encrypted</strong>, so even we can't read your feedback.
              </p>
            </div>

            {/* Feature 5: Customizable Forms */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all hover:shadow-lg hover:shadow-purple-500/20">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mb-4">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Customizable Forms</h3>
              <p className="text-gray-300">
                Design feedback forms that match <strong>your brand</strong> and collect exactly what you need.
              </p>
            </div>

            {/* Feature 6: Team Collaboration */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all hover:shadow-lg hover:shadow-purple-500/20">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Team Collaboration</h3>
              <p className="text-gray-300">
                Share insights with your team and <strong>assign action items</strong> directly from feedback.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Animated Shapes */}
      <div className="absolute top-20 right-20 w-16 h-16 rounded-full bg-purple-500/30 blur-xl animate-float"></div>
      <div className="absolute bottom-40 left-20 w-24 h-24 rounded-full bg-pink-500/30 blur-xl animate-float-delay"></div>
    </div>
  );
}
