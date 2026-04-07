import { CheckCircle, MessageCircle } from "lucide-react";
import Link from "next/link";

const AlreadySubmitted = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-slate-700/30 to-slate-800/10 blur-[100px]" />
        <div className="absolute bottom-1/3 -right-20 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-teal-900/20 to-slate-900/10 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center p-10 rounded-2xl bg-card/50 border border-border">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        
        <h2 className="font-display text-3xl font-bold text-foreground mb-4">
          Already Submitted
        </h2>
        
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
          <MessageCircle className="w-5 h-5" />
          <span>Your response has been recorded</span>
        </div>
        
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Thank you for your feedback! Each response is unique and valuable to us.
        </p>
        
        <Link 
          href="/" 
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors font-medium"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default AlreadySubmitted;
