import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User } from "@supabase/supabase-js";
import { getWorkoutsForUser } from "@/services/apiWorkouts";
import { Dumbbell, ArrowLeft, Calendar, Clock } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis } from "recharts";

const History = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState<boolean>(false);

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

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoadingWorkouts(true);
      try {
        const data = await getWorkoutsForUser(user.id);
        setWorkouts(data);
      } catch (_e) {
        setWorkouts([]);
      } finally {
        setLoadingWorkouts(false);
      }
    };
    load();
  }, [user?.id]);

  const formatted = useMemo(() => {
    return (workouts || []).map(w => {
      const start = w.start_time ? new Date(w.start_time) : (w.created_at ? new Date(w.created_at) : null);
      const end = w.end_time ? new Date(w.end_time) : null;
      const durationMin = start && end ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000)) : null;
      const sets = Array.isArray(w.sets) ? w.sets : [];
      const totalSets = sets.length;
      const exerciseCount = new Set(sets.map((s: any) => s.exercise_id)).size;
      return {
        id: w.id,
        dateLabel: start ? start.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown Date',
        durationMin,
        totalSets,
        exerciseCount,
      };
    });
  }, [workouts]);

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
          {/* Sets per Workout (last 10) */}
          {!loadingWorkouts && formatted.length > 0 && (
            <Card className="p-6 bg-card/80 border-border/50 shadow-card">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sets per Workout (last 10)</h3>
                <ChartContainer
                  config={{ sets: { label: "Sets", color: "hsl(var(--accent))" } }}
                  className="h-56"
                >
                  <BarChart data={formatted.slice(0, 10).map((w, i) => ({ idx: i + 1, sets: w.totalSets }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="idx" tickFormatter={(v) => `#${v}`}/>
                    <Bar dataKey="sets" fill="var(--color-sets)" radius={4} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </BarChart>
                </ChartContainer>
              </div>
            </Card>
          )}
          {loadingWorkouts ? (
            <Card className="p-12 bg-gradient-card border-border/50 shadow-card text-center">
              <div className="text-muted-foreground">Loading workout history...</div>
            </Card>
          ) : formatted.length === 0 ? (
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
              {formatted.map((w) => (
                <Card key={w.id} className="p-6 bg-gradient-card border-border/50 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-primary-glow" />
                        <span className="font-semibold">{w.dateLabel}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {w.durationMin && (
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {w.durationMin} min
                          </span>
                        )}
                        <span>• {w.totalSets} sets</span>
                        <span>• {w.exerciseCount} exercises</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;
