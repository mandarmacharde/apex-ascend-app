import { useEffect, useMemo, useState } from 'react';
import { getWorkoutsForUser } from '@/services/apiWorkouts';

export interface WorkoutWithSets {
  id: string;
  created_at?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
  sets: Array<{ id: string; workout_id: string; exercise_id: string; weight: number; reps: number }>
}

export function useWorkoutHistory(userId?: string | null) {
  const [data, setData] = useState<WorkoutWithSets[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    getWorkoutsForUser(userId)
      .then((w) => setData(w as WorkoutWithSets[]))
      .catch((e) => setError(e?.message || 'Failed to load history'))
      .finally(() => setLoading(false));
  }, [userId]);

  const metrics = useMemo(() => {
    let totalVolume = 0; // sum(weight * reps)
    const exerciseMax: Record<string, number> = {};
    const frequencyByWeek: Record<string, number> = {};

    for (const w of data) {
      // frequency key by ISO week-year
      const dateStr = w.start_time || w.created_at;
      if (dateStr) {
        const d = new Date(dateStr);
        const year = d.getUTCFullYear();
        const firstJan = new Date(Date.UTC(year, 0, 1));
        const day = Math.floor((d.getTime() - firstJan.getTime()) / 86400000);
        const week = Math.ceil((day + firstJan.getUTCDay() + 1) / 7);
        const key = `${year}-W${week}`;
        frequencyByWeek[key] = (frequencyByWeek[key] || 0) + 1;
      }

      for (const s of w.sets || []) {
        totalVolume += (s.weight || 0) * (s.reps || 0);
        const curr = exerciseMax[s.exercise_id] || 0;
        if ((s.weight || 0) > curr) exerciseMax[s.exercise_id] = s.weight || 0;
      }
    }

    return {
      totalVolume,
      exerciseMax, // map exercise_id -> max weight
      frequencyByWeek, // map "YYYY-Wn" -> count
    };
  }, [data]);

  return { data, loading, error, metrics };
}


