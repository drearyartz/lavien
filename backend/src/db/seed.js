const bcrypt = require('bcrypt');
const db = require('./connection');

const SALT_ROUNDS = 10;

function seedUsers() {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO users (username, password_hash, role, display_name)
    VALUES (?, ?, ?, ?)
  `);

  const users = [
    { username: 'admin', password: '480969', role: 'admin', display_name: 'Yönetici' },
    { username: 'personel', password: '000000', role: 'personel', display_name: 'Personel' },
  ];

  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, SALT_ROUNDS);
    const result = insert.run(u.username, hash, u.role, u.display_name);
    if (result.changes > 0) {
      console.log(`Kullanici olusturuldu: ${u.username} (${u.role})`);
    } else {
      console.log(`Kullanici zaten mevcut, atlandi: ${u.username}`);
    }
  }
}

function seedTables() {
  const insert = db.prepare(`INSERT INTO tables (name) VALUES (?)`);
  const findTable = db.prepare(`SELECT id FROM tables WHERE name = ?`);

  for (let i = 1; i <= 10; i += 1) {
    const name = `Masa ${i}`;
    const existing = findTable.get(name);
    if (!existing) {
      insert.run(name);
      console.log(`Masa olusturuldu: ${name}`);
    }
  }
}

// Kategori/urun menusu seedMenu.js'te (npm run db:seed bu ikisini sirayla calistirir).
seedUsers();
seedTables();

console.log('Seed tamamlandi.');
db.close();
