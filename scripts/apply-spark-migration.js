/**
 * Script to apply Spark migration to Supabase database
 * This script runs the migration SQL to add account_number and uma_address columns
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease check your .env.local file');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySparkMigration() {
  console.log('🚀 Applying Spark migration to Supabase database...\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'scripts', 'migrate-to-spark-schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded successfully');
    console.log('🔧 Executing migration...\n');

    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql doesn't exist, try direct SQL execution
      console.log('⚠️  exec_sql function not available, trying direct SQL execution...');
      
      // Split the SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        try {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (stmtError) {
            console.warn(`⚠️  Statement failed (this might be expected): ${stmtError.message}`);
          }
        } catch (e) {
          console.warn(`⚠️  Statement execution failed (this might be expected): ${e.message}`);
        }
      }
    } else {
      console.log('✅ Migration executed successfully');
    }

    // Verify the migration by checking if columns exist
    console.log('\n🔍 Verifying migration...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'telegram_users')
      .in('column_name', ['account_number', 'uma_address']);

    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
      return;
    }

    const columnNames = columns.map(col => col.column_name);
    
    if (columnNames.includes('account_number') && columnNames.includes('uma_address')) {
      console.log('✅ Migration verification successful!');
      console.log('   - account_number column exists');
      console.log('   - uma_address column exists');
    } else {
      console.error('❌ Migration verification failed!');
      console.error('   Missing columns:', {
        account_number: columnNames.includes('account_number'),
        uma_address: columnNames.includes('uma_address')
      });
      return;
    }

    // Check if there are existing users and update them
    console.log('\n👥 Checking for existing users...');
    
    const { data: existingUsers, error: usersError } = await supabase
      .from('telegram_users')
      .select('telegram_id, username, account_number, uma_address')
      .limit(5);

    if (usersError) {
      console.error('❌ Error checking existing users:', usersError);
      return;
    }

    console.log(`📊 Found ${existingUsers.length} users in database`);
    
    if (existingUsers.length > 0) {
      console.log('📋 Sample users:');
      existingUsers.forEach(user => {
        console.log(`   - ID: ${user.telegram_id}, Username: ${user.username || 'N/A'}`);
        console.log(`     Account Number: ${user.account_number || 'NOT SET'}`);
        console.log(`     UMA Address: ${user.uma_address || 'NOT SET'}`);
      });
    }

    console.log('\n🎉 Spark migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run the test script: npx tsx src/bot/test-spark-database-integration.ts');
    console.log('   2. Verify that new users get account_number and uma_address assigned');
    console.log('   3. Proceed with Step 3 of the implementation plan');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applySparkMigration().catch(console.error); 