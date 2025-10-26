const mysql = require('mysql2/promise');

async function fixImagesColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ecommerce_db'
    });

    console.log('Connected to database');

    // Change images column from JSON to TEXT
    await connection.execute('ALTER TABLE products MODIFY COLUMN images TEXT');
    console.log('Successfully changed images column to TEXT');

    // Update existing data to be valid JSON strings
    const [products] = await connection.execute('SELECT id, images FROM products WHERE images IS NOT NULL');
    
    for (const product of products) {
      if (product.images && product.images !== '[]') {
        try {
          // If it's already valid JSON, keep it
          JSON.parse(product.images);
        } catch (e) {
          // If it's not valid JSON, convert to array format
          const imagesArray = product.images.split(',').map(img => img.trim()).filter(img => img);
          await connection.execute(
            'UPDATE products SET images = ? WHERE id = ?',
            [JSON.stringify(imagesArray), product.id]
          );
          console.log(`Updated product ${product.id} images`);
        }
      }
    }

    console.log('Migration completed successfully');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixImagesColumn();


