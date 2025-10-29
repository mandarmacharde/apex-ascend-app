import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dumbbell, TrendingUp, Target, BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen animated-bg">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary shadow-glow">
            <Dumbbell className="w-10 h-10 text-primary-foreground" />
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Apex Ascend
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Elevate Your Strength. Track Your Ascent.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              variant="cta"
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-primary-glow" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your gains with detailed workout logs and performance metrics
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Set Goals</h3>
              <p className="text-sm text-muted-foreground">
                Define targets and stay motivated as you work towards your fitness goals
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Analyze Data</h3>
              <p className="text-sm text-muted-foreground">
                Get insights from your training history and optimize your workouts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>© 2024 Apex Ascend. Built for athletes, by athletes.</p>
      </footer>
    </div>
  );
};

export default Index;
