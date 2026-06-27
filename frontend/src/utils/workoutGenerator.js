export function generateWorkoutPlan(preferences, allExercises) {
    const { goal, level, daysPerWeek, timePerSession } = preferences;

    const days = parseInt(daysPerWeek, 10);
    const time = parseInt(timePerSession, 10);

    // STEP 1: Base exercise count from session duration
    const baseCount = Math.floor(time / 12);

    // STEP 2: Experience level modifier
    let levelModifier = 1.0;
    if (level === 'Beginner') levelModifier = 0.75;
    else if (level === 'Advanced') levelModifier = 1.25;

    let adjustedCount = Math.round(baseCount * levelModifier);

    // STEP 3: Days per week modifier
    if (days <= 3) {
        adjustedCount += 1;
    } else if (days === 6) {
        adjustedCount -= 1;
    }

    // STEP 4: Goal modifier
    if (goal === 'Strength') {
        adjustedCount -= 1;
    } else if (goal === 'Fat Loss' || goal === 'Endurance') {
        adjustedCount += 1;
    }

    // STEP 5: Final Clamp by experience level
    let finalCount = adjustedCount;
    if (level === 'Beginner') {
        finalCount = Math.max(3, Math.min(5, finalCount));
    } else if (level === 'Intermediate') {
        finalCount = Math.max(4, Math.min(7, finalCount));
    } else if (level === 'Advanced') {
        finalCount = Math.max(5, Math.min(9, finalCount));
    }

    const exercisesPerSession = finalCount;

    // Define splits
    let split = [];
    if (days === 1) {
        split = ['Full Body', 'Rest', 'Rest', 'Rest', 'Rest', 'Rest', 'Rest'];
    } else if (days === 2) {
        split = ['Upper Body', 'Rest', 'Rest', 'Lower Body', 'Rest', 'Rest', 'Rest'];
    } else if (days === 3) {
        split = ['Full Body', 'Rest', 'Full Body', 'Rest', 'Full Body', 'Rest', 'Rest'];
    } else if (days === 4) {
        split = ['Upper Body', 'Lower Body', 'Rest', 'Upper Body', 'Lower Body', 'Rest', 'Rest'];
    } else if (days === 5) {
        split = ['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Rest', 'Rest'];
    } else if (days === 6) {
        split = ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Rest'];
    } else {
        split = ['Full Body', 'Rest', 'Full Body', 'Rest', 'Full Body', 'Rest', 'Rest'];
    }

    // Helper for selecting exercises with strict limits and uniqueness
    const selectExercisesForDay = (targetMuscles, totalCount) => {
        let compoundRatio = 0.5;
        if (level === 'Beginner') compoundRatio = 0.7;
        else if (level === 'Intermediate') compoundRatio = 0.6;

        let maxPerMuscle = {
            chest: 99, back: 99, legs: 99, shoulders: 99, arms: 99, core: 99, 'full body': 99
        };
        if (level === 'Beginner') {
            maxPerMuscle = {
                chest: 2, back: 2, legs: 2, shoulders: 1, arms: 1, core: 1, 'full body': 1
            };
        } else if (level === 'Intermediate') {
            maxPerMuscle = {
                chest: 3, back: 3, legs: 3, shoulders: 2, arms: 2, core: 2, 'full body': 2
            };
        } else if (level === 'Advanced') {
            maxPerMuscle = {
                chest: 4, back: 4, legs: 4, shoulders: 3, arms: 3, core: 2, 'full body': 2
            };
        }

        const targetMusclesLower = targetMuscles.map(m => m.toLowerCase());
        let eligible = allExercises.filter(ex => 
            targetMusclesLower.includes(ex.main_muscle_group.toLowerCase())
        );

        // Shuffle eligible exercises
        eligible = eligible.sort(() => 0.5 - Math.random());

        // Separate compound and isolation
        let compounds = eligible.filter(ex => ex.mechanics.toLowerCase() === 'compound');
        let isolations = eligible.filter(ex => ex.mechanics.toLowerCase() === 'isolation');

        const targetCompound = Math.round(totalCount * compoundRatio);
        const targetIsolation = totalCount - targetCompound;

        const selected = [];
        const selectedIds = new Set();
        const selectedSubMuscles = new Set();
        const muscleCounts = {
            chest: 0, back: 0, legs: 0, shoulders: 0, arms: 0, core: 0, 'full body': 0
        };

        const tryPick = (pool, countToPick) => {
            let pickedCount = 0;
            let attempts = 0;
            let respectSubMuscle = true;
            let respectMuscleLimit = true;

            while (pickedCount < countToPick && attempts < 3) {
                let addedInThisPass = false;

                for (const ex of pool) {
                    if (pickedCount >= countToPick) break;
                    if (selectedIds.has(ex.id)) continue;

                    const muscle = ex.main_muscle_group.toLowerCase();
                    const subMuscle = ex.sub_muscle_group.toLowerCase();

                    if (respectMuscleLimit && (muscleCounts[muscle] || 0) >= (maxPerMuscle[muscle] || 99)) {
                        continue;
                    }
                    if (respectSubMuscle && selectedSubMuscles.has(subMuscle)) {
                        continue;
                    }

                    selected.push(ex);
                    selectedIds.add(ex.id);
                    selectedSubMuscles.add(subMuscle);
                    muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1;
                    pickedCount++;
                    addedInThisPass = true;
                }

                if (!addedInThisPass) {
                    if (respectSubMuscle) {
                        respectSubMuscle = false;
                    } else if (respectMuscleLimit) {
                        respectMuscleLimit = false;
                    } else {
                        break;
                    }
                }
                attempts++;
            }
            return pickedCount;
        };

        tryPick(compounds, targetCompound);
        tryPick(isolations, targetIsolation);

        if (selected.length < totalCount) {
            let remaining = totalCount - selected.length;
            for (const ex of eligible) {
                if (remaining <= 0) break;
                if (selectedIds.has(ex.id)) continue;

                selected.push(ex);
                selectedIds.add(ex.id);
                remaining--;
            }
        }

        return selected;
    };

    const plan_data = {
        weekly_schedule: []
    };

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let i = 0; i < 7; i++) {
        const focus = split[i];
        let dailyExercises = [];

        if (focus !== 'Rest') {
            let targetMuscles = [];
            if (focus === 'Full Body') targetMuscles = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
            if (focus === 'Upper Body') targetMuscles = ['Chest', 'Back', 'Shoulders', 'Arms'];
            if (focus === 'Lower Body') targetMuscles = ['Legs', 'Core'];
            if (focus === 'Chest & Triceps' || focus === 'Push') targetMuscles = ['Chest', 'Shoulders', 'Arms'];
            if (focus === 'Back & Biceps' || focus === 'Pull') targetMuscles = ['Back', 'Arms'];
            if (focus === 'Legs') targetMuscles = ['Legs'];
            if (focus === 'Shoulders & Core') targetMuscles = ['Shoulders', 'Core'];

            const selected = selectExercisesForDay(targetMuscles, exercisesPerSession);

            dailyExercises = selected.map(ex => {
                let sets = 3;
                let reps = '8-12';
                if (goal === 'Strength') { sets = 4; reps = '4-6'; }
                if (goal === 'Fat Loss') { sets = 3; reps = '12-15'; }
                if (level === 'Beginner') { sets = Math.max(2, sets - 1); } // slightly less volume for beginners

                return {
                    id: ex.id,
                    name: ex.exercise_name,
                    muscle_group: ex.main_muscle_group,
                    sets: sets,
                    reps: reps
                };
            });
        }

        plan_data.weekly_schedule.push({
            day_index: i,
            day_name: daysOfWeek[i],
            focus: focus,
            is_rest: focus === 'Rest',
            exercises: dailyExercises
        });
    }

    // Validation: check that the generated workout days count exactly matches daysPerWeek
    let generatedWorkoutDays = plan_data.weekly_schedule.filter(d => !d.is_rest && d.focus !== 'Rest').length;
    if (generatedWorkoutDays !== days) {
        // Reset all to Rest
        plan_data.weekly_schedule = [];

        const workoutFoci = ['Full Body', 'Upper Body', 'Lower Body', 'Push', 'Pull', 'Legs', 'Shoulders & Core'];
        for (let i = 0; i < 7; i++) {
            const isWorkout = i < days;
            const focus = isWorkout ? workoutFoci[i % workoutFoci.length] : 'Rest';
            let dailyExercises = [];

            if (isWorkout) {
                let targetMuscles = [];
                if (focus === 'Full Body') targetMuscles = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
                if (focus === 'Upper Body') targetMuscles = ['Chest', 'Back', 'Shoulders', 'Arms'];
                if (focus === 'Lower Body') targetMuscles = ['Legs', 'Core'];
                if (focus === 'Push') targetMuscles = ['Chest', 'Shoulders', 'Arms'];
                if (focus === 'Pull') targetMuscles = ['Back', 'Arms'];
                if (focus === 'Legs') targetMuscles = ['Legs'];
                if (focus === 'Shoulders & Core') targetMuscles = ['Shoulders', 'Core'];

                const selected = selectExercisesForDay(targetMuscles, exercisesPerSession);
                dailyExercises = selected.map(ex => {
                    let sets = 3;
                    let reps = '8-12';
                    if (goal === 'Strength') { sets = 4; reps = '4-6'; }
                    if (goal === 'Fat Loss') { sets = 3; reps = '12-15'; }
                    if (level === 'Beginner') { sets = Math.max(2, sets - 1); }
                    return {
                        id: ex.id,
                        name: ex.exercise_name,
                        muscle_group: ex.main_muscle_group,
                        sets: sets,
                        reps: reps
                    };
                });
            }

            plan_data.weekly_schedule.push({
                day_index: i,
                day_name: daysOfWeek[i],
                focus: focus,
                is_rest: !isWorkout,
                exercises: dailyExercises
            });
        }
    }

    return plan_data;
}
