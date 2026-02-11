const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

const WorkoutPlan = sequelize.define('WorkoutPlan', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    goal: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    level: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    days_per_week: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    time_per_session: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    plan_data: {
        type: DataTypes.JSON, // Stores the weekly split as JSON
        allowNull: false,
    },
});

const WorkoutLog = sequelize.define('WorkoutLog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    exercise_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sets: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    reps: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    weight: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
});

const DietLog = sequelize.define('DietLog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    meal_type: {
        type: DataTypes.ENUM('Breakfast', 'Lunch', 'Dinner', 'Snacks'),
        allowNull: false,
    },
    item_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    protein: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
});

const ProgressImage = sequelize.define('ProgressImage', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    weight: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
});

// Relationships
User.hasOne(WorkoutPlan);
WorkoutPlan.belongsTo(User);

User.hasMany(WorkoutLog);
WorkoutLog.belongsTo(User);

User.hasMany(DietLog);
DietLog.belongsTo(User);

User.hasMany(ProgressImage);
ProgressImage.belongsTo(User);

module.exports = { User, WorkoutPlan, WorkoutLog, DietLog, ProgressImage };
