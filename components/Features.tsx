import { Sparkles, Lock, BarChart2, MessageSquare, Shield, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Lock,
    title: "Total Anonymity",
    description: "No user data is stored. Feedback is completely untraceable, ensuring genuine responses.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    description: "Our AI analyzes feedback to highlight key trends and sentiment, saving you hours of manual review.",
  },
  {
    icon: BarChart2,
    title: "Real-Time Analytics",
    description: "Track feedback trends with live dashboards and customizable reports.",
  },
  {
    icon: Shield,
    title: "Secure & Encrypted",
    description: "All data is end-to-end encrypted, so even we can't read your feedback.",
  },
  {
    icon: MessageSquare,
    title: "Customizable Forms",
    description: "Design feedback forms that match your brand and collect exactly what you need.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Share insights with your team and assign action items directly from feedback.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="relative overflow-hidden bg-secondary/30">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-slate-700/30 to-slate-800/10 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-teal-900/20 to-slate-900/10 blur-[100px]" />
      </div>

      <main className="container mx-auto px-6 py-24 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-secondary text-foreground rounded-full border border-border mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              Why Choose Anoq?
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              Honest feedback,{' '}
              <span className="text-primary">
                no bias.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Anoq ensures <strong className="text-foreground">100% anonymity</strong>, so you receive{' '}
              <strong className="text-foreground">raw, unfiltered insights</strong> to improve your product.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-8 rounded-2xl bg-card/50 border border-border hover:border-primary/30 transition-all duration-200"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-8 rounded-2xl bg-card/50 border border-border">
              <p className="text-foreground/80">
                Ready to get started?
              </p>
              <Link href="/create">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm group">
                  Create Your First Form
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <div className="absolute top-20 right-20 w-16 h-16 rounded-full bg-gradient-to-br from-slate-600/30 to-slate-700/20 blur-xl animate-float" />
      <div className="absolute bottom-40 left-20 w-24 h-24 rounded-full bg-gradient-to-br from-teal-700/20 to-slate-800/20 blur-xl animate-float-delay" />
    </div>
  );
}

function Button({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
