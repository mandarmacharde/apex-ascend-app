import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User } from "@supabase/supabase-js";
import { Dumbbell, ArrowLeft, Calendar, Clock } from "lucide-react";

const History = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Mock data - in real app, this would come from database
  const mockWorkouts = [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <Dumbbell className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Workout History</h1>
                <p className="text-xs text-muted-foreground">Track your progress over time</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {mockWorkouts.length === 0 ? (
            <Card className="p-12 bg-gradient-card border-border/50 shadow-card text-center">
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">No workouts yet</h3>
                  <p className="text-muted-foreground">
                    Start logging your workouts to see them appear here
                  </p>
                </div>
                <Button variant="cta" size="lg" onClick={() => navigate("/log")}>
                  Log Your First Workout
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Workout cards would go here when data exists */}
              <Card className="p-6 bg-gradient-card border-border/50 shadow-card hover:shadow-glow transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary-glow" />
                      <span className="font-semibold">March 15, 2024</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        45 min
                      </span>
                      <span>• 12 sets</span>
                      <span>• 3 exercises</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-accent">2,400 lbs</div>
                    <div className="text-xs text-muted-foreground">Total Volume</div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;
