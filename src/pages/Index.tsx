import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import funcUrls from '../../backend/func2url.json';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface Order {
  id: number;
  items: CartItem[];
  total: number;
  status: string;
  created_at: string;
}

const Index = () => {
  const [view, setView] = useState<'customer' | 'waiter'>('customer');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPlate, setSelectedPlate] = useState<MenuItem | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const menuItems: MenuItem[] = [
    { id: 1, name: 'Борщ классический', description: 'Традиционный украинский борщ со сметаной', price: 350, category: 'Супы' },
    { id: 2, name: 'Цезарь с курицей', description: 'Свежий салат с курицей гриль, пармезаном и сухариками', price: 450, category: 'Салаты' },
    { id: 3, name: 'Стейк Рибай', description: 'Сочный стейк из мраморной говядины 250г', price: 1200, category: 'Горячее' },
    { id: 4, name: 'Паста Карбонара', description: 'Классическая итальянская паста с беконом', price: 550, category: 'Паста' },
  ];

  const addToCart = (item: MenuItem) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast({
      title: "Добавлено в корзину",
      description: item.name,
    });
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const fetchOrders = async () => {
    try {
      const response = await fetch(funcUrls.orders);
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    if (view === 'waiter') {
      fetchOrders();
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [view]);

  const placeOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch(funcUrls.orders, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          total: totalPrice
        })
      });
      
      if (response.ok) {
        toast({
          title: "Заказ оформлен!",
          description: `Сумма: ${totalPrice} ₽`,
        });
        setCart([]);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось оформить заказ",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (view === 'waiter') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Панель официанта</h1>
            <Button variant="outline" onClick={() => setView('customer')}>
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              К меню
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Текущие заказы</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">№</th>
                    <th className="text-left py-3 px-4">Время</th>
                    <th className="text-left py-3 px-4">Блюда</th>
                    <th className="text-left py-3 px-4">Сумма</th>
                    <th className="text-left py-3 px-4">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr className="border-b">
                      <td className="py-3 px-4 text-muted-foreground" colSpan={5}>Пока нет заказов</td>
                    </tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">#{order.id}</td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(order.created_at).toLocaleString('ru-RU')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="text-sm">
                                {item.name} x{item.quantity}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold">{order.total} ₽</td>
                        <td className="py-3 px-4">
                          <Badge variant={order.status === 'новый' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">🍽️ Столовка</h1>
            <p className="text-sm text-muted-foreground">Вкусно и быстро</p>
          </div>
          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button className="relative">
                  <Icon name="ShoppingCart" className="mr-2 h-5 w-5" />
                  Корзина
                  {cart.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0">
                      {cart.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle>Корзина</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Корзина пуста</p>
                  ) : (
                    <>
                      {cart.map(item => (
                        <Card key={item.id} className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">{item.price} ₽</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Icon name="X" className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Icon name="Minus" className="h-4 w-4" />
                            </Button>
                            <span className="font-medium w-8 text-center">{item.quantity}</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Icon name="Plus" className="h-4 w-4" />
                            </Button>
                            <span className="ml-auto font-semibold">{item.price * item.quantity} ₽</span>
                          </div>
                        </Card>
                      ))}
                      <div className="border-t pt-4 space-y-4">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Итого:</span>
                          <span>{totalPrice} ₽</span>
                        </div>
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={placeOrder}
                          disabled={loading}
                        >
                          {loading ? 'Оформление...' : 'Заказать'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <Button variant="outline" onClick={() => setView('waiter')}>
              <Icon name="User" className="mr-2 h-4 w-4" />
              Официант
            </Button>
          </div>
        </div>
      </header>

      <section className="relative bg-gradient-to-br from-primary/10 via-secondary/20 to-background py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-4">Добро пожаловать!</h2>
          <p className="text-xl text-muted-foreground mb-8">Закажите любимые блюда прямо сейчас</p>
          <Button size="lg" className="text-lg px-8" onClick={() => {
            document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            <Icon name="UtensilsCrossed" className="mr-2 h-5 w-5" />
            Смотреть меню
          </Button>
        </div>
      </section>

      <section id="menu" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Наше меню</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {menuItems.map(item => (
              <div
                key={item.id}
                className="relative group cursor-pointer"
                onClick={() => setSelectedPlate(selectedPlate?.id === item.id ? null : item)}
              >
                <div className="plate-hover">
                  <div className="relative w-48 h-48 mx-auto bg-gradient-to-br from-white to-gray-100 rounded-full shadow-lg flex items-center justify-center border-8 border-gray-200 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10"></div>
                    <div className="text-center z-10 p-6">
                      <div className="text-6xl mb-2">
                        {item.category === 'Супы' && '🍲'}
                        {item.category === 'Салаты' && '🥗'}
                        {item.category === 'Горячее' && '🥩'}
                        {item.category === 'Паста' && '🍝'}
                      </div>
                      {selectedPlate?.id === item.id && (
                        <div className="animate-fade-in">
                          <h3 className="font-bold text-sm leading-tight">{item.name}</h3>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {selectedPlate?.id === item.id && (
                  <Card className="mt-4 p-4 animate-scale-in">
                    <Badge className="mb-2">{item.category}</Badge>
                    <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">{item.price} ₽</span>
                      <Button onClick={(e) => {
                        e.stopPropagation();
                        addToCart(item);
                      }}>
                        <Icon name="Plus" className="mr-2 h-4 w-4" />
                        В корзину
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 Столовка. Приятного аппетита!</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;