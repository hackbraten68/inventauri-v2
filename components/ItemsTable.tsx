'use client';

import { useEffect, useMemo, useState, ChangeEvent } from 'react';
import {
  Plus,
  RefreshCw,
  Search,
  PackageSearch,
  AlertTriangle,
  Euro,
  Package2,
  MoreHorizontal,
  Filter,
  ChevronDown,
} from 'lucide-react';

import { money } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

import StockAdjust from './StockAdjust';

type Item = {
  id: string;
  name: string;
  sku?: string | null;
  priceCents: number;
  unit?: string | null;
  category?: string;
  stock?: number;
  status?: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated?: string;
};

type FormData = {
  name: string;
  sku: string;
  priceCents: number;
  category: string;
};

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'home', label: 'Home & Living' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'sports', label: 'Sports & Outdoors' },
];

export default function ItemsTable() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormData>({ 
    name: '', 
    sku: '', 
    priceCents: 0, 
    category: 'uncategorized' 
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortKey, setSortKey] = useState<keyof Item>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Fetch items from API
  const refresh = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/items');
      const data = await res.json();
      // Add mock data for demo
      const mockItems = data.map((item: Item) => ({
        ...item,
        category: item.category || categories[Math.floor(Math.random() * (categories.length - 1)) + 1].value,
        stock: item.stock || Math.floor(Math.random() * 100),
        status: item.status || (Math.random() > 0.7 ? 'low-stock' : Math.random() > 0.9 ? 'out-of-stock' : 'in-stock'),
        lastUpdated: new Date().toISOString(),
      }));
      setItems(mockItems);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'priceCents' ? parseFloat(value) || 0 : value,
    }));
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm({ name: '', sku: '', priceCents: 0, category: 'uncategorized' });
      setIsAddingItem(false);
      await refresh();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  // Calculate inventory value
  const inventoryValue = useMemo(
    () => items.reduce((total, item) => total + (item.priceCents || 0) * (item.stock || 0) / 100, 0), 
    [items]
  );

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items];
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) || 
        (item.sku && item.sku.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(item => item.category === selectedCategory);
    }
    
    // Apply status filter
    if (selectedStatus !== 'all') {
      result = result.filter(item => item.status === selectedStatus);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[sortKey] || '';
      let bValue = b[sortKey] || '';
      
      if (typeof aValue === 'string') aValue = aValue.toString().toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toString().toLowerCase();
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [items, searchQuery, selectedCategory, selectedStatus, sortKey, sortOrder]);

  // Toggle sort order
  const handleSort = (key: keyof Item) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Get sort indicator
  const getSortIndicator = (key: keyof Item) => {
    if (sortKey !== key) return null;
    return (
      <span className="ml-1">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      'in-stock': { label: 'In Stock', className: 'bg-green-100 text-green-800' },
      'low-stock': { label: 'Low Stock', className: 'bg-yellow-100 text-yellow-800' },
      'out-of-stock': { label: 'Out of Stock', className: 'bg-red-100 text-red-800' },
    }[status] || { label: 'Unknown', className: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}>
        {statusConfig.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your products and track inventory levels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refresh()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsAddingItem(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <span className="text-muted-foreground">Category: </span>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <span className="text-muted-foreground">Status: </span>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  View
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Product Name</DropdownMenuItem>
                <DropdownMenuItem>SKU</DropdownMenuItem>
                <DropdownMenuItem>Price</DropdownMenuItem>
                <DropdownMenuItem>Stock</DropdownMenuItem>
                <DropdownMenuItem>Status</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Products
              </CardTitle>
              <Package2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{items.length}</div>
              <p className="text-xs text-muted-foreground">
                {filteredItems.length} matching current filters
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Inventory Value
              </CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{money(inventoryValue)}</div>
              <p className="text-xs text-muted-foreground">
                Across all products
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Low Stock Items
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {items.filter(item => item.status === 'low-stock').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Needs attention
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Out of Stock
              </CardTitle>
              <PackageSearch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {items.filter(item => item.status === 'out-of-stock').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Needs restocking
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Product Dialog */}
      {isAddingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Product</CardTitle>
              <CardDescription>
                Fill in the details below to add a new product to your inventory.
              </CardDescription>
            </CardHeader>
            <form onSubmit={addItem}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter product name"
                    value={form.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      name="sku"
                      placeholder="Enter SKU"
                      value={form.sku}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceCents">Price (€)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        €
                      </span>
                      <Input
                        id="priceCents"
                        name="priceCents"
                        type="number"
                        min="0"
                        step="0.01"
                        className="pl-8"
                        value={form.priceCents || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    name="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.category}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a category</option>
                    {categories.slice(1).map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingItem(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="rounded-md border">
        <ScrollArea className="h-[calc(100vh-28rem)]">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead 
                  className="w-[300px] cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Product {getSortIndicator('name')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleSort('sku')}
                >
                  <div className="flex items-center">
                    SKU {getSortIndicator('sku')}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-right cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleSort('priceCents')}
                >
                  <div className="flex items-center justify-end">
                    Price {getSortIndicator('priceCents')}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-right cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleSort('stock')}
                >
                  <div className="flex items-center justify-end">
                    Stock {getSortIndicator('stock')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status {getSortIndicator('status')}
                  </div>
                </TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeleton Loader
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length > 0 ? (
                // Actual Data Rows
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                          <PackageSearch className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.category}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.sku ? (
                        <Badge variant="outline" className="font-mono">
                          {item.sku}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {money(item.priceCents / 100)}
                    </TableCell>
                    <TableCell className="text-right">
                      <StockAdjust 
                        itemId={item.id}
                        currentStock={item.stock || 0}
                        onChanged={refresh}
                        className="justify-end"
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status || 'in-stock'} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                // Empty State
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 py-8">
                      <PackageSearch className="h-10 w-10 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No products found. Try adjusting your filters or add a new product.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                          setSelectedStatus('all');
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">1</span> to{' '}
          <span className="font-medium">{filteredItems.length}</span> of{' '}
          <span className="font-medium">{filteredItems.length}</span> results
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
