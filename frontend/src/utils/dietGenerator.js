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

export function getFoodUnit(food) {
    if (!food) return 'g';
    const name = food.food_name.toLowerCase();
    if (name.includes('egg') || name.includes('banana') || name.includes('apple') || name.includes('orange') || name.includes('chapati') || name.includes('roti') || name.includes('idli') || name.includes('dosa') || name.includes('appam')) {
        return 'piece';
    }
    if (name.includes('milk') || name.includes('buttermilk') || (food.category && food.category.toLowerCase() === 'drink')) {
        return 'ml';
    }
    return 'g';
}

export function getServingConstraints(food, isDinner = false) {
    let min = food.min_serving !== undefined && food.min_serving !== null ? Number(food.min_serving) : null;
    let pref = food.preferred_serving !== undefined && food.preferred_serving !== null ? Number(food.preferred_serving) : null;
    let max = food.max_serving !== undefined && food.max_serving !== null ? Number(food.max_serving) : null;

    if (min !== null && max !== null) {
        if (isDinner && (food.food_name.toLowerCase().includes('chicken') || food.food_name.toLowerCase().includes('paneer'))) {
            max = Math.min(max, 150);
        }
        return { min, pref: pref || min, max };
    }

    const name = food.food_name.toLowerCase();
    const unit = getFoodUnit(food);

    if (unit === 'piece') {
        if (name.includes('egg white')) {
            return { min: 2, pref: 4, max: isDinner ? 6 : 8 };
        }
        if (name.includes('egg')) {
            return { min: 1, pref: 2, max: isDinner ? 2 : 4 };
        }
        if (name.includes('banana')) {
            return { min: 1, pref: 1, max: isDinner ? 1 : 2 };
        }
        if (name.includes('apple') || name.includes('orange')) {
            return { min: 1, pref: 1, max: 2 };
        }
        if (name.includes('chapati') || name.includes('roti')) {
            return { min: 1, pref: 2, max: isDinner ? 3 : 4 };
        }
        if (name.includes('idli')) {
            return { min: 2, pref: 3, max: 5 };
        }
        if (name.includes('dosa') || name.includes('appam')) {
            return { min: 1, pref: 2, max: 3 };
        }
        return { min: 1, pref: 1, max: 3 };
    } else if (unit === 'ml') {
        if (name.includes('milk') || name.includes('buttermilk')) {
            return { min: 100, pref: 200, max: 400 };
        }
        return { min: 100, pref: 200, max: 500 };
    } else {
        if (name.includes('chicken') || name.includes('fish') || name.includes('meat') || name.includes('paneer') || name.includes('tofu')) {
            return { min: 100, pref: 150, max: isDinner ? 150 : 250 };
        }
        if (name.includes('rice')) {
            return { min: 50, pref: 100, max: isDinner ? 100 : 200 };
        }
        if (name.includes('oats')) {
            return { min: 30, pref: 50, max: 100 };
        }
        if (name.includes('peanut') || name.includes('almond') || name.includes('walnut') || name.includes('cashew') || name.includes('nut') || name.includes('seed')) {
            return { min: 10, pref: 20, max: isDinner ? 10 : 30 };
        }
        if (name.includes('dal') || name.includes('rajma') || name.includes('chickpea') || name.includes('lentil') || name.includes('sprouts')) {
            return { min: 30, pref: 50, max: 100 };
        }
        if (name.includes('vegetable') || name.includes('salad') || name.includes('broccoli')) {
            return { min: 50, pref: 100, max: 200 };
        }
        return { min: 20, pref: 50, max: 150 };
    }
}

export function getRealisticPortion(food, targetScale) {
    if (!food) return null;
    const name = food.food_name.toLowerCase();
    const unit = getFoodUnit(food);
    const constraints = getServingConstraints(food);

    let qty = 1;
    let scale = 1.0;
    let nameWithQty = '';

    let rawTarget = (unit === 'piece') ? targetScale : targetScale * 100;
    rawTarget = Math.max(constraints.min, Math.min(constraints.max, rawTarget));

    if (unit === 'piece') {
        qty = Math.max(1, Math.round(rawTarget));
        if (name.includes('egg white')) {
            scale = (qty * 33) / 100;
            nameWithQty = `${qty} Egg White${qty > 1 ? 's' : ''}`;
        } else if (name.includes('egg')) {
            scale = (qty * 50) / 100;
            nameWithQty = `${qty} ${food.food_name}${qty > 1 ? 's' : ''}`;
        } else if (name.includes('banana')) {
            scale = qty;
            nameWithQty = `${qty} Banana${qty > 1 ? 's' : ''}`;
        } else if (name.includes('apple')) {
            scale = qty;
            nameWithQty = `${qty} Apple${qty > 1 ? 's' : ''}`;
        } else if (name.includes('orange')) {
            scale = qty;
            nameWithQty = `${qty} Orange${qty > 1 ? 's' : ''}`;
        } else if (name.includes('chapati') || name.includes('roti')) {
            scale = qty;
            nameWithQty = `${qty} Chapati${qty > 1 ? 's' : ''}`;
        } else if (name.includes('idli')) {
            scale = qty;
            nameWithQty = `${qty} Idli${qty > 1 ? 's' : ''}`;
        } else if (name.includes('dosa')) {
            scale = qty;
            nameWithQty = `${qty} Dosa${qty > 1 ? 's' : ''}`;
        } else if (name.includes('appam')) {
            scale = qty;
            nameWithQty = `${qty} Appam${qty > 1 ? 's' : ''}`;
        } else {
            scale = qty;
            nameWithQty = `${qty} serving${qty !== 1 ? 's' : ''} of ${food.food_name}`;
        }
    } else {
        let increment = 25;
        if (name.includes('chicken') || name.includes('fish') || name.includes('meat') || name.includes('paneer') || name.includes('tofu') || name.includes('rice')) {
            increment = 50;
        } else if (name.includes('peanut') || name.includes('almond') || name.includes('walnut') || name.includes('cashew') || name.includes('nut') || name.includes('seed') || name.includes('butter') || name.includes('oil') || name.includes('ghee')) {
            increment = 10;
        } else if (unit === 'ml') {
            increment = 100;
        }

        let roundedQty = Math.round(rawTarget / increment) * increment;
        roundedQty = Math.max(constraints.min, Math.min(constraints.max, roundedQty));

        scale = roundedQty / 100;
        const suffix = (unit === 'ml') ? 'ml' : 'g';
        nameWithQty = `${roundedQty}${suffix} ${food.food_name}`;
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

export function generateDietPlan(formData, dbFoods = []) {
    const {
        age,
        height,
        currentWeight,
        gender = 'male',
        activityLevel = 'moderate',
        goal,
        style = 'Veg',
        includeWhey,
        includeWheyProtein,
        includeCreatine
    } = formData;

    const wheySelected = !!(includeWhey || includeWheyProtein);
    const creatineSelected = !!includeCreatine;

    const weight = parseFloat(currentWeight);
    const heightCm = parseFloat(height);
    const ageY = parseInt(age);

    const bmi = calculateBMI(weight, heightCm);

    let bmr = 0;
    if (gender === 'male') {
        bmr = (10 * weight) + (6.25 * heightCm) - (5 * ageY) + 5;
    } else {
        bmr = (10 * weight) + (6.25 * heightCm) - (5 * ageY) - 161;
    }

    const multipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        heavy: 1.725,
        athlete: 1.9
    };
    const factor = multipliers[activityLevel] || 1.2;
    const tdee = bmr * factor;

    let targetCalories = tdee;
    if (goal === 'loss') {
        targetCalories = tdee - 500;
    } else if (goal === 'lean') {
        targetCalories = tdee + 300;
    } else if (goal === 'fast') {
        targetCalories = tdee + 500;
    }
    targetCalories = Math.round(targetCalories);

    let protein = 0;
    if (goal === 'loss') {
        protein = weight * 2.2;
    } else if (goal === 'maintenance') {
        protein = weight * 1.6;
    } else {
        protein = weight * 2.0;
    }
    protein = Math.round(protein);

    let fat = Math.round(weight * 0.8);

    const proteinCalories = protein * 4;
    const fatCalories = fat * 9;
    const remainingCalories = targetCalories - proteinCalories - fatCalories;
    let carbs = Math.round(Math.max(0, remainingCalories) / 4);

    const waterRequirement = parseFloat((weight * 0.035).toFixed(1));
    const fiberGrams = Math.round((targetCalories / 1000) * 14);

    const filteredFoods = dbFoods.filter(f => {
        if (style === 'Veg' && f.type === 'Non-Veg') {
            return false;
        }
        return true;
    });

    const getFood = (nameQuery) => {
        return filteredFoods.find(f => f.food_name.toLowerCase().includes(nameQuery.toLowerCase())) || null;
    };

    let foodProteinTarget = protein;
    let foodCarbTarget = carbs;
    let foodFatTarget = fat;
    let foodCalorieTarget = targetCalories;

    if (wheySelected) {
        foodProteinTarget = Math.max(30, protein - 24);
        foodCarbTarget = Math.max(30, carbs - 3);
        foodFatTarget = Math.max(10, fat - 2);
        foodCalorieTarget = Math.max(1000, targetCalories - 120);
    }

    // Budgets based on 35% / 30% / 15% / 20%
    const budgets = {
        breakfast: { cal: foodCalorieTarget * 0.35, p: foodProteinTarget * 0.35, c: foodCarbTarget * 0.35, f: foodFatTarget * 0.35 },
        lunch: { cal: foodCalorieTarget * 0.30, p: foodProteinTarget * 0.30, c: foodCarbTarget * 0.30, f: foodFatTarget * 0.30 },
        snack: { cal: foodCalorieTarget * 0.15, p: foodProteinTarget * 0.15, c: foodCarbTarget * 0.15, f: foodFatTarget * 0.15 },
        dinner: { cal: foodCalorieTarget * 0.20, p: foodProteinTarget * 0.20, c: foodCarbTarget * 0.20, f: foodFatTarget * 0.20 }
    };

    const getServingsList = (min, max, inc) => {
        const list = [];
        for (let val = min; val <= max; val += inc) {
            list.push(val);
        }
        if (list.length === 0 || list[list.length - 1] !== max) {
            list.push(max);
        }
        return list;
    };

    const optimizeMeal = (mealTarget, proteinFood, carbFood, fatFood, sideFood, isDinner = false) => {
        if (!proteinFood && !carbFood && !fatFood && !sideFood) return [];
        let bestItems = [];
        let minError = Infinity;

        const pConstraints = proteinFood ? getServingConstraints(proteinFood, isDinner) : null;
        const cConstraints = carbFood ? getServingConstraints(carbFood, isDinner) : null;
        const fConstraints = fatFood ? getServingConstraints(fatFood, isDinner) : null;
        const sConstraints = sideFood ? getServingConstraints(sideFood, isDinner) : null;

        const pUnit = proteinFood ? getFoodUnit(proteinFood) : 'g';
        const cUnit = carbFood ? getFoodUnit(carbFood) : 'g';
        const fUnit = fatFood ? getFoodUnit(fatFood) : 'g';
        const sUnit = sideFood ? getFoodUnit(sideFood) : 'g';

        const pInc = pUnit === 'piece' ? 1 : 50;
        const cInc = cUnit === 'piece' ? 1 : 50;
        const fInc = fUnit === 'piece' ? 1 : 10;
        const sInc = sUnit === 'piece' ? 1 : 50;

        const pServings = proteinFood ? getServingsList(pConstraints.min, pConstraints.max, pInc) : [0];
        const cServings = carbFood ? getServingsList(cConstraints.min, cConstraints.max, cInc) : [0];
        const fServings = fatFood ? getServingsList(fConstraints.min, fConstraints.max, fInc) : [0];
        const sServings = sideFood ? getServingsList(sConstraints.min, sConstraints.max, sInc) : [0];

        if (fatFood) fServings.unshift(0);
        if (sideFood) sServings.unshift(0);

        for (const pQty of pServings) {
            if (pQty === 0 && proteinFood) continue;
            for (const cQty of cServings) {
                if (cQty === 0 && carbFood) continue;
                for (const fQty of fServings) {
                    for (const sQty of sServings) {
                        const items = [];
                        let totalP = 0, totalC = 0, totalF = 0, totalCals = 0;

                        if (proteinFood && pQty > 0) {
                            const scale = pUnit === 'piece' ? pQty : pQty / 100;
                            const item = getRealisticPortion(proteinFood, scale);
                            items.push(item);
                            totalP += item.protein; totalC += item.carbs; totalF += item.fat; totalCals += item.calories;
                        }
                        if (carbFood && cQty > 0) {
                            const scale = cUnit === 'piece' ? cQty : cQty / 100;
                            const item = getRealisticPortion(carbFood, scale);
                            items.push(item);
                            totalP += item.protein; totalC += item.carbs; totalF += item.fat; totalCals += item.calories;
                        }
                        if (fatFood && fQty > 0) {
                            const scale = fUnit === 'piece' ? fQty : fQty / 100;
                            const item = getRealisticPortion(fatFood, scale);
                            items.push(item);
                            totalP += item.protein; totalC += item.carbs; totalF += item.fat; totalCals += item.calories;
                        }
                        if (sideFood && sQty > 0) {
                            const scale = sUnit === 'piece' ? sQty : sQty / 100;
                            const item = getRealisticPortion(sideFood, scale);
                            items.push(item);
                            totalP += item.protein; totalC += item.carbs; totalF += item.fat; totalCals += item.calories;
                        }

                        const pErr = Math.abs(totalP - mealTarget.p);
                        const cErr = Math.abs(totalC - mealTarget.c);
                        const fErr = Math.abs(totalF - mealTarget.f);
                        const calErr = Math.abs(totalCals - mealTarget.cal) / 10;

                        const err = pErr * 2.0 + cErr + fErr + calErr;
                        if (err < minError) {
                            minError = err;
                            bestItems = items;
                        }
                    }
                }
            }
        }
        return bestItems;
    };

    const isNonVeg = style === 'Non-Veg';

    // 1. Breakfast (35%)
    const bfProtein = isNonVeg ? (getFood('Egg White') || getFood('Whole Egg')) : (getFood('Greek Yogurt') || getFood('Curd'));
    const bfCarb = getFood('Oats') || getFood('Idli') || getFood('Poha') || getFood('Dosa');
    const bfFat = getFood('Milk');
    const bfSide = getFood('Banana') || getFood('Apple');
    let breakfastItems = optimizeMeal(budgets.breakfast, bfProtein, bfCarb, bfFat, bfSide);

    // 2. Lunch (30%)
    const riceMealPref = (formData.riceMeal || 'lunch').toLowerCase();
    const lunchProtein = isNonVeg ? (getFood('Chicken Breast') || getFood('Fish')) : (getFood('Paneer') || getFood('Soy Chunks') || getFood('Moong Dal'));
    const lunchCarb = (riceMealPref === 'lunch') ? (getFood('White Rice') || getFood('Brown Rice')) : (getFood('Chapati') || getFood('Wheat Roti'));
    const lunchFat = getFood('Curd') || getFood('Buttermilk');
    const lunchSide = getFood('Mixed Vegetables') || getFood('Sprouts');
    let lunchItems = optimizeMeal(budgets.lunch, lunchProtein, lunchCarb, lunchFat, lunchSide);

    // 3. Snack (15%)
    const snackCarb = getFood('Banana') || getFood('Apple') || getFood('Orange');
    const snackFat = getFood('Peanuts') || getFood('Almonds') || getFood('Peanut Butter');
    let snackItems = optimizeMeal(budgets.snack, null, snackCarb, snackFat, null);

    // 4. Dinner (20%) - Lighter dinner constraints
    let dinnerProtein = isNonVeg ? (getFood('Fish') || getFood('Whole Egg') || getFood('Egg White') || getFood('Chicken Breast')) : (getFood('Paneer') || getFood('Curd') || getFood('Moong Dal'));
    const dinnerCarb = getFood('Chapati') || getFood('Wheat Roti');
    const dinnerSide = getFood('Mixed Vegetables') || getFood('Sprouts');
    let dinnerItems = optimizeMeal(budgets.dinner, dinnerProtein, dinnerCarb, null, dinnerSide, true);

    let totalP = 0, totalC = 0, totalF = 0, totalCals = 0;
    const calculateTotals = () => {
        totalP = 0; totalC = 0; totalF = 0; totalCals = 0;
        const all = [...breakfastItems, ...lunchItems, ...snackItems, ...dinnerItems];
        all.forEach(item => {
            totalP += item.protein;
            totalC += item.carbs;
            totalF += item.fat;
            totalCals += item.calories;
        });
    };
    calculateTotals();

    // 5. Deficit Filler Loop (Maximum 30 iterations)
    for (let fillIter = 0; fillIter < 30; fillIter++) {
        calculateTotals();
        const pDeficit = foodProteinTarget - totalP;
        const cDeficit = foodCarbTarget - totalC;
        const fDeficit = foodFatTarget - totalF;

        if (pDeficit <= 5 && cDeficit <= 8 && fDeficit <= 3) {
            break;
        }

        // Protein deficit (eggs -> chicken/paneer -> dairy)
        if (pDeficit > 5) {
            let handled = false;
            if (isNonVeg) {
                let eggItemIdx = breakfastItems.findIndex(item => item.name.toLowerCase().includes('egg'));
                if (eggItemIdx !== -1) {
                    const match = breakfastItems[eggItemIdx].name.match(/^(\d+)/);
                    if (match) {
                        const qty = parseInt(match[1], 10);
                        const constraints = getServingConstraints(getFood('Whole Egg'));
                        if (qty < constraints.max) {
                            breakfastItems[eggItemIdx] = getRealisticPortion(getFood('Whole Egg'), qty + 1);
                            handled = true;
                        }
                    }
                } else {
                    breakfastItems.push(getRealisticPortion(getFood('Whole Egg'), 1));
                    handled = true;
                }
            }

            if (!handled) {
                let targetFood = isNonVeg ? getFood('Chicken Breast') : getFood('Paneer');
                if (targetFood) {
                    let itemIdx = lunchItems.findIndex(item => item.name.toLowerCase().includes(targetFood.food_name.toLowerCase()));
                    if (itemIdx !== -1) {
                        const match = lunchItems[itemIdx].name.match(/^(\d+)/);
                        if (match) {
                            const grams = parseInt(match[1], 10);
                            const constraints = getServingConstraints(targetFood);
                            if (grams + 50 <= constraints.max) {
                                lunchItems[itemIdx] = getRealisticPortion(targetFood, (grams + 50) / 100);
                                handled = true;
                            }
                        }
                    } else {
                        lunchItems.push(getRealisticPortion(targetFood, 1.0));
                        handled = true;
                    }
                }
            }

            if (!handled) {
                let targetFood = getFood('Greek Yogurt') || getFood('Curd') || getFood('Milk');
                if (targetFood) {
                    let itemIdx = breakfastItems.findIndex(item => item.name.toLowerCase().includes(targetFood.food_name.toLowerCase()));
                    if (itemIdx !== -1) {
                        const match = breakfastItems[itemIdx].name.match(/^(\d+)/);
                        if (match) {
                            const qty = parseInt(match[1], 10);
                            const constraints = getServingConstraints(targetFood);
                            const step = targetFood.food_name.toLowerCase().includes('milk') ? 100 : 50;
                            if (qty + step <= constraints.max) {
                                breakfastItems[itemIdx] = getRealisticPortion(targetFood, (qty + step) / 100);
                                handled = true;
                            }
                        }
                    } else {
                        breakfastItems.push(getRealisticPortion(targetFood, 1.5));
                        handled = true;
                    }
                }
            }

            if (!handled) break;
            continue;
        }

        // Carb deficit (rice -> chapati -> oats -> banana)
        if (cDeficit > 8) {
            let handled = false;
            const targetRice = getFood('White Rice') || getFood('Brown Rice');
            if (targetRice) {
                let itemIdx = lunchItems.findIndex(item => item.name.toLowerCase().includes(targetRice.food_name.toLowerCase()));
                if (itemIdx !== -1) {
                    const match = lunchItems[itemIdx].name.match(/^(\d+)/);
                    if (match) {
                        const grams = parseInt(match[1], 10);
                        const constraints = getServingConstraints(targetRice);
                        if (grams + 50 <= constraints.max) {
                            lunchItems[itemIdx] = getRealisticPortion(targetRice, (grams + 50) / 100);
                            handled = true;
                        }
                    }
                }
            }

            if (!handled) {
                const targetChapati = getFood('Chapati') || getFood('Wheat Roti');
                if (targetChapati) {
                    let itemIdx = lunchItems.findIndex(item => item.name.toLowerCase().includes(targetChapati.food_name.toLowerCase()));
                    if (itemIdx !== -1) {
                        const match = lunchItems[itemIdx].name.match(/^(\d+)/);
                        if (match) {
                            const qty = parseInt(match[1], 10);
                            const constraints = getServingConstraints(targetChapati);
                            if (qty < constraints.max) {
                                lunchItems[itemIdx] = getRealisticPortion(targetChapati, qty + 1);
                                handled = true;
                            }
                        }
                    }
                }
            }

            if (!handled) {
                const targetOats = getFood('Oats');
                if (targetOats) {
                    let itemIdx = breakfastItems.findIndex(item => item.name.toLowerCase().includes(targetOats.food_name.toLowerCase()));
                    if (itemIdx !== -1) {
                        const match = breakfastItems[itemIdx].name.match(/^(\d+)/);
                        if (match) {
                            const grams = parseInt(match[1], 10);
                            const constraints = getServingConstraints(targetOats);
                            if (grams + 25 <= constraints.max) {
                                breakfastItems[itemIdx] = getRealisticPortion(targetOats, (grams + 25) / 100);
                                handled = true;
                            }
                        }
                    }
                }
            }

            if (!handled) {
                const targetBanana = getFood('Banana');
                if (targetBanana) {
                    let itemIdx = snackItems.findIndex(item => item.name.toLowerCase().includes(targetBanana.food_name.toLowerCase()));
                    if (itemIdx !== -1) {
                        const match = snackItems[itemIdx].name.match(/^(\d+)/);
                        if (match) {
                            const qty = parseInt(match[1], 10);
                            const constraints = getServingConstraints(targetBanana);
                            if (qty < constraints.max) {
                                snackItems[itemIdx] = getRealisticPortion(targetBanana, qty + 1);
                                handled = true;
                            }
                        }
                    }
                }
            }

            if (!handled) break;
            continue;
        }

        // Fat deficit (nuts -> seeds -> peanut butter)
        if (fDeficit > 3) {
            let handled = false;
            const targetNuts = getFood('Peanuts') || getFood('Almonds') || getFood('Walnuts') || getFood('Cashews');
            if (targetNuts) {
                let itemIdx = snackItems.findIndex(item => item.name.toLowerCase().includes(targetNuts.food_name.toLowerCase()));
                if (itemIdx !== -1) {
                    const match = snackItems[itemIdx].name.match(/^(\d+)/);
                    if (match) {
                        const grams = parseInt(match[1], 10);
                        const constraints = getServingConstraints(targetNuts);
                        if (grams + 10 <= constraints.max) {
                            snackItems[itemIdx] = getRealisticPortion(targetNuts, (grams + 10) / 100);
                            handled = true;
                        }
                    }
                }
            }

            if (!handled) {
                const targetPB = getFood('Peanut Butter');
                if (targetPB) {
                    let itemIdx = snackItems.findIndex(item => item.name.toLowerCase().includes(targetPB.food_name.toLowerCase()));
                    if (itemIdx !== -1) {
                        const match = snackItems[itemIdx].name.match(/^(\d+)/);
                        if (match) {
                            const grams = parseInt(match[1], 10);
                            const constraints = getServingConstraints(targetPB);
                            if (grams + 10 <= constraints.max) {
                                snackItems[itemIdx] = getRealisticPortion(targetPB, (grams + 10) / 100);
                                handled = true;
                            }
                        }
                    }
                }
            }

            if (!handled) break;
            continue;
        }
    }

    // 6. Supplement Support (Whey Protein and Creatine Monohydrate)
    const findMealForPlacement = (mealsList, priorities) => {
        for (const priority of priorities) {
            const found = mealsList.find(m => m.name.toLowerCase().includes(priority.toLowerCase()));
            if (found) return found;
        }
        return mealsList[0];
    };

    const mealsList = [
        { name: '🌅 Breakfast (35%)', items: breakfastItems },
        { name: '🍛 Lunch (30%)', items: lunchItems },
        { name: '🥜 Snack (15%)', items: snackItems },
        { name: '🌙 Dinner (20%)', items: dinnerItems }
    ];

    if (wheySelected) {
        const wheyItem = {
            name: "1 Scoop Whey Protein",
            calories: 120,
            protein: 24,
            carbs: 3,
            fat: 2,
            fiber: 0,
            is_optional: false,
            alternative_name: null
        };
        const targetMeal = findMealForPlacement(mealsList, ['Post Workout', 'Snack']);
        targetMeal.items.push(wheyItem);
    }

    if (creatineSelected) {
        const creatineItem = {
            name: "Creatine Monohydrate (5g)",
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            type: "Supplement",
            is_optional: false,
            alternative_name: null
        };
        const targetMeal = findMealForPlacement(mealsList, ['Post Workout', 'Snack', 'Breakfast']);
        targetMeal.items.push(creatineItem);
    }

    // Recalculate totals including supplements (Creatine does not affect macro totals)
    totalP = 0; totalC = 0; totalF = 0; totalCals = 0;
    mealsList.forEach(meal => {
        meal.items.forEach(item => {
            if (item.name.toLowerCase().includes('creatine')) return;
            totalP += item.protein;
            totalC += item.carbs;
            totalF += item.fat;
            totalCals += item.calories;
        });
    });

    // 7. Dinner Safety Clamper (Ensure dinner calories never exceed 25% of daily total)
    let dinnerCals = mealsList[3].items.reduce((sum, item) => sum + item.calories, 0);
    if (dinnerCals > totalCals * 0.25) {
        const scaleDown = (totalCals * 0.22) / dinnerCals;
        mealsList[3].items = mealsList[3].items.map(item => {
            const match = item.name.match(/^(\d+)/);
            const currentQty = match ? parseInt(match[1], 10) : 100;
            const unit = getFoodUnit(getFood(item.name.replace(/^\d+(g|ml)?\s+/, '')));
            let newQty = currentQty * scaleDown;
            if (unit === 'piece') {
                newQty = Math.max(1, Math.round(newQty));
            } else {
                newQty = Math.max(25, Math.round(newQty / 25) * 25);
            }
            const dbFood = getFood(item.name.replace(/^\d+(g|ml)?\s+/, ''));
            return dbFood ? getRealisticPortion(dbFood, unit === 'piece' ? newQty : newQty / 100) : item;
        });

        // Recalculate totals after dinner scaling
        totalP = 0; totalC = 0; totalF = 0; totalCals = 0;
        mealsList.forEach(meal => {
            meal.items.forEach(item => {
                if (item.name.toLowerCase().includes('creatine')) return;
                totalP += item.protein;
                totalC += item.carbs;
                totalF += item.fat;
                totalCals += item.calories;
            });
        });
    }

    const bestPlan = {
        totalCals,
        totalP,
        totalC,
        totalF,
        meals: mealsList
    };

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


