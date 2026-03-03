// Florist One API integration
// Docs: https://www.floristone.com/api/how-it-works/
// TODO: Replace mock data with real API calls once we have the API key

export interface FlowerProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
}

export interface DeliveryDate {
  date: string;
  label: string;
  available: boolean;
}

// TODO: Replace with real Florist One API call
export async function getProducts(apiKey?: string): Promise<FlowerProduct[]> {
  // Mock data for development
  return [
    {
      id: 'roses-dozen-red',
      name: 'Classic Dozen Red Roses',
      price: 59.99,
      description: 'A timeless arrangement of 12 premium long-stem red roses with baby\'s breath and greenery.',
      image: 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400',
      category: 'Roses',
    },
    {
      id: 'mixed-spring',
      name: 'Spring Garden Mix',
      price: 44.99,
      description: 'A vibrant mix of seasonal spring flowers including tulips, daisies, and lilies.',
      image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400',
      category: 'Mixed',
    },
    {
      id: 'sunflower-bouquet',
      name: 'Sunshine Sunflowers',
      price: 39.99,
      description: 'Bright and cheerful sunflower bouquet that brings warmth to any room.',
      image: 'https://images.unsplash.com/photo-1551927336-09d50efd69cd?w=400',
      category: 'Sunflowers',
    },
    {
      id: 'orchid-elegant',
      name: 'Elegant Orchid Plant',
      price: 64.99,
      description: 'A stunning potted orchid plant that lasts for weeks.',
      image: 'https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=400',
      category: 'Plants',
    },
    {
      id: 'peony-blush',
      name: 'Blush Peony Bouquet',
      price: 54.99,
      description: 'Soft pink peonies arranged with eucalyptus and ribbon.',
      image: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
      category: 'Peonies',
    },
    {
      id: 'wildflower-meadow',
      name: 'Wildflower Meadow',
      price: 34.99,
      description: 'A rustic arrangement of hand-picked wildflowers.',
      image: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=400',
      category: 'Mixed',
    },
    {
      id: 'lily-white',
      name: 'Pure White Lilies',
      price: 49.99,
      description: 'Elegant white lilies symbolizing devotion and purity.',
      image: 'https://images.unsplash.com/photo-1533616688419-b7a585564566?w=400',
      category: 'Lilies',
    },
    {
      id: 'succulent-garden',
      name: 'Succulent Garden Box',
      price: 42.99,
      description: 'A curated box of assorted succulents in a wooden planter.',
      image: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
      category: 'Plants',
    },
  ];
}

// TODO: Replace with real Florist One API call
export async function getDeliveryDates(apiKey?: string): Promise<DeliveryDate[]> {
  const dates: DeliveryDate[] = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const day = d.getDay();
    dates.push({
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      available: day !== 0, // closed Sundays
    });
  }
  return dates;
}

// TODO: Replace with real Florist One PlaceOrder API call
export async function placeOrder(
  apiKey: string,
  order: {
    productId: string;
    recipientName: string;
    recipientAddress: any;
    deliveryDate: string;
    cardMessage: string;
    paymentToken: string;
    senderName: string;
    senderEmail: string;
  }
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  // Mock: simulate successful order
  return {
    success: true,
    orderId: `FO-${Date.now().toString(36).toUpperCase()}`,
  };
}
