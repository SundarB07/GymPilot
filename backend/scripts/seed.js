import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import { supabase } from '../src/config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILE_PATH = path.join(__dirname, '..', 'data', 'Comprehensive_Gym_Exercises_With_Difficulty.csv');

async function seed() {
  console.log('🚀 Starting GymPilot Database Seeding Protocol...');

  // 1. Check environment variables
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('\n⚠️  WARNING: "SUPABASE_SERVICE_ROLE_KEY" is missing in your backend/.env.');
    console.warn('   If Row Level Security (RLS) is enabled in your Supabase project,');
    console.warn('   this seed script might fail due to insufficient write permissions.');
    console.warn('   To fix this, paste your "service_role" key in backend/.env.\n');
  }

  // 2. Verify CSV file existence
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ ERROR: Could not find CSV file at: ${CSV_FILE_PATH}`);
    process.exit(1);
  }

  const exercises = [];

  // 3. Parse CSV file
  console.log(`📦 Parsing CSV data from: ${path.basename(CSV_FILE_PATH)}...`);
  
  fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', (row) => {
      // Map CSV headers to database columns
      // CSV headers: main_muscle_group, sub_muscle_group, exercise_name, equipment_required, mechanics, difficulty
      if (row.exercise_name && row.main_muscle_group) {
        exercises.push({
          main_muscle_group: row.main_muscle_group.trim(),
          sub_muscle_group: row.sub_muscle_group ? row.sub_muscle_group.trim() : 'Overall',
          exercise_name: row.exercise_name.trim(),
          equipment_required: row.equipment_required ? row.equipment_required.trim() : 'None',
          mechanics: row.mechanics ? row.mechanics.trim() : 'Compound',
          difficulty: row.difficulty ? row.difficulty.trim() : 'Beginner'
        });
      }
    })
    .on('end', async () => {
      console.log(`✅ Successfully parsed ${exercises.length} exercises from CSV.`);

      try {
        // 4. Clear existing exercises in the database for a clean slate
        console.log('🧹 Clearing existing exercises in Supabase...');
        const { error: deleteError } = await supabase
          .from('exercises')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything safely

        if (deleteError) {
          throw new Error(`Failed to clear database table: ${deleteError.message}`);
        }
        console.log('✅ Existing exercises cleared successfully.');

        // 5. Bulk insert the parsed exercises in batches of 50 to avoid any database payload limits
        console.log(`📤 Seeding database with ${exercises.length} new exercises...`);
        const batchSize = 50;
        let seededCount = 0;

        for (let i = 0; i < exercises.length; i += batchSize) {
          const batch = exercises.slice(i, i + batchSize);
          const { error: insertError } = await supabase
            .from('exercises')
            .insert(batch);

          if (insertError) {
            throw new Error(`Insertion failed at batch index ${i}: ${insertError.message}`);
          }
          seededCount += batch.length;
          console.log(`   [+] Seeded ${seededCount}/${exercises.length} exercises...`);
        }

        console.log('\n======================================================');
        console.log(' 🎉 GymPilot Exercises Seeded Successfully!');
        console.log(` Total Exercises: ${seededCount}`);
        console.log('======================================================\n');
        process.exit(0);

      } catch (error) {
        console.error('\n❌ CRITICAL SEEDING ERROR:');
        console.error(error.message);
        console.error('------------------------------------------------------');
        console.warn('💡 Tip: Make sure your Supabase URL is correct and you are using');
        console.warn('   the "service_role" secret key in backend/.env to bypass RLS.');
        console.error('------------------------------------------------------\n');
        process.exit(1);
      }
    });
}

seed();
