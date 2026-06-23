-- GymPilot Supabase Schema and RLS Policies

-- 1. Create tables
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE workoutplans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal TEXT NOT NULL,
    level TEXT NOT NULL,
    days_per_week INTEGER NOT NULL,
    time_per_session INTEGER NOT NULL,
    plan_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    main_muscle_group TEXT NOT NULL,
    sub_muscle_group TEXT NOT NULL,
    exercise_name TEXT NOT NULL,
    equipment_required TEXT NOT NULL,
    mechanics TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
    day_name TEXT NOT NULL,
    exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
    sets_planned INTEGER NOT NULL,
    target_reps_min INTEGER NOT NULL,
    target_reps_max INTEGER NOT NULL,
    weight_used numeric,
    sets_completed INTEGER,
    actual_reps INTEGER,
    notes TEXT,
    workout_volume numeric,
    set_logs jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE dietlogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_type TEXT NOT NULL,
    food_items TEXT NOT NULL,
    protein numeric NOT NULL,
    whey_taken BOOLEAN DEFAULT false,
    whey_grams numeric DEFAULT 0,
    creatine_taken BOOLEAN DEFAULT false,
    creatine_grams numeric DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workoutplans ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dietlogs ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies

-- Profiles: Users can insert their own profile and read their own profile
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Workout Plans: Users can CRUD their own plans
CREATE POLICY "Users can insert their own plan" ON workoutplans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own plan" ON workoutplans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own plan" ON workoutplans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own plan" ON workoutplans FOR DELETE USING (auth.uid() = user_id);

-- Exercises: Public read-only access
CREATE POLICY "Exercises are publicly readable" ON exercises FOR SELECT USING (true);

-- Workout Logs: Users can CRUD their own logs
CREATE POLICY "Users can insert their own logs" ON workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own logs" ON workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own logs" ON workout_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own logs" ON workout_logs FOR DELETE USING (auth.uid() = user_id);

-- Diet Logs: Users can CRUD their own logs
CREATE POLICY "Users can insert their own diet logs" ON dietlogs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own diet logs" ON dietlogs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own diet logs" ON dietlogs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own diet logs" ON dietlogs FOR DELETE USING (auth.uid() = user_id);

-- 4. Create weight_logs table
CREATE TABLE IF NOT EXISTS weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    weight numeric NOT NULL,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, log_date)
);

-- Enable RLS for weight_logs
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- Weight Logs: Users can CRUD their own logs
CREATE POLICY "Users can insert their own weight logs" ON weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own weight logs" ON weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own weight logs" ON weight_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own weight logs" ON weight_logs FOR DELETE USING (auth.uid() = user_id);


-- Note: Ensure you set up a trigger for auth.users to automatically create a profile if desired, 
-- but for simplicity, the application will handle profile creation during signup flow.
