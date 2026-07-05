const fs = require('fs');
const path = require('path');
const db = require('./connection');

const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema);

const orderColumns = db.prepare("PRAGMA table_info(orders)").all().map((c) => c.name);
if (!orderColumns.includes('kitchen_sent_at')) {
  db.exec('ALTER TABLE orders ADD COLUMN kitchen_sent_at TEXT');
  console.log('Migrasyon: orders.kitchen_sent_at kolonu eklendi.');
}
if (!orderColumns.includes('opened_channel')) {
  db.exec("ALTER TABLE orders ADD COLUMN opened_channel TEXT NOT NULL DEFAULT 'web'");
  console.log('Migrasyon: orders.opened_channel kolonu eklendi.');
}
if (!orderColumns.includes('discount_type')) {
  db.exec('ALTER TABLE orders ADD COLUMN discount_type TEXT');
  console.log('Migrasyon: orders.discount_type kolonu eklendi.');
}
if (!orderColumns.includes('discount_value')) {
  db.exec('ALTER TABLE orders ADD COLUMN discount_value REAL');
  console.log('Migrasyon: orders.discount_value kolonu eklendi.');
}

const categoryColumns = db.prepare("PRAGMA table_info(categories)").all().map((c) => c.name);
if (!categoryColumns.includes('allow_modifiers')) {
  db.exec('ALTER TABLE categories ADD COLUMN allow_modifiers INTEGER NOT NULL DEFAULT 0');
  console.log('Migrasyon: categories.allow_modifiers kolonu eklendi.');
}

const orderItemColumns = db.prepare("PRAGMA table_info(order_items)").all().map((c) => c.name);
if (!orderItemColumns.includes('extra_cheese_qty')) {
  db.exec('ALTER TABLE order_items ADD COLUMN extra_cheese_qty INTEGER NOT NULL DEFAULT 0');
  console.log('Migrasyon: order_items.extra_cheese_qty kolonu eklendi.');
}
if (!orderItemColumns.includes('half_portion')) {
  db.exec('ALTER TABLE order_items ADD COLUMN half_portion INTEGER NOT NULL DEFAULT 0');
  console.log('Migrasyon: order_items.half_portion kolonu eklendi.');
}

// users.role CHECK kisiti 'mobile' degerini icermiyorsa tabloyu yeniden olustur
// (SQLite'ta mevcut bir CHECK kisiti ALTER TABLE ile degistirilemez).
const usersTableDef = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
if (usersTableDef && !usersTableDef.sql.includes('mobile')) {
  // DROP TABLE users, orders.opened_by/closed_by FK'siyle korunuyor - gecici olarak kapatilmali.
  // PRAGMA foreign_keys bir islem icindeyken degistirilemez, o yuzden transaction disinda ayarlanir.
  db.pragma('foreign_keys = OFF');
  const rebuildUsersTable = db.transaction(() => {
    db.exec(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'personel', 'mobile')),
        display_name TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    db.exec(`
      INSERT INTO users_new (id, username, password_hash, role, display_name, is_active, created_at)
      SELECT id, username, password_hash, role, display_name, is_active, created_at FROM users
    `);
    db.exec('DROP TABLE users');
    db.exec('ALTER TABLE users_new RENAME TO users');
  });
  rebuildUsersTable();
  db.pragma('foreign_keys = ON');
  console.log("Migrasyon: users.role kisiti 'mobile' degerini destekleyecek sekilde guncellendi.");
}

console.log('Migrasyon tamamlandi: tablolar olusturuldu/dogrulandi.');
db.close();
