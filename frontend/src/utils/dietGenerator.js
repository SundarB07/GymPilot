/**
 * Diet Generator Utility
 * Purely macro-based diet generation algorithm matching user's nutritional requirements
 */

export function calculateBMI(weightKg, heightCm) {
    if (!weightKg || !heightCm) return 0;
    const heightM = heightCm / 100;
    return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

export function calculateTDEE(weightKg, heightCm, age, gender, activityLevel) {
    let bmr = 0;
    if (gender === 'male') {
        bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
    } else {
        bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    }

    const multipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        heavy: 1.725,
        athlete: 1.9
    };
    const factor = multipliers[activityLevel] || 1.2;
    return bmr * factor;
}

export function generateDietPlan(formData, dbFoods = []) {
    const {
        age,
        height,
        currentWeight,
        gender = 'male',
        activityLevel = 'moderate',
        goal, // 'loss', 'maintenance', 'lean', 'fast'
        style = 'Veg' // 'Veg' or 'Non-Veg'
    } = formData;

    const weight = parseFloat(currentWeight);
    const heightCm = parseFloat(height);
    const ageY = parseInt(age);

    // 1. Calculate BMI
    const bmi = calculateBMI(weight, heightCm);

    // 2. Calculate BMR
    let bmr = 0;
    if (gender === 'male') {
        bmr = (10 * weight) + (6.25 * heightCm) - (5 * ageY) + 5;
    } else {
        bmr = (10 * weight) + (6.25 * heightCm) - (5 * ageY) - 161;
    }

    // 3. Calculate TDEE
    const multipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        heavy: 1.725,
        athlete: 1.9
    };
    const factor = multipliers[activityLevel] || 1.2;
    const tdee = bmr * factor;

    // 4. Calculate Target Calories
    let targetCalories = tdee;
    if (goal === 'loss') {
        targetCalories = tdee - 500;
    } else if (goal === 'lean') {
        targetCalories = tdee + 300;
    } else if (goal === 'fast') {
        targetCalories = tdee + 500;
    }
    targetCalories = Math.round(targetCalories);

    // 5. Calculate Protein
    let protein = 0;
    if (goal === 'loss') {
        protein = weight * 2.2;
    } else if (goal === 'maintenance') {
        protein = weight * 1.6;
    } else {
        protein = weight * 2.0;
    }
    protein = Math.round(protein);

    // 6. Calculate Fat
    let fat = Math.round(weight * 0.8);

    // 7. Calculate Carbs
    const proteinCalories = protein * 4;
    const fatCalories = fat * 9;
    const remainingCalories = targetCalories - proteinCalories - fatCalories;
    let carbs = Math.round(Math.max(0, remainingCalories) / 4);

    // 8. Calculate Water Requirement (35ml per kg of body weight)
    const waterRequirement = parseFloat((weight * 0.035).toFixed(1));
    const fiberGrams = Math.round((targetCalories / 1000) * 14);

    // 9. Filter Foods by Veg / Non-Veg
    const catalog = dbFoods;
    const filteredFoods = catalog.filter(f => {
        if (style === 'Veg' && f.type === 'Non-Veg') {
            return false;
        }
        return true;
    });

    // Helper to find specific foods by name
    const getFood = (nameQuery) => {
        return filteredFoods.find(f => f.food_name.toLowerCase().includes(nameQuery.toLowerCase())) || null;
    };

    // 10. Macro and Portion Solver Loop (Accept within ±5%)
    let breakfastItems = [];
    let lunchItems = [];
    let snackItems = [];
    let dinnerItems = [];

    // Select suitable food options depending on preference
    const isNonVeg = style === 'Non-Veg';
    
    // Choose protein and carb sources
    const proteinSource = isNonVeg ? getFood('Chicken Breast') || getFood('Fish') : getFood('Paneer') || getFood('Soy Chunks');
    const breakfastEgg = isNonVeg ? getFood('Whole Egg') || getFood('Boiled Egg') || getFood('Egg White') : getFood('Greek Yogurt') || getFood('Curd');
    
    const riceMealPref = (formData.riceMeal || 'lunch').toLowerCase();
    const riceSource = getFood('White Rice') || getFood('Brown Rice');
    const flatbreadSource = getFood('Chapati') || getFood('Wheat Roti');

    // Assign carb sources for each meal based on riceMeal preference:
    let breakfastCarb = getFood('Idli') || getFood('Dosa') || flatbreadSource;
    let lunchCarb = flatbreadSource;
    let dinnerCarb = flatbreadSource;

    if (riceMealPref === 'breakfast') {
        breakfastCarb = riceSource || getFood('Poha');
    } else if (riceMealPref === 'lunch') {
        lunchCarb = riceSource;
    } else if (riceMealPref === 'dinner') {
        dinnerCarb = riceSource;
    }

    const dalSource = getFood('Moong Dal') || getFood('Rajma') || getFood('Chickpeas');
    const snackFruit = getFood('Banana') || getFood('Apple') || getFood('Orange');
    const snackNut = getFood('Peanuts') || getFood('Almonds') || getFood('Walnuts') || getFood('Cashews');
    const drinkSource = getFood('Milk') || getFood('Buttermilk');
    const veggieSource = getFood('Mixed Vegetables') || getFood('Sprouts');

    // Portion scale factors (initialize)
    let pScale = 1.0;
    let cScale = 1.0;
    let fScale = 1.0;

    let totalCals = 0;
    let totalP = 0;
    let totalC = 0;
    let totalF = 0;

    let bestPlan = null;
    let minError = Infinity;

    // Solver loop (max 150 iterations to allow step changes to settle)
    for (let iter = 0; iter < 150; iter++) {
        breakfastItems = [];
        lunchItems = [];
        snackItems = [];
        dinnerItems = [];

        // Breakfast (25% target)
        if (breakfastEgg) {
            const item = getRealisticPortion(breakfastEgg, 1.5 * pScale);
            if (item) breakfastItems.push(item);
        }
        if (breakfastCarb) {
            const item = getRealisticPortion(breakfastCarb, 2 * cScale);
            if (item) breakfastItems.push(item);
        }
        if (drinkSource) {
            const item = getRealisticPortion(drinkSource, 1.5 * fScale);
            if (item) breakfastItems.push(item);
        }

        // Lunch (35% target)
        if (proteinSource) {
            const item = getRealisticPortion(proteinSource, 1.2 * pScale);
            if (item) lunchItems.push(item);
        }
        if (lunchCarb) {
            const item = getRealisticPortion(lunchCarb, 1.5 * cScale);
            if (item) lunchItems.push(item);
        }
        if (dalSource) {
            const item = getRealisticPortion(dalSource, 1.0 * pScale);
            if (item) lunchItems.push(item);
        }
        if (veggieSource) {
            const item = getRealisticPortion(veggieSource, 1.0);
            if (item) lunchItems.push(item);
        }

        // Snack (15% target)
        if (snackFruit) {
            const item = getRealisticPortion(snackFruit, 1.5 * cScale);
            if (item) snackItems.push(item);
        }
        if (snackNut) {
            const item = getRealisticPortion(snackNut, 0.6 * fScale);
            if (item) snackItems.push(item);
        }

        // Dinner (25% target)
        if (dinnerCarb) {
            const item = getRealisticPortion(dinnerCarb, 2.5 * cScale);
            if (item) dinnerItems.push(item);
        }
        if (dalSource) {
            const item = getRealisticPortion(dalSource, 0.8 * pScale);
            if (item) dinnerItems.push(item);
        }
        if (veggieSource) {
            const item = getRealisticPortion(veggieSource, 1.0);
            if (item) dinnerItems.push(item);
        }

        // Calculate totals
        totalCals = 0; totalP = 0; totalC = 0; totalF = 0;
        const allItems = [...breakfastItems, ...lunchItems, ...snackItems, ...dinnerItems];
        allItems.forEach(item => {
            totalCals += item.calories;
            totalP += item.protein;
            totalC += item.carbs;
            totalF += item.fat;
        });

        // Check validation (within ±5%)
        const calDiff = Math.abs(totalCals - targetCalories) / targetCalories;
        const pDiff = Math.abs(totalP - protein) / protein;
        const cDiff = Math.abs(totalC - carbs) / carbs;
        const fDiff = Math.abs(totalF - fat) / fat;

        const currentError = calDiff + pDiff + cDiff + fDiff;
        if (currentError < minError) {
            minError = currentError;
            bestPlan = {
                totalCals,
                totalP,
                totalC,
                totalF,
                meals: [
                    { name: '🌅 Breakfast (25%)', items: JSON.parse(JSON.stringify(breakfastItems)) },
                    { name: '🍛 Lunch (35%)', items: JSON.parse(JSON.stringify(lunchItems)) },
                    { name: '🥜 Snack (15%)', items: JSON.parse(JSON.stringify(snackItems)) },
                    { name: '🌙 Dinner (25%)', items: JSON.parse(JSON.stringify(dinnerItems)) }
                ]
            };
        }

        if (calDiff <= 0.05 && pDiff <= 0.05 && cDiff <= 0.05 && fDiff <= 0.05) {
            break; // Success!
        }

        // Adjust scales based on differences
        if (totalP < protein) pScale += 0.05; else pScale -= 0.05;
        if (totalC < carbs) cScale += 0.05; else cScale -= 0.05;
        if (totalF < fat) fScale += 0.05; else fScale -= 0.05;

        // Clip scales to prevent negatives
        pScale = Math.max(0.1, pScale);
        cScale = Math.max(0.1, cScale);
        fScale = Math.max(0.1, fScale);
    }

    return {
        bmi,
        tdee,
        targetCalories: Math.round(bestPlan.totalCals),
        waterRequirement,
        macros: {
            protein: Math.round(bestPlan.totalP),
            carbs: Math.round(bestPlan.totalC),
            fat: Math.round(bestPlan.totalF),
            fiber: fiberGrams
        },
        meals: bestPlan.meals
    };
}

export function getRealisticPortion(food, targetScale) {
    if (!food) return null;
    const name = food.food_name.toLowerCase();
    let qty = 1;
    let scale = 1.0;
    let nameWithQty = '';

    // Check specific food types:
    if (name.includes('egg white')) {
        // 1 egg white = approx 33g, so scale of 0.33 per egg white (100g base in DB)
        const rawQty = (targetScale * 100) / 33;
        qty = Math.max(1, Math.round(rawQty));
        scale = (qty * 33) / 100;
        nameWithQty = `${qty} Egg White${qty > 1 ? 's' : ''}`;
    } else if (name.includes('egg')) {
        // Whole Egg or Boiled Egg: 1 egg = 50g, scale of 0.5 per egg (100g base in DB)
        const rawQty = (targetScale * 100) / 50;
        qty = Math.max(1, Math.round(rawQty));
        scale = (qty * 50) / 100;
        nameWithQty = `${qty} ${food.food_name}${qty > 1 ? 's' : ''}`;
    } else if (name.includes('banana')) {
        // 1 banana = 100g base (scale = 1.0)
        qty = Math.max(1, Math.round(targetScale));
        scale = qty;
        nameWithQty = `${qty} Banana${qty > 1 ? 's' : ''}`;
    } else if (name.includes('apple')) {
        // 1 apple = 100g base (scale = 1.0)
        qty = Math.max(1, Math.round(targetScale));
        scale = qty;
        nameWithQty = `${qty} Apple${qty > 1 ? 's' : ''}`;
    } else if (name.includes('chapati') || name.includes('roti')) {
        // DB unit is 1 piece (scale = 1.0)
        qty = Math.max(1, Math.round(targetScale));
        scale = qty;
        nameWithQty = `${qty} Chapati${qty > 1 ? 's' : ''}`;
    } else if (name.includes('idli')) {
        // DB unit is 1 piece
        qty = Math.max(1, Math.round(targetScale));
        scale = qty;
        nameWithQty = `${qty} Idli${qty > 1 ? 's' : ''}`;
    } else if (name.includes('dosa')) {
        // DB unit is 1 piece
        qty = Math.max(1, Math.round(targetScale));
        scale = qty;
        nameWithQty = `${qty} Dosa${qty > 1 ? 's' : ''}`;
    } else if (name.includes('appam')) {
        // DB unit is 1 piece
        qty = Math.max(1, Math.round(targetScale));
        scale = qty;
        nameWithQty = `${qty} Appam${qty > 1 ? 's' : ''}`;
    } else if (name.includes('chicken') || name.includes('fish') || name.includes('tuna') || name.includes('prawns') || name.includes('paneer') || name.includes('tofu') || name.includes('rice')) {
        // 50g increments. targetScale is multiplier for 100g base.
        const rawGrams = targetScale * 100;
        const roundedGrams = Math.max(50, Math.round(rawGrams / 50) * 50);
        scale = roundedGrams / 100;
        nameWithQty = `${roundedGrams}g ${food.food_name}`;
    } else if (name.includes('oats')) {
        // 10g or 25g increments. Let's do 10g increments.
        const rawGrams = targetScale * 100;
        const roundedGrams = Math.max(10, Math.round(rawGrams / 10) * 10);
        scale = roundedGrams / 100;
        nameWithQty = `${roundedGrams}g ${food.food_name}`;
    } else if (name.includes('milk') || name.includes('buttermilk')) {
        // 100ml increments. targetScale is multiplier for 100ml base.
        const rawMl = targetScale * 100;
        const roundedMl = Math.max(100, Math.round(rawMl / 100) * 100);
        scale = roundedMl / 100;
        nameWithQty = `${roundedMl}ml ${food.food_name}`;
    } else {
        // Fallback for other foods based on category
        if (food.category === 'Drink') {
            const rawMl = targetScale * 100;
            const roundedMl = Math.max(100, Math.round(rawMl / 100) * 100);
            scale = roundedMl / 100;
            nameWithQty = `${roundedMl}ml ${food.food_name}`;
        } else if (food.category === 'Fruit' || food.category === 'Snack' || food.category === 'Food') {
            // Veggies, seeds, nuts, dal, poha, potato etc. round to nearest 10g
            const rawGrams = targetScale * 100;
            const roundedGrams = Math.max(10, Math.round(rawGrams / 10) * 10);
            scale = roundedGrams / 100;
            nameWithQty = `${roundedGrams}g ${food.food_name}`;
        } else {
            const roundedScale = Math.max(0.5, Math.round(targetScale * 2) / 2);
            scale = roundedScale;
            nameWithQty = `${scale} serving${scale !== 1 ? 's' : ''} of ${food.food_name}`;
        }
    }

    return {
        name: nameWithQty,
        calories: Math.round(Number(food.calories_kcal) * scale),
        protein: Math.round(Number(food.protein_g) * scale),
        carbs: Math.round(Number(food.carbs_g) * scale),
        fat: Math.round(Number(food.fat_g) * scale),
        fiber: Math.round(Number(food.fiber_g || 0) * scale),
        is_optional: !!food.is_optional,
        alternative_name: food.alternative_name || null
    };
}

export function recalibrateMealPortions(meals, targets, dbFoods) {
    const targetCalories = Number(targets.targetCalories || targets.calories || 2000);
    const protein = Number(targets.protein || 120);
    const carbs = Number(targets.carbs || 250);
    const fat = Number(targets.fat || 50);
    const fiber = Number(targets.fiber || 30);

    const findDbFood = (itemName) => {
        return dbFoods.find(f => {
            const cleanName = f.food_name.toLowerCase();
            const cleanItem = itemName.toLowerCase();
            return cleanItem.includes(cleanName) || cleanName.includes(cleanItem);
        }) || null;
    };

    const mealItemsWithFoods = meals.map(meal => {
        return (meal.items || []).map(item => {
            const dbFood = findDbFood(item.name);
            let rawScale = 1.0;
            if (dbFood && dbFood.calories_kcal > 0) {
                rawScale = item.calories / dbFood.calories_kcal;
            }
            return {
                originalItem: item,
                dbFood,
                rawScale,
                fixedCalories: dbFood ? 0 : item.calories,
                fixedProtein: dbFood ? 0 : item.protein,
                fixedCarbs: dbFood ? 0 : item.carbs,
                fixedFat: dbFood ? 0 : item.fat,
                fixedFiber: dbFood ? 0 : item.fiber
            };
        });
    });

    let pScale = 1.0;
    let cScale = 1.0;
    let fScale = 1.0;

    let bestPlan = null;
    let minError = Infinity;

    for (let iter = 0; iter < 150; iter++) {
        let tempMeals = [];
        let totalCals = 0;
        let totalP = 0;
        let totalC = 0;
        let totalF = 0;
        let totalFib = 0;

        mealItemsWithFoods.forEach((mealItems, mealIndex) => {
            const scaledItems = [];
            mealItems.forEach(meta => {
                if (meta.dbFood) {
                    const group = (meta.dbFood.food_group || '').toLowerCase();
                    const groupCategory = (meta.dbFood.category || '').toLowerCase();
                    const name = meta.dbFood.food_name.toLowerCase();

                    let scaleMultiplier = 1.0;
                    if (group.includes('protein') || name.includes('egg') || name.includes('chicken') || name.includes('fish') || name.includes('paneer') || name.includes('tofu')) {
                        scaleMultiplier = pScale;
                    } else if (group.includes('carb') || groupCategory.includes('fruit') || name.includes('rice') || name.includes('chapati') || name.includes('oats') || name.includes('idli') || name.includes('dosa')) {
                        scaleMultiplier = cScale;
                    } else if (group.includes('fat') || group.includes('nut') || group.includes('seed')) {
                        scaleMultiplier = fScale;
                    }

                    const targetScale = meta.rawScale * scaleMultiplier;
                    const scaledItem = getRealisticPortion(meta.dbFood, targetScale);
                    if (scaledItem) {
                        scaledItems.push(scaledItem);
                        totalCals += scaledItem.calories;
                        totalP += scaledItem.protein;
                        totalC += scaledItem.carbs;
                        totalF += scaledItem.fat;
                        totalFib += scaledItem.fiber;
                    }
                } else {
                    scaledItems.push({ ...meta.originalItem });
                    totalCals += meta.fixedCalories;
                    totalP += meta.fixedProtein;
                    totalC += meta.fixedCarbs;
                    totalF += meta.fixedFat;
                    totalFib += meta.fixedFiber;
                }
            });
            tempMeals.push({
                ...meals[mealIndex],
                items: scaledItems
            });
        });

        const calDiff = Math.abs(totalCals - targetCalories) / targetCalories;
        const pDiff = Math.abs(totalP - protein) / protein;
        const cDiff = Math.abs(totalC - carbs) / carbs;
        const fDiff = Math.abs(totalF - fat) / fat;
        const fibDiff = fiber > 0 ? Math.abs(totalFib - fiber) / fiber : 0;

        const currentError = calDiff + pDiff + cDiff + fDiff + fibDiff;
        if (currentError < minError) {
            minError = currentError;
            bestPlan = {
                totalCals,
                totalP,
                totalC,
                totalF,
                totalFib,
                meals: tempMeals
            };
        }

        if (calDiff <= 0.05 && pDiff <= 0.05 && cDiff <= 0.05 && fDiff <= 0.05 && fibDiff <= 0.10) {
            break;
        }

        if (totalP < protein) pScale += 0.05; else pScale -= 0.05;
        if (totalC < carbs) cScale += 0.05; else cScale -= 0.05;
        if (totalF < fat) fScale += 0.05; else fScale -= 0.05;

        pScale = Math.max(0.1, pScale);
        cScale = Math.max(0.1, cScale);
        fScale = Math.max(0.1, fScale);
    }

    return bestPlan;
}


