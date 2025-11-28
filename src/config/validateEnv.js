const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'CLIENT_URL',
  'NODE_ENV'
];

const optionalEnvVars = [
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'VIBER_BOT_TOKEN',
  'TELEGRAM_BOT_TOKEN',
  'MESSENGER_PAGE_ACCESS_TOKEN'
];

function validateEnv() {
  const missing = [];
  const warnings = [];
  
  console.log('🔍 Validating environment variables...\n');
  
  // Check required vars
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      console.log(`✅ ${varName}: Set`);
    }
  }
  
  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\n📝 Action required:');
    console.error('   1. Copy .env.example to .env');
    console.error('   2. Fill in the missing values');
    console.error('   3. Restart the server\n');
    process.exit(1);
  }
  
  // Check optional vars
  for (const varName of optionalEnvVars) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }
  
  if (warnings.length > 0) {
    console.warn('\n⚠️  Optional environment variables not set:');
    warnings.forEach(v => console.warn(`   - ${v}`));
    console.warn('   (These features will be disabled)\n');
  }
  
  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET.length < 32) {
    console.error('\n❌ JWT_SECRET must be at least 32 characters');
    console.error('   Generate a strong secret with:');
    console.error('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    console.error('');
    process.exit(1);
  }
  
  // Validate DATABASE_URL format
  if (!process.env.DATABASE_URL.startsWith('postgres')) {
    console.error('\n❌ DATABASE_URL must be a valid PostgreSQL connection string');
    console.error('   Format: postgresql://user:password@host:port/database\n');
    process.exit(1);
  }
  
  console.log('\n✅ Environment validation passed\n');
}

module.exports = { validateEnv };
