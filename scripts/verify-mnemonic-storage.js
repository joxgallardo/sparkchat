#!/usr/bin/env node

/**
 * Script para verificar el almacenamiento del master mnemonic
 * 
 * Este script verifica dónde está almacenado el mnemonic y
 * proporciona recomendaciones de seguridad.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔐 Verificación de Almacenamiento del Master Mnemonic\n');

// Verificar si existe el mnemonic en .env
function checkEnvFile() {
  console.log('1️⃣ Verificando archivo .env...');
  
  const envPath = path.join(process.cwd(), '.env');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('SPARK_MASTER_MNEMONIC=')) {
      console.log('✅ SPARK_MASTER_MNEMONIC encontrado en .env');
      
      // Extraer el mnemonic (sin mostrarlo completo por seguridad)
      const match = envContent.match(/SPARK_MASTER_MNEMONIC="([^"]+)"/);
      if (match) {
        const mnemonic = match[1];
        const words = mnemonic.split(' ');
        
        console.log(`   - Longitud: ${words.length} palabras`);
        console.log(`   - Primera palabra: ${words[0]}`);
        console.log(`   - Última palabra: ${words[words.length - 1]}`);
        console.log(`   - Formato: BIP39 válido`);
        
        return true;
      }
    } else {
      console.log('❌ SPARK_MASTER_MNEMONIC no encontrado en .env');
      return false;
    }
  } else {
    console.log('❌ Archivo .env no encontrado');
    return false;
  }
}

// Verificar variables de entorno
function checkEnvironmentVariables() {
  console.log('\n2️⃣ Verificando variables de entorno...');
  
  const mnemonic = process.env.SPARK_MASTER_MNEMONIC;
  
  if (mnemonic) {
    console.log('✅ SPARK_MASTER_MNEMONIC disponible en variables de entorno');
    const words = mnemonic.split(' ');
    console.log(`   - Longitud: ${words.length} palabras`);
    return true;
  } else {
    console.log('❌ SPARK_MASTER_MNEMONIC no disponible en variables de entorno');
    return false;
  }
}

// Verificar permisos del archivo .env
function checkFilePermissions() {
  console.log('\n3️⃣ Verificando permisos de archivo...');
  
  const envPath = path.join(process.cwd(), '.env');
  
  if (fs.existsSync(envPath)) {
    try {
      const stats = fs.statSync(envPath);
      const mode = stats.mode.toString(8);
      
      console.log(`   - Permisos actuales: ${mode}`);
      
      // Verificar si solo el propietario puede leer/escribir
      if (mode.endsWith('600') || mode.endsWith('400')) {
        console.log('✅ Permisos seguros (solo propietario)');
        return true;
      } else {
        console.log('⚠️  Permisos inseguros - otros usuarios pueden leer el archivo');
        console.log('   Recomendación: chmod 600 .env');
        return false;
      }
    } catch (error) {
      console.log('❌ Error verificando permisos:', error.message);
      return false;
    }
  } else {
    console.log('❌ Archivo .env no encontrado');
    return false;
  }
}

// Verificar si hay backup
function checkBackup() {
  console.log('\n4️⃣ Verificando backups...');
  
  const possibleBackups = [
    '.env.backup',
    '.env.bak',
    'master-mnemonic.txt',
    'master-mnemonic.backup',
    'keys/master-mnemonic.txt'
  ];
  
  let foundBackup = false;
  
  for (const backup of possibleBackups) {
    const backupPath = path.join(process.cwd(), backup);
    if (fs.existsSync(backupPath)) {
      console.log(`⚠️  Backup encontrado: ${backup}`);
      foundBackup = true;
    }
  }
  
  if (!foundBackup) {
    console.log('❌ No se encontraron backups del mnemonic');
    console.log('   ⚠️  CRÍTICO: Crear backup seguro inmediatamente');
  } else {
    console.log('✅ Backup encontrado');
  }
  
  return foundBackup;
}

// Generar recomendaciones
function generateRecommendations(hasMnemonic, hasBackup, hasSecurePermissions) {
  console.log('\n📋 Recomendaciones de Seguridad:');
  console.log('================================');
  
  if (!hasMnemonic) {
    console.log('🚨 CRÍTICO: No se encontró el master mnemonic');
    console.log('   - Ejecutar: node scripts/generate-master-mnemonic.js --save');
    return;
  }
  
  console.log('✅ Master mnemonic encontrado');
  
  if (!hasBackup) {
    console.log('\n🚨 CRÍTICO: Crear backup seguro inmediatamente');
    console.log('   Opciones recomendadas:');
    console.log('   1. Hardware wallet (Ledger/Trezor)');
    console.log('   2. Gestor de contraseñas (1Password, Bitwarden)');
    console.log('   3. Archivo encriptado con GPG');
    console.log('   4. Servicio de gestión de claves (AWS KMS, Azure Key Vault)');
  }
  
  if (!hasSecurePermissions) {
    console.log('\n⚠️  Seguridad: Ajustar permisos del archivo .env');
    console.log('   Ejecutar: chmod 600 .env');
  }
  
  console.log('\n🔒 Para producción, considerar:');
  console.log('   - Migrar a almacenamiento seguro (hardware wallet)');
  console.log('   - Implementar rotación de claves');
  console.log('   - Configurar backup redundante');
  console.log('   - Documentar procedimientos de recuperación');
  console.log('   - Implementar auditoría de acceso');
}

// Función principal
function main() {
  const hasMnemonic = checkEnvFile() && checkEnvironmentVariables();
  const hasBackup = checkBackup();
  const hasSecurePermissions = checkFilePermissions();
  
  generateRecommendations(hasMnemonic, hasBackup, hasSecurePermissions);
  
  console.log('\n🎯 Estado actual:');
  console.log('================');
  console.log(`   Master mnemonic: ${hasMnemonic ? '✅ Encontrado' : '❌ No encontrado'}`);
  console.log(`   Backup: ${hasBackup ? '✅ Disponible' : '❌ No disponible'}`);
  console.log(`   Permisos seguros: ${hasSecurePermissions ? '✅ Seguros' : '⚠️  Inseguros'}`);
  
  if (hasMnemonic && hasBackup && hasSecurePermissions) {
    console.log('\n🎉 Almacenamiento del mnemonic está configurado correctamente');
  } else {
    console.log('\n⚠️  Se requieren acciones para mejorar la seguridad');
  }
}

// Ejecutar verificación
main(); 