-- 1. Create Diet Plans Table
CREATE TABLE IF NOT EXISTS dietplans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    age INTEGER NOT NULL,
    height numeric NOT NULL,
    current_weight numeric NOT NULL,
    goal_weight numeric NOT NULL,
    bmi numeric NOT NULL,
    target_calories numeric NOT NULL,
    category TEXT NOT NULL, -- weight gain, weight loss, maintain weight
    style TEXT NOT NULL, -- indian plan, indian with veg, indian with non veg
    plan_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Alter Diet Logs Table to support macros
ALTER TABLE dietlogs 
ADD COLUMN IF NOT EXISTS calories numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS carbs numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS fat numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS fiber numeric DEFAULT 0;

-- 3. Enable RLS on dietplans
ALTER TABLE dietplans ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for dietplans
CREATE POLICY "Users can insert their own diet plan" ON dietplans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own diet plan" ON dietplans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own diet plan" ON dietplans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own diet plan" ON dietplans FOR DELETE USING (auth.uid() = user_id);

-- 5. Create Foods Database Table (Matching user's CSV catalog)
CREATE TABLE IF NOT EXISTS foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, -- Veg, Non-Veg
    category TEXT NOT NULL, -- Fruit, Drink, Snacks, Food
    food_group TEXT NOT NULL, -- Protein, Carbs, Fat
    protein_g numeric NOT NULL,
    carbs_g numeric NOT NULL,
    fat_g numeric NOT NULL,
    fiber_g numeric NOT NULL,
    calories_kcal numeric NOT NULL,
    is_optional BOOLEAN DEFAULT false,
    alternative_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Foods are publicly readable" ON foods FOR SELECT USING (true);

