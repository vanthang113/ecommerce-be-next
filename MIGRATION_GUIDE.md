# Migration Guide - Fix Images Column

## Vấn đề
Lỗi `Invalid JSON text` xảy ra khi MySQL không thể parse dữ liệu JSON trong cột `images`.

## Giải pháp
Thay đổi cột `images` từ type `JSON` sang `TEXT` và lưu trữ dưới dạng JSON string.

## Cách thực hiện

### 1. Chạy Migration Script
```bash
cd back-end
node src/migrate.js
```

### 2. Hoặc chạy SQL trực tiếp
```sql
USE ecommerce_db;
ALTER TABLE products MODIFY COLUMN images TEXT;
```

### 3. Kiểm tra kết quả
```sql
SELECT id, name, images FROM products LIMIT 5;
```

## Lưu ý
- Script sẽ tự động convert dữ liệu cũ sang format JSON string
- Nếu có lỗi, có thể restore từ `products_backup` table
- Sau khi migration, restart backend server

## Test
1. Thêm sản phẩm mới với ảnh
2. Kiểm tra admin panel
3. Kiểm tra trang chủ hiển thị ảnh


