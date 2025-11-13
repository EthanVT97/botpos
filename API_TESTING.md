# API Testing Guide

This guide provides examples for testing all API endpoints using curl or Postman.

## Base URL
```
http://localhost:3001/api
```

## Health Check

```bash
curl http://localhost:3001/health
```

## Products API

### Get All Products
```bash
curl http://localhost:3001/api/products
```

### Get Product by ID
```bash
curl http://localhost:3001/api/products/{product_id}
```

### Create Product
```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "name_mm": "စမ်းသပ်ကုန်ပစ္စည်း",
    "price": 10000,
    "cost": 7000,
    "stock_quantity": 100,
    "sku": "TEST-001"
  }'
```

### Update Product
```bash
curl -X PUT http://localhost:3001/api/products/{product_id} \
  -H "Content-Type: application/json" \
  -d '{
    "price": 12000,
    "stock_quantity": 150
  }'
```

### Delete Product
```bash
curl -X DELETE http://localhost:3001/api/products/{product_id}
```

### Search Products
```bash
curl http://localhost:3001/api/products/search/phone
```

## Categories API

### Get All Categories
```bash
curl http://localhost:3001/api/categories
```

### Create Category
```bash
curl -X POST http://localhost:3001/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "name_mm": "အီလက်ထရောနစ်",
    "description": "Electronic devices"
  }'
```

### Update Category
```bash
curl -X PUT http://localhost:3001/api/categories/{category_id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Electronics"
  }'
```

### Delete Category
```bash
curl -X DELETE http://localhost:3001/api/categories/{category_id}
```

## Customers API

### Get All Customers
```bash
curl http://localhost:3001/api/customers
```

### Get Customer by ID
```bash
curl http://localhost:3001/api/customers/{customer_id}
```

### Create Customer
```bash
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aung Aung",
    "phone": "+95 9 123 456 789",
    "email": "aung@example.com",
    "address": "Yangon, Myanmar"
  }'
```

### Update Customer
```bash
curl -X PUT http://localhost:3001/api/customers/{customer_id} \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+95 9 987 654 321"
  }'
```

### Delete Customer
```bash
curl -X DELETE http://localhost:3001/api/customers/{customer_id}
```

### Search Customers
```bash
curl http://localhost:3001/api/customers/search/aung
```

## Orders API

### Get All Orders
```bash
curl http://localhost:3001/api/orders
```

### Get Order by ID
```bash
curl http://localhost:3001/api/orders/{order_id}
```

### Create Order
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": null,
    "items": [
      {
        "product_id": "product_uuid_here",
        "quantity": 2,
        "price": 10000
      }
    ],
    "total_amount": 20000,
    "discount": 0,
    "tax": 0,
    "payment_method": "cash",
    "source": "pos"
  }'
```

### Update Order Status
```bash
curl -X PATCH http://localhost:3001/api/orders/{order_id}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

### Delete Order
```bash
curl -X DELETE http://localhost:3001/api/orders/{order_id}
```

## Inventory API

### Get Inventory Movements
```bash
curl http://localhost:3001/api/inventory/movements
```

### Add Inventory Movement
```bash
curl -X POST http://localhost:3001/api/inventory/movements \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "product_uuid_here",
    "quantity": 50,
    "type": "in",
    "notes": "New stock arrival"
  }'
```

### Get Low Stock Products
```bash
curl http://localhost:3001/api/inventory/low-stock

# With custom threshold
curl http://localhost:3001/api/inventory/low-stock?threshold=20
```

## Sales API

### Get Sales Summary
```bash
curl http://localhost:3001/api/sales/summary

# With date range
curl "http://localhost:3001/api/sales/summary?start_date=2024-01-01&end_date=2024-12-31"
```

### Get Top Products
```bash
curl http://localhost:3001/api/sales/top-products

# With limit
curl "http://localhost:3001/api/sales/top-products?limit=5"
```

## Reports API

### Daily Sales Report
```bash
curl "http://localhost:3001/api/reports/daily-sales?date=2024-11-13"
```

### Monthly Sales Report
```bash
curl "http://localhost:3001/api/reports/monthly-sales?month=2024-11"
```

### Product Performance Report
```bash
curl http://localhost:3001/api/reports/product-performance
```

## Settings API

### Get All Settings
```bash
curl http://localhost:3001/api/settings
```

### Update Setting
```bash
curl -X PUT http://localhost:3001/api/settings/store_name \
  -H "Content-Type: application/json" \
  -d '{
    "value": "My Store"
  }'
```

## Users API

### Get All Users
```bash
curl http://localhost:3001/api/users
```

### Create User
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "staff"
  }'
```

### Update User
```bash
curl -X PUT http://localhost:3001/api/users/{user_id} \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

### Delete User
```bash
curl -X DELETE http://localhost:3001/api/users/{user_id}
```

## Bot Webhooks

### Test Viber Webhook
```bash
curl -X POST http://localhost:3001/webhooks/viber \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test Telegram Webhook
```bash
curl -X POST http://localhost:3001/webhooks/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "chat": {"id": 123456},
      "from": {"id": 123456, "first_name": "Test"},
      "text": "/products"
    }
  }'
```

### Test Messenger Webhook (Verification)
```bash
curl "http://localhost:3001/webhooks/messenger?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=test_challenge"
```

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "Myanmar POS API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Products",
      "item": [
        {
          "name": "Get All Products",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/products"
          }
        },
        {
          "name": "Create Product",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/products",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Test Product\",\n  \"price\": 10000\n}"
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3001/api"
    }
  ]
}
```

## Testing Tips

1. **Use jq for JSON formatting**:
```bash
curl http://localhost:3001/api/products | jq
```

2. **Save response to file**:
```bash
curl http://localhost:3001/api/products > products.json
```

3. **Include headers in response**:
```bash
curl -i http://localhost:3001/api/products
```

4. **Verbose output for debugging**:
```bash
curl -v http://localhost:3001/api/products
```

5. **Test with authentication** (when implemented):
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/products
```

## Expected Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Server Error
- `503` - Service Unavailable
