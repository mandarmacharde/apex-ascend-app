import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User } from "@supabase/supabase-js";
import { Dumbbell, TrendingUp, Calendar, LogOut, History, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Dumbbell className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Apex Ascend</h1>
              <p className="text-xs text-muted-foreground">Welcome back, {user?.email?.split("@")[0]}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Your Dashboard</h2>
            <p className="text-muted-foreground">Track your progress and stay consistent</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Weekly Progress Card */}
            <Card className="p-6 bg-gradient-card border-border/50 shadow-card hover:shadow-glow transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary-glow" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <h3 className="text-2xl font-bold">0 Workouts</h3>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-accent w-0 transition-all duration-500"></div>
                </div>
                <p className="text-xs text-muted-foreground">Start logging to see your progress!</p>
              </div>
            </Card>

            {/* Today's Focus Card */}
            <Card className="p-6 bg-gradient-card border-border/50 shadow-card hover:shadow-glow transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Goal</p>
                    <h3 className="text-2xl font-bold">Get Started</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Log your first workout to establish your baseline and start your ascent!
                </p>
              </div>
            </Card>

            {/* Total Workouts Card */}
            <Card className="p-6 bg-gradient-card border-border/50 shadow-card hover:shadow-glow transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Workouts</p>
                    <h3 className="text-2xl font-bold">0</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Every rep counts towards your goals
                </p>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="p-8 bg-gradient-card border-border/50 shadow-card">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="cta"
                  size="lg"
                  className="h-16 text-lg"
                  onClick={() => navigate("/log")}
                >
                  <Plus className="w-6 h-6 mr-2" />
                  Start New Workout
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16 text-lg"
                  onClick={() => navigate("/history")}
                >
                  <History className="w-6 h-6 mr-2" />
                  View History
                </Button>
              </div>
            </div>
          </Card>

          {/* Getting Started Guide */}
          <Card className="p-6 bg-muted/50 border-border/50">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Getting Started</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent font-bold mt-0.5">1.</span>
                  <span>Click "Start New Workout" to begin tracking your first session</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent font-bold mt-0.5">2.</span>
                  <span>Log exercises, sets, and reps as you complete them</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent font-bold mt-0.5">3.</span>
                  <span>Review your progress in the History section</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
