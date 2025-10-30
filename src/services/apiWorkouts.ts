import { supabase } from '../integrations/supabase/client';

/**
 * Interface for set data
 */
interface SetData {
  workout_id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  notes?: string;
}

/**
 * Starts a new workout session and returns the created workout row
 */
export async function startNewWorkout(userId: string, notes?: string) {
  // Ensure a profile exists for FK integrity
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (!existingProfile) {
    await supabase.from('profiles').insert({ id: userId });
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('workouts')
    .insert({
      user_id: userId,
      start_time: nowIso,
      ...(notes && { notes }),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to start workout: ${error.message}`);
  }
  return data;
}

/**
 * Completes a workout by setting end_time and optional notes
 */
export async function completeWorkout(workoutId: string, endTimeIso: string, notes?: string) {
  const { data, error } = await supabase
    .from('workouts')
    .update({ end_time: endTimeIso, ...(notes && { notes }) })
    .eq('id', workoutId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to complete workout: ${error.message}`);
  }
  return data;
}

/**
 * Seeds demo workouts and sets for a user across recent weeks
 */
export async function seedDemoDataForUser(userId: string) {
  // Ensure profile
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (!existingProfile) {
    await supabase.from('profiles').insert({ id: userId });
  }

  // Ensure some exercises exist
  const findExercise = async (name: string) => {
    const { data: ex, error: findErr } = await supabase
      .from('exercises')
      .select('id')
      .eq('name', name)
      .maybeSingle();
    if (findErr) throw new Error(`Exercise lookup failed: ${findErr.message}`);
    return ex?.id || null;
  };

  const benchId = await findExercise('Bench Press');
  const squatId = await findExercise('Back Squat');
  const deadliftId = await findExercise('Deadlift');

  // Create 6 weekly workouts (most recent first)
  const now = new Date();
  const workoutsToCreate: Array<{ start: Date; end: Date; notes: string; sets: Array<{ ex: string; weight: number; reps: number }> }> = [];
  for (let i = 0; i < 6; i++) {
    const start = new Date(now);
    start.setDate(start.getDate() - i * 7 - 2);
    start.setHours(18, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + 45);
    workoutsToCreate.push({
      start,
      end,
      notes: `Demo workout week ${i + 1}`,
      sets: [
        benchId ? { ex: benchId, weight: 135 + i * 5, reps: 8 } : null,
        benchId ? { ex: benchId, weight: 145 + i * 5, reps: 6 } : null,
        squatId ? { ex: squatId, weight: 185 + i * 10, reps: 5 } : null,
        deadliftId ? { ex: deadliftId, weight: 225 + i * 10, reps: 5 } : null,
      ].filter(Boolean) as Array<{ ex: string; weight: number; reps: number }>,
    });
  }

  for (const w of workoutsToCreate) {
    const { data: workout, error: wErr } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        start_time: w.start.toISOString(),
        end_time: w.end.toISOString(),
        notes: w.notes,
      })
      .select()
      .single();
    if (wErr) throw new Error(`Seed workout failed: ${wErr.message}`);
    if (!workout || !workout.id) throw new Error('Seed workout returned no id');

    const setRows = w.sets.map((s) => ({
      workout_id: workout.id,
      exercise_id: s.ex,
      weight: s.weight,
      reps: s.reps,
    }));
    const { error: sErr } = await supabase.from('sets').insert(setRows);
    if (sErr) throw new Error(`Seed sets failed: ${sErr.message}`);
  }

  return true;
}

/**
 * Creates a new workout for a user
 */
export async function createWorkout(params: {
  userId: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}) {
  const { userId, startTime, endTime, notes } = params;
  // Ensure a profile row exists for this user to satisfy FK
  const { data: existingProfile, error: profileSelectError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (profileSelectError) {
    throw new Error(`Failed to check profile: ${profileSelectError.message}`);
  }

  if (!existingProfile) {
    const { error: profileInsertError } = await supabase
      .from('profiles')
      .insert({ id: userId });

    if (profileInsertError) {
      throw new Error(`Failed to create profile: ${profileInsertError.message}`);
    }
  }
  const { data, error } = await supabase
    .from('workouts')
    .insert({
      user_id: userId,
      start_time: startTime,
      end_time: endTime,
      ...(notes && { notes })
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create workout: ${error.message}`);
  }

  return data;
}

/**
 * Finds an exercise by name or creates it, returning the id
 */
export async function getOrCreateExerciseIdByName(name: string) {
  // Try find existing
  const { data: existing, error: findError } = await supabase
    .from('exercises')
    .select('id')
    .eq('name', name)
    .maybeSingle();

  if (findError) {
    throw new Error(`Failed to look up exercise: ${findError.message}`);
  }

  if (existing?.id) return existing.id;

  // Create new if not found
  const { data: created, error: createError } = await supabase
    .from('exercises')
    .insert({ name })
    .select('id')
    .single();

  if (createError) {
    throw new Error(`Failed to create exercise: ${createError.message}`);
  }

  return created.id;
}

/**
 * Inserts a new set into the database
 * @param workoutId The ID of the workout
 * @param exerciseId The ID of the exercise
 * @param weight The weight used
 * @param reps The number of repetitions
 * @param notes Optional notes for the set
 * @returns The newly inserted set data
 * @throws Error if insertion fails
 */
export async function insertNewSet(
  workoutId: string,
  exerciseId: string,
  weight: number,
  reps: number,
  notes?: string
) {
  // Get the current user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw new Error(`Authentication error: ${userError.message}`);
  }
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }
  
  // Prepare the data payload
  const setData: SetData = {
    workout_id: workoutId,
    exercise_id: exerciseId,
    weight,
    reps,
    ...(notes && { notes })
  };
  
  // Insert the set data
  const { data, error } = await supabase
    .from('sets')
    .insert(setData)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to insert set: ${error.message}`);
  }
  
  return data;
}

/**
 * Returns total workout count and this week's count for a user
 */
export async function getWorkoutStatsForUser(userId: string) {
  const { count: totalCount, error: totalError } = await supabase
    .from('workouts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (totalError) {
    throw new Error(`Failed to fetch total workouts: ${totalError.message}`);
  }

  // Week start (ISO week): take current date back to Monday
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day; // Sunday => -6
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const { count: weekCount, error: weekError } = await supabase
    .from('workouts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monday.toISOString());

  if (weekError) {
    throw new Error(`Failed to fetch weekly workouts: ${weekError.message}`);
  }

  return {
    total: totalCount ?? 0,
    thisWeek: weekCount ?? 0,
  };
}

/**
 * Fetch workouts for a user with nested sets
 */
export async function getWorkoutsForUser(userId: string) {
  // 1) Fetch workouts for user
  const { data: workouts, error: workoutsError } = await supabase
    .from('workouts')
    .select('id, created_at, start_time, end_time, notes')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (workoutsError) {
    throw new Error(`Failed to fetch workouts: ${workoutsError.message}`);
  }

  const workoutList = workouts || [];
  if (workoutList.length === 0) return [] as Array<any>;

  // 2) Fetch sets for these workouts in one query
  const workoutIds = workoutList.map(w => w.id);
  const { data: sets, error: setsError } = await supabase
    .from('sets')
    .select('id, workout_id, exercise_id, weight, reps')
    .in('workout_id', workoutIds);

  if (setsError) {
    // Return workouts without sets rather than throwing, to still render history
    return workoutList.map(w => ({ ...w, sets: [] }));
  }

  const setsByWorkout: Record<string, any[]> = {};
  for (const s of sets || []) {
    if (!setsByWorkout[s.workout_id]) setsByWorkout[s.workout_id] = [];
    setsByWorkout[s.workout_id].push(s);
  }

  return workoutList.map(w => ({ ...w, sets: setsByWorkout[w.id] || [] }));
}