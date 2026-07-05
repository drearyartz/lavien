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

function seedCategoriesAndProducts() {
  const insertCategory = db.prepare(`
    INSERT INTO categories (name, sort_order) VALUES (?, ?)
  `);
  const findCategory = db.prepare(`SELECT id FROM categories WHERE name = ?`);
  const insertProduct = db.prepare(`
    INSERT INTO products (category_id, name, price) VALUES (?, ?, ?)
  `);
  const countProducts = db.prepare(`SELECT COUNT(*) as c FROM products WHERE category_id = ? AND name = ?`);

  const menu = [
    {
      category: 'Sıcak İçecekler',
      items: [
        { name: 'Türk Kahvesi', price: 60 },
        { name: 'Filtre Kahve', price: 70 },
        { name: 'Çay', price: 30 },
        { name: 'Sahlep', price: 80 },
      ],
    },
    {
      category: 'Soğuk İçecekler',
      items: [
        { name: 'Limonata', price: 90 },
        { name: 'Ice Latte', price: 100 },
        { name: 'Kola', price: 60 },
      ],
    },
    {
      category: 'Tatlılar',
      items: [
        { name: 'Cheesecake', price: 150 },
        { name: 'Brownie', price: 130 },
      ],
    },
    {
      category: 'Kahvaltılık',
      items: [
        { name: 'Serpme Kahvaltı', price: 350 },
        { name: 'Omlet', price: 120 },
      ],
    },
  ];

  let sortOrder = 0;
  for (const group of menu) {
    let cat = findCategory.get(group.category);
    if (!cat) {
      const result = insertCategory.run(group.category, sortOrder);
      cat = { id: result.lastInsertRowid };
      console.log(`Kategori olusturuldu: ${group.category}`);
    }
    sortOrder += 1;

    for (const item of group.items) {
      const existing = countProducts.get(cat.id, item.name);
      if (existing.c === 0) {
        insertProduct.run(cat.id, item.name, item.price);
        console.log(`  Urun eklendi: ${item.name} (${item.price} TL)`);
      }
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

seedUsers();
seedCategoriesAndProducts();
seedTables();

console.log('Seed tamamlandi.');
db.close();
