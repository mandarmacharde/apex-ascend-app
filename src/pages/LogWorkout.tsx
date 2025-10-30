import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "@supabase/supabase-js";
import { Dumbbell, ArrowLeft, Plus, Trash2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertNewSet, getOrCreateExerciseIdByName, startNewWorkout, completeWorkout } from "@/services/apiWorkouts";

interface WorkoutSet {
  id: string;
  exercise: string;
  weight: number;
  reps: number;
  notes?: string;
}

const LogWorkout = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [currentExercise, setCurrentExercise] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [currentReps, setCurrentReps] = useState("");
  const [currentNotes, setCurrentNotes] = useState("");
  const [startTime] = useState(new Date());
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const addSet = async () => {
    if (!currentExercise || !currentWeight || !currentReps) {
      toast({
        title: "Missing Information",
        description: "Please fill in exercise, weight, and reps",
        variant: "destructive",
      });
      return;
    }
    try {
      if (!user?.id) throw new Error("User not authenticated");

      // Ensure workout session exists
      let activeWorkoutId = workoutId;
      if (!activeWorkoutId) {
        const started = await startNewWorkout(user.id);
        activeWorkoutId = started.id;
        setWorkoutId(started.id);
      }

      // Ensure exercise exists and insert set immediately
      const exerciseId = await getOrCreateExerciseIdByName(currentExercise.trim());
      await insertNewSet(
        activeWorkoutId as string,
        exerciseId,
        parseFloat(currentWeight),
        parseInt(currentReps),
        currentNotes || undefined
      );

      const newSet: WorkoutSet = {
        id: crypto.randomUUID(),
        exercise: currentExercise,
        weight: parseFloat(currentWeight),
        reps: parseInt(currentReps),
        notes: currentNotes,
      };
      setSets(prev => [...prev, newSet]);
      setCurrentWeight("");
      setCurrentReps("");
      setCurrentNotes("");
      toast({ title: "Set added!", description: `${currentExercise} logged successfully` });
    } catch (error: any) {
      toast({ title: "Error adding set", description: error.message || "An error occurred", variant: "destructive" });
    }
  };

  const removeSet = (id: string) => {
    setSets(sets.filter((set) => set.id !== id));
    toast({ title: "Set removed" });
  };

  const finishWorkout = async () => {
    if (sets.length === 0) {
      toast({
        title: "No sets logged",
        description: "Add at least one set before finishing",
        variant: "destructive",
      });
      return;
    }

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60);

    try {
      if (!user?.id) throw new Error("User not authenticated");
      if (!workoutId) throw new Error("No active workout session. Add a set first.");

      await completeWorkout(workoutId, endTime.toISOString(), `Workout completed in ${duration} minutes`);

      toast({
        title: "Workout Complete! 🎉",
        description: `Logged ${sets.length} sets in ${duration} minutes`,
      });

      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error: any) {
      toast({
        title: "Error saving workout",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const groupedSets = sets.reduce((acc, set) => {
    if (!acc[set.exercise]) {
      acc[set.exercise] = [];
    }
    acc[set.exercise].push(set);
    return acc;
  }, {} as Record<string, WorkoutSet[]>);

  return (
    <div className="min-h-screen bg-background pb-20">
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
                <h1 className="text-xl font-bold">Log Workout</h1>
                <p className="text-xs text-muted-foreground">
                  Started at {startTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Add Set Form */}
          <Card className="p-6 bg-gradient-card border-border/50 shadow-card">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-accent" />
                Add Set
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exercise">Exercise</Label>
                  <Input
                    id="exercise"
                    placeholder="e.g., Bench Press"
                    value={currentExercise}
                    onChange={(e) => setCurrentExercise(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (lbs)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="135"
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reps">Reps</Label>
                    <Input
                      id="reps"
                      type="number"
                      placeholder="10"
                      value={currentReps}
                      onChange={(e) => setCurrentReps(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Felt strong today"
                    value={currentNotes}
                    onChange={(e) => setCurrentNotes(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>

                <Button variant="secondary" size="lg" className="w-full" onClick={addSet}>
                  <Plus className="w-5 h-5 mr-2" />
                  Add Set
                </Button>
              </div>
            </div>
          </Card>

          {/* Workout Summary */}
          {sets.length > 0 && (
            <Card className="p-6 bg-gradient-card border-border/50 shadow-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Today's Workout</h3>
                  <span className="text-sm text-muted-foreground">{sets.length} sets</span>
                </div>

                <div className="space-y-6">
                  {Object.entries(groupedSets).map(([exercise, exerciseSets]) => (
                    <div key={exercise} className="space-y-3">
                      <h4 className="font-semibold text-primary-glow">{exercise}</h4>
                      <div className="space-y-2">
                        {exerciseSets.map((set, idx) => (
                          <div
                            key={set.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50"
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-muted-foreground">
                                Set {idx + 1}
                              </span>
                              <span className="font-semibold">
                                {set.weight} lbs × {set.reps} reps
                              </span>
                              {set.notes && (
                                <span className="text-sm text-muted-foreground">• {set.notes}</span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSet(set.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Finish Workout Button */}
          <Button
            variant="cta"
            size="lg"
            className="w-full h-14 text-lg"
            onClick={finishWorkout}
            disabled={sets.length === 0}
          >
            <Check className="w-6 h-6 mr-2" />
            Finish Workout
          </Button>
        </div>
      </main>
    </div>
  );
};

export default LogWorkout;
