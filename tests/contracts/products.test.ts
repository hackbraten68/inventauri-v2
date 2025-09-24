import { describe, it, expect, beforeAll } from 'vitest';
import { baseUrl, getJson } from '../util';
import { getAccessToken } from '../auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Products API', () => {
  let authHeaders: Record<string, string>;
  let shopId: string;

  beforeAll(async () => {
    // Get auth token and create headers
    const { token, userId } = await getAccessToken();
    authHeaders = { 'Authorization': `Bearer ${token}` };
    
    // Get the demo shop
    let shop = await prisma.shop.findFirst({ where: { slug: 'demo-shop' } });
    if (!shop) {
      shop = await prisma.shop.create({
        data: {
          name: 'Demo Shop',
          slug: 'demo-shop',
        }
      });
    }
    shopId = shop.id;
    
    // Ensure user has access to the shop
    const userShop = await prisma.userShop.findFirst({
      where: { userId, shopId }
    });
    
    if (!userShop) {
      await prisma.userShop.create({
        data: {
          userId,
          shopId,
          role: 'owner'
        }
      });
    }
    
    // Ensure we have at least one warehouse for testing
    const warehouse = await prisma.warehouse.findFirst();
    
    if (!warehouse) {
      await prisma.warehouse.create({
        data: {
          name: 'Main Warehouse',
          slug: 'main-warehouse',
          type: 'central'
        }
      });
    }
  });

  it('GET /api/products returns tenant-scoped products with variants', async () => {
    // Get the first warehouse
    const warehouse = await prisma.warehouse.findFirst();
    if (!warehouse) {
      throw new Error('No warehouse found for testing');
    }

    // Create a test product with variants
    const baseUrlValue = baseUrl();
    const uniqueId = Math.random().toString(36).substring(2, 8);
    const testSku = `TEST-PROD-${uniqueId}`;
    const testProductName = `Test Product ${uniqueId}`;
    
    const productData = {
      sku: testSku,
      name: testProductName,
      description: 'Test product with variants',
      unit: 'pcs',
      initialStock: 10,
      warehouseId: warehouse.id,
      shopId
    };
    
    console.log('Creating product with data:', JSON.stringify(productData, null, 2));
    
    const productRes = await fetch(`${baseUrlValue}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(productData)
    });
    
    const responseBody = await productRes.text();
    console.log('Response status:', productRes.status);
    console.log('Response body:', responseBody);
    
    expect(productRes.status).toBe(201);

    // Get products
    const productsRes = await fetch(`${baseUrlValue}/api/products`, {
      headers: { ...authHeaders }
    });
    
    // Verify response structure
    expect(productsRes.status).toBe(200);
    const response = await productsRes.json();
    console.log('Products API response:', JSON.stringify(response, null, 2));
    
    // The API returns an object with a data property containing the array
    expect(response).toHaveProperty('data');
    const products = response.data;
    expect(Array.isArray(products)).toBe(true);
    
    // Find our test product by its exact name
    const testProduct = products.find((p: any) => p.name === testProductName);
    expect(testProduct).toBeDefined();
    expect(testProduct).toMatchObject({
      id: expect.any(String),
      name: testProductName,
      description: 'Test product with variants',
      isActive: true,
      shopId
    });
    
    // Verify variants
    expect(Array.isArray(testProduct.variants)).toBe(true);
    expect(testProduct.variants.length).toBeGreaterThan(0);
    const variant = testProduct.variants[0];
    expect(variant).toMatchObject({
      id: expect.any(String),
      sku: expect.stringMatching(/^TEST-PROD-[a-z0-9]+$/),
      unit: 'pcs',
      isActive: true
    });
  });

  // Cleanup is handled by test DB reset
});
