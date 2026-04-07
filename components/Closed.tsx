import { ShieldOff } from "lucide-react";
import Link from "next/link";

const Closed = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-slate-700/30 to-slate-800/10 blur-[100px]" />
        <div className="absolute bottom-1/3 -right-20 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-amber-900/20 to-slate-900/10 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center p-10 rounded-2xl bg-card/50 border border-border">
        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="w-10 h-10 text-amber-400" />
        </div>
        
        <h1 className="font-display text-3xl font-bold text-foreground mb-4">
          Form Closed
        </h1>
        
        <p className="text-muted-foreground mb-6 leading-relaxed">
          This form is no longer accepting responses.
        </p>
        
        <p className="text-sm text-muted-foreground mb-8">
          If you believe this is an error or have questions, please contact the form owner.
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

export default Closed;
