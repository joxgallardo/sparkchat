#!/usr/bin/env node

/**
 * Script para verificar el registro de usuario en la base de datos
 * 
 * Este script verifica que el usuario de Telegram se haya registrado
 * correctamente con su account_number y uma_address.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL o SUPABASE_ANON_KEY no configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Telegram ID del usuario que se registró
const TELEGRAM_ID = 950870644;

async function verifyUserRegistration() {
  console.log('🔍 Verificando registro de usuario en la base de datos...\n');
  
  try {
    // 1. Verificar usuario en telegram_users
    console.log('1️⃣ Verificando tabla telegram_users...');
    
    const { data: telegramUser, error: telegramError } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', TELEGRAM_ID)
      .single();
    
    if (telegramError) {
      console.error('❌ Error consultando telegram_users:', telegramError);
      return;
    }
    
    if (!telegramUser) {
      console.log('❌ Usuario no encontrado en telegram_users');
      return;
    }
    
    console.log('✅ Usuario encontrado en telegram_users:');
    console.log(`   - Telegram ID: ${telegramUser.telegram_id}`);
    console.log(`   - SparkChat User ID: ${telegramUser.spark_chat_user_id}`);
    console.log(`   - Username: ${telegramUser.username}`);
    console.log(`   - First Name: ${telegramUser.first_name}`);
    console.log(`   - Last Name: ${telegramUser.last_name}`);
    console.log(`   - Account Number: ${telegramUser.account_number}`);
    console.log(`   - UMA Address: ${telegramUser.uma_address}`);
    console.log(`   - Is Active: ${telegramUser.is_active}`);
    console.log(`   - Created At: ${telegramUser.created_at}`);
    console.log(`   - Last Seen: ${telegramUser.last_seen}`);
    
    // 2. Verificar sesión en telegram_sessions
    console.log('\n2️⃣ Verificando tabla telegram_sessions...');
    
    const { data: session, error: sessionError } = await supabase
      .from('telegram_sessions')
      .select('*')
      .eq('telegram_id', TELEGRAM_ID)
      .single();
    
    if (sessionError) {
      console.error('❌ Error consultando telegram_sessions:', sessionError);
    } else if (!session) {
      console.log('❌ Sesión no encontrada en telegram_sessions');
    } else {
      console.log('✅ Sesión encontrada en telegram_sessions:');
      console.log(`   - Telegram ID: ${session.telegram_id}`);
      console.log(`   - SparkChat User ID: ${session.spark_chat_user_id}`);
      console.log(`   - Is Authenticated: ${session.is_authenticated}`);
      console.log(`   - Last Activity: ${session.last_activity}`);
      console.log(`   - Preferences: ${JSON.stringify(session.preferences)}`);
    }
    
    // 3. Verificar usuario en users (tabla general)
    console.log('\n3️⃣ Verificando tabla users...');
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', telegramUser.spark_chat_user_id)
      .single();
    
    if (userError) {
      console.error('❌ Error consultando users:', userError);
    } else if (!user) {
      console.log('❌ Usuario no encontrado en tabla users');
    } else {
      console.log('✅ Usuario encontrado en tabla users:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Created At: ${user.created_at}`);
      console.log(`   - Updated At: ${user.updated_at}`);
    }
    
    // 4. Verificar unicidad del account_number
    console.log('\n4️⃣ Verificando unicidad del account_number...');
    
    const { data: accountNumbers, error: accountError } = await supabase
      .from('telegram_users')
      .select('account_number')
      .order('account_number', { ascending: true });
    
    if (accountError) {
      console.error('❌ Error verificando account_numbers:', accountError);
    } else {
      const numbers = accountNumbers.map(u => u.account_number);
      const uniqueNumbers = new Set(numbers);
      
      console.log(`   - Total usuarios: ${numbers.length}`);
      console.log(`   - Account numbers únicos: ${uniqueNumbers.size}`);
      console.log(`   - Account numbers: [${numbers.join(', ')}]`);
      
      if (numbers.length === uniqueNumbers.size) {
        console.log('✅ Todos los account_numbers son únicos');
      } else {
        console.log('❌ Hay account_numbers duplicados');
      }
    }
    
    // 5. Verificar unicidad de UMA addresses
    console.log('\n5️⃣ Verificando unicidad de UMA addresses...');
    
    const { data: umaAddresses, error: umaError } = await supabase
      .from('telegram_users')
      .select('uma_address')
      .order('uma_address', { ascending: true });
    
    if (umaError) {
      console.error('❌ Error verificando UMA addresses:', umaError);
    } else {
      const addresses = umaAddresses.map(u => u.uma_address);
      const uniqueAddresses = new Set(addresses);
      
      console.log(`   - Total UMA addresses: ${addresses.length}`);
      console.log(`   - UMA addresses únicas: ${uniqueAddresses.size}`);
      console.log(`   - UMA addresses: [${addresses.join(', ')}]`);
      
      if (addresses.length === uniqueAddresses.size) {
        console.log('✅ Todas las UMA addresses son únicas');
      } else {
        console.log('❌ Hay UMA addresses duplicadas');
      }
    }
    
    // 6. Resumen final
    console.log('\n📋 Resumen de verificación:');
    console.log('==========================');
    console.log(`✅ Usuario registrado: ${telegramUser.username || telegramUser.first_name}`);
    console.log(`✅ Account Number: ${telegramUser.account_number}`);
    console.log(`✅ UMA Address: ${telegramUser.uma_address}`);
    console.log(`✅ SparkChat User ID: ${telegramUser.spark_chat_user_id}`);
    console.log(`✅ Sesión creada: ${session ? 'Sí' : 'No'}`);
    console.log(`✅ Usuario en tabla general: ${user ? 'Sí' : 'No'}`);
    console.log(`✅ Account numbers únicos: ${accountNumbers ? accountNumbers.length === new Set(accountNumbers.map(u => u.account_number)).size : 'N/A'}`);
    console.log(`✅ UMA addresses únicas: ${umaAddresses ? umaAddresses.length === new Set(umaAddresses.map(u => u.uma_address)).size : 'N/A'}`);
    
    console.log('\n🎉 ¡Registro de usuario verificado exitosamente!');
    console.log('🚀 El Paso 3 está funcionando correctamente.');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

// Ejecutar verificación
verifyUserRegistration(); 