/**
 * LA'VIEN Cafe & Restaurant - Tam menu seed script.
 * Idempotent: tekrar calistirilirsa mevcut aktif kategori/urunleri
 * pasif hale getirip menuyu yeniden ekler (isim eslesirse tekrar eklemez).
 *
 * Calistirma: node src/db/seedMenu.js
 */
const db = require('./connection');

const YEMEK_KATEGORILERI = [
  {
    name: 'Kahvaltı',
    allowModifiers: 1,
    items: [
      { name: 'Serpme Kahvaltı (Kişi Başı)', price: 450 },
      { name: 'Kahvaltı Tabağı', price: 400 },
      { name: 'Menemen', price: 150 },
      { name: 'Kaşarlı Tost', price: 200 },
      { name: 'Karışık Tost', price: 220 },
    ],
  },
  {
    name: 'Aperatifler',
    allowModifiers: 1,
    items: [
      { name: 'Patates Kızartması', price: 170 },
      { name: 'Kajun Baharatlı Tavuk', price: 280 },
      { name: 'Patates Sosis Kasa', price: 200 },
      { name: 'Öğrenci Menü', price: 200 },
      { name: 'Patso', price: 110 },
      { name: 'Sosisli Patso', price: 130 },
    ],
  },
  {
    name: 'Pideler',
    allowModifiers: 1,
    items: [
      { name: 'Lahmacun', price: 150 },
      { name: 'Kıymalı Pide', price: 230 },
      { name: 'Kaşarlı Pide', price: 300 },
      { name: 'Kaşarlı Sucuklu Pide', price: 320 },
      { name: 'Kuşbaşılı Pide', price: 300 },
      { name: 'Karışık Pide', price: 330 },
    ],
  },
  {
    name: 'Izgaralar',
    allowModifiers: 1,
    items: [
      { name: 'Dana Biftek', price: 450 },
      { name: 'Izgara Tavuk', price: 300 },
      { name: 'Izgara Köfte', price: 350 },
      { name: 'Karışık Izgara', price: 500 },
      { name: 'Dana Antrikot', price: 600 },
    ],
  },
  {
    name: 'Dürümler',
    allowModifiers: 1,
    items: [
      { name: 'Dana Biftek Dürüm', price: 380 },
      { name: 'Izgara Tavuk Dürüm', price: 250 },
      { name: 'Izgara Köfte Dürüm', price: 280 },
      { name: 'Hatay Usulü Tavuk Dürüm', price: 200 },
    ],
  },
  {
    name: 'Pizzalar',
    allowModifiers: 1,
    items: [
      { name: 'Sucuklu Pizza', price: 280 },
      { name: 'Mantarlı Pizza', price: 280 },
      { name: 'Ton Balıklı Pizza', price: 320 },
      { name: 'Vejetaryen Pizza', price: 280 },
      { name: 'Karışık Pizza', price: 300 },
      { name: 'Küçük Pizza', price: 250 },
    ],
  },
  {
    name: 'Burgerler',
    allowModifiers: 1,
    items: [
      { name: 'Hamburger', price: 230 },
      { name: 'Cheeseburger', price: 280 },
      { name: 'Çift Cheddar Burger', price: 350 },
      { name: 'Tavuk Burger', price: 200 },
      { name: 'Kajun Burger', price: 270 },
      { name: 'Çift Köfteli Burger', price: 450 },
    ],
  },
  {
    name: 'Salatalar',
    allowModifiers: 1,
    items: [
      { name: 'Tavuklu Salata', price: 350 },
      { name: 'Dana Biftek Salata', price: 450 },
      { name: 'Köfteli Salata', price: 350 },
      { name: 'Ton Balıklı Salata', price: 400 },
    ],
  },
  {
    name: 'Kiremitler',
    allowModifiers: 1,
    items: [
      { name: 'Kiremitte Tavuk', price: 350 },
      { name: 'Kiremitte Et', price: 500 },
      { name: 'Kiremitte Köfte', price: 400 },
      { name: 'Sac Kavurma', price: 400 },
      { name: 'Tavuk Sac Kavurma', price: 350 },
    ],
  },
  {
    name: 'Tatlılar',
    allowModifiers: 1,
    items: [{ name: 'Künefe', price: 200 }],
  },
];

const ICECEK_KATEGORILERI = [
  {
    name: 'Meşrubatlar',
    allowModifiers: 0,
    items: [
      { name: 'Coca Cola', price: 60 },
      { name: 'Sprite', price: 60 },
      { name: 'Fuse Tea', price: 60 },
      { name: 'Cappy Meyve Suyu', price: 60 },
      { name: 'Küçük Ayran', price: 20 },
      { name: 'Büyük Ayran', price: 35 },
      { name: 'Maden Suyu', price: 30 },
      { name: 'Niğde Gazozu', price: 50 },
      { name: 'Su', price: 15 },
      { name: 'Coca Cola 1 Lt', price: 90 },
      { name: 'Coca Cola 2.5 Lt', price: 120 },
    ],
  },
  {
    name: 'Sıcak İçecekler',
    allowModifiers: 0,
    items: [
      { name: 'Çay', price: 20 },
      { name: 'Kupa Çay', price: 35 },
      { name: 'Termos Çay', price: 250 },
      { name: 'Nescafe', price: 50 },
      { name: 'Türk Kahvesi', price: 80 },
      { name: 'Dibek Kahvesi', price: 90 },
      { name: 'Menengiç Kahvesi', price: 90 },
      { name: 'Americano', price: 100 },
      { name: 'Latte', price: 120 },
      { name: 'Vanilla Latte', price: 130 },
      { name: 'White Chocolate Mocha', price: 135 },
      { name: 'Caramel Macchiato', price: 135 },
      { name: 'Pumpkin Spice Latte', price: 135 },
      { name: 'Cappuccino', price: 120 },
      { name: 'Filtre Kahve', price: 110 },
      { name: 'Oralet', price: 30 },
    ],
  },
  {
    name: 'Milkshake',
    allowModifiers: 0,
    items: [
      { name: 'Vanilyalı Milkshake', price: 120 },
      { name: 'Çikolatalı Milkshake', price: 120 },
      { name: 'Çilekli Milkshake', price: 120 },
      { name: 'Beyaz Çikolatalı Milkshake', price: 120 },
      { name: 'Orman Meyveli Milkshake', price: 120 },
      { name: 'Hindistan Cevizli Milkshake', price: 120 },
    ],
  },
  {
    name: 'Soğuk Kahveler',
    allowModifiers: 0,
    items: [
      { name: 'Ice Americano', price: 110 },
      { name: 'Ice Latte', price: 130 },
      { name: 'Ice Mocha', price: 150 },
      { name: 'Ice White Mocha', price: 150 },
      { name: 'Ice Caramel Macchiato', price: 150 },
      { name: 'Ice Vanilla Latte', price: 150 },
      { name: 'Ice Coconut Latte', price: 150 },
      { name: 'Ice Hazelnut Latte', price: 150 },
      { name: 'Ice Strawberry Latte', price: 150 },
    ],
  },
  {
    name: 'Yaz İçecekleri',
    allowModifiers: 0,
    items: [
      { name: 'Limonata', price: 90 },
      { name: 'Çilekli Limonata', price: 100 },
      { name: 'Naneli Limonata', price: 120 },
      { name: 'Churchill', price: 75 },
      { name: 'Soda Limon', price: 50 },
      { name: 'Soda Ayran', price: 80 },
      { name: 'Naneli Ayran', price: 90 },
      { name: 'Fesleğenli Ayran', price: 120 },
    ],
  },
  {
    name: 'Frozen',
    allowModifiers: 0,
    items: [
      { name: 'Limon Frozen', price: 120 },
      { name: 'Böğürtlen Frozen', price: 120 },
      { name: 'Çilek Frozen', price: 120 },
      { name: 'Elma Frozen', price: 120 },
      { name: 'Karadut Frozen', price: 150 },
      { name: 'Şeftali Frozen', price: 120 },
      { name: 'Çarkıfelek Frozen', price: 140 },
      { name: 'Orman Meyveli Frozen', price: 140 },
      { name: 'Mango Frozen', price: 150 },
      { name: "La' Vien Special Frozen", price: 170 },
    ],
  },
  {
    name: "La' Vien Specials",
    allowModifiers: 0,
    items: [
      { name: 'Ocean Lemonade', price: 130 },
      { name: 'Choco Coco', price: 110 },
      { name: 'Cosmos', price: 120 },
      { name: 'Barbie', price: 120 },
      { name: 'Sonic', price: 130 },
      { name: 'Sour Party', price: 130 },
      { name: "Rock N' Roll", price: 150 },
      { name: 'Tiffany', price: 150 },
      { name: 'Amazon', price: 150 },
    ],
  },
];

const MENU = [...YEMEK_KATEGORILERI, ...ICECEK_KATEGORILERI];

function deactivateExistingMenu() {
  const activeCats = db.prepare('SELECT id FROM categories WHERE is_active = 1').all();
  const deactivateCat = db.prepare('UPDATE categories SET is_active = 0 WHERE id = ?');
  const deactivateProducts = db.prepare('UPDATE products SET is_active = 0 WHERE category_id = ?');
  for (const cat of activeCats) {
    deactivateProducts.run(cat.id);
    deactivateCat.run(cat.id);
  }
  console.log(`Mevcut ${activeCats.length} aktif kategori (ve urunleri) pasif hale getirildi.`);
}

function seedFullMenu() {
  const findCategoryByName = db.prepare('SELECT id FROM categories WHERE name = ?');
  const insertCategory = db.prepare(
    'INSERT INTO categories (name, sort_order, is_active, allow_modifiers) VALUES (?, ?, 1, ?)'
  );
  const reactivateCategory = db.prepare(
    'UPDATE categories SET is_active = 1, sort_order = ?, allow_modifiers = ? WHERE id = ?'
  );
  const findProduct = db.prepare('SELECT id FROM products WHERE category_id = ? AND name = ?');
  const insertProduct = db.prepare(
    'INSERT INTO products (category_id, name, price, is_active) VALUES (?, ?, ?, 1)'
  );
  const reactivateProduct = db.prepare('UPDATE products SET price = ?, is_active = 1 WHERE id = ?');

  let sortOrder = 0;
  for (const group of MENU) {
    let cat = findCategoryByName.get(group.name);
    if (cat) {
      reactivateCategory.run(sortOrder, group.allowModifiers, cat.id);
      console.log(`Kategori guncellendi/yeniden aktif edildi: ${group.name}`);
    } else {
      const result = insertCategory.run(group.name, sortOrder, group.allowModifiers);
      cat = { id: result.lastInsertRowid };
      console.log(`Kategori oluşturuldu: ${group.name}`);
    }
    sortOrder += 1;

    for (const item of group.items) {
      const existingProduct = findProduct.get(cat.id, item.name);
      if (existingProduct) {
        reactivateProduct.run(item.price, existingProduct.id);
      } else {
        insertProduct.run(cat.id, item.name, item.price);
        console.log(`  Ürün eklendi: ${item.name} (${item.price} TL)`);
      }
    }
  }
}

const runSeed = db.transaction(() => {
  deactivateExistingMenu();
  seedFullMenu();
});

runSeed();

console.log('Menu seed tamamlandi.');
db.close();
