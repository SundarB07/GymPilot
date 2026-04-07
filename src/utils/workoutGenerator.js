export function generateWorkoutPlan(preferences, allExercises) {
    const { goal, level, daysPerWeek, timePerSession } = preferences;

    let split = [];
    const days = parseInt(daysPerWeek);

    if (days <= 3) {
        split = ['Full Body', 'Rest', 'Full Body', 'Rest', 'Full Body', 'Rest', 'Rest'];
    } else if (days === 4) {
        split = ['Upper Body', 'Lower Body', 'Rest', 'Upper Body', 'Lower Body', 'Rest', 'Rest'];
    } else if (days === 5) {
        split = ['Chest & Triceps', 'Back & Biceps', 'Rest', 'Legs', 'Shoulders & Core', 'Rest', 'Rest'];
    } else if (days >= 6) {
        split = ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Rest'];
    } else {
        split = ['Full Body', 'Rest', 'Full Body', 'Rest', 'Full Body', 'Rest', 'Rest'];
    }

    const time = parseInt(timePerSession);
    let exercisesPerSession = 5;
    if (time >= 60) exercisesPerSession = 6;
    if (time >= 90) exercisesPerSession = 8;

    const getExercises = (muscles, count) => {
        let filtered = allExercises.filter(ex => muscles.some(m => ex.muscle_group.toLowerCase().includes(m.toLowerCase())));
        if (filtered.length === 0) return [];

        // Simple shuffle
        filtered = filtered.sort(() => 0.5 - Math.random());

        // In case we don't have enough exercises, we might repeat or just return what we have
        return filtered.slice(0, count);
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

            const selected = getExercises(targetMuscles, exercisesPerSession);

            dailyExercises = selected.map(ex => {
                let sets = 3;
                let reps = '8-12';
                if (goal === 'Strength') { sets = 4; reps = '4-6'; }
                if (goal === 'Fat Loss') { sets = 3; reps = '12-15'; }
                if (level === 'Beginner') { sets = Math.max(2, sets - 1); } // slightly less volume for beginners

                return {
                    id: ex.id,
                    name: ex.name,
                    muscle_group: ex.muscle_group,
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

    return plan_data;
}
