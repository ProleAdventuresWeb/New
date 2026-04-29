export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in pence (e.g., 1000 = £10.00)
  image: string;
  images?: string[];
  category: string;
  sku?: string;
  variants?: string[];
  stripeLink?: string;
  status?: 'Active' | 'Draft';
}

export const products: Product[] = [
  {
    id: 'prole-hoodie-trespass-001',
    name: 'Prole "Trespassing" Hoodie',
    sku: 'PRINTFUL-HOODIE-TRESPASS',
    description: 'When you absolutely must go trespassing, you need all the stealth you can get. Heavyweight, comfortable, and optimized for low-light environments.',
    price: 3800, // £38.00
    variants: ['Black / S', 'Black / M', 'Black / L', 'Black / XL', 'Black / XXL'],
    category: 'Apparel',
    stripeLink: '', 
    status: 'Active',
    image: '/images/products/prole_unisex_trespass_hoodie_binbag_1.webp',
    images: [
      '/images/products/prole_unisex_trespass_hoodie_binbag_1.webp',
      '/images/products/prole_unisex_trespass_hoodie_binbag_2.webp',
      '/images/products/prole_unisex_trespass_hoodie_binbag_3.webp'
    ]
  },
  {
    id: 'prole-hoodie-binbag-001',
    name: 'Prole Adventures "Aggro" Hoodie',
    sku: 'PRINTFUL-HOODIE-BINBAG',
    description: 'High-performance urban stealth hoodie. Engineered for the modern Prole, featuring a heavyweight black cotton blend designed for durability and comfort in the field.',
    price: 3800, // £38.00
    variants: ['Black / S', 'Black / M', 'Black / L', 'Black / XL', 'Black / XXL'],
    category: 'Apparel',
    stripeLink: '', 
    status: 'Active',
    image: '/images/products/prole_hoodie_binbag_1.webp',
    images: [
      '/images/products/prole_hoodie_binbag_1.webp',
      '/images/products/prole_hoodie_binbag_2.webp',
      '/images/products/prole_hoodie_binbag_3.webp',
      '/images/products/prole_hoodie_binbag_4.webp'
    ]
  },
  {
    id: 'prole-tee-binbag-001',
    name: 'Prole Adventures "Binbag" Tee',
    sku: 'PRINTFUL-TEE-BINBAG',
    description: 'The "Binbag" Tee is designed to ensure you\'re seen by the right people . Featuring the black on black "binbag" aesthetic in a high-quality, heavy-weight black cotton construction.',
    price: 2500, // £25.00
    variants: ['Black / S', 'Black / M', 'Black / L', 'Black / XL', 'Black / XXL'],
    category: 'Apparel',
    stripeLink: '',
    status: 'Active',
    image: '/images/products/prole_adventures_black_binbag_3.webp',
    images: [
      '/images/products/prole_adventures_black_binbag_3.webp',
      '/images/products/prole_adventures_black_binbag_1.webp',
      '/images/products/prole_adventures_black_binbag_2.webp'
    ]
  },
  {
    id: 'prole-mug-tinny-001',
    name: 'Prole Adventures "Tinny" Mug',
    sku: 'PRINTFUL-MUG-ENAMEL-12OZ',
    description: 'The classic mission-ready enamel mug. Lightweight, durable, and ready for the field. Perfect for your morning caffeine or late-night brew.',
    price: 1500, // £15.00
    variants: ['12oz'],
    category: 'Gear',
    stripeLink: '',
    status: 'Active',
    image: '/images/products/prole_enamel_mug_white_12-oz_1.webp',
    images: [
      '/images/products/prole_enamel_mug_white_12-oz_1.webp',
      '/images/products/prole_enamel_mug_white_12-oz_2.webp',
      '/images/products/prole_enamel_mug_white_12-oz_3.webp'
    ]
  },
  {
    id: 'prole-adventures-tee-001',
    name: "Prole 'Adventures' Tee",
    description: "The definitive uniform for the modern Prole. Heavy-weight black cotton, built to withstand urban exploration and field missions.",
    price: 3000, // £30.00
    image: '/images/products/prole_t_binliner.webp',
    images: [
      '/images/products/prole_t_binliner.webp',
      '/images/products/prole_t_binliner_1.webp',
      '/images/products/prole_t_binliner_2.webp'
    ],
    category: 'Apparel'
  },
  {
    id: 'prole-cup-bbc-001',
    name: 'Prole Adventures "BBC" Cup',
    sku: 'PRINTFUL-MUG-BLACK-GLOSSY',
    description: 'When you need a stiff drink, reach for The Prole Adventure Big Black Cup. Sleek, glossy, and substantial.',
    price: 1500, // £15.00
    variants: ['11oz', '15oz'],
    category: 'Gear',
    stripeLink: '',
    status: 'Active',
    image: '/images/products/prole_adventures_black_glossy_mug_white_15-oz_1.webp',
    images: [
      '/images/products/prole_adventures_black_glossy_mug_white_15-oz_1.webp',
      '/images/products/prole_adventures_black_glossy_mug_white_15-oz_2.webp',
      '/images/products/prole_adventures_black_glossy_mug_white_15-oz_3.webp'
    ]
  },
  {
    id: 'prole-patch-001',
    name: 'Official Prole Patch',
    description: 'High-quality embroidered patch for your tactical gear. Show your allegiance to the cause.',
    price: 1200, // £12.00
    variants: ['Black', 'White'],
    image: '/images/products/prole_embroidered_tactical_patch_black.webp',
    images: [
      '/images/products/prole_embroidered_tactical_patch_black.webp',
      '/images/products/prole_embroidered_tactical_patch_white.webp'
    ],
    category: 'Gear'
  },
  {
    id: 'prole-briefing-doc',
    name: 'Mission Briefing Dossier',
    description: 'A collection of classified field reports and maps from previous operations.',
    price: 2500, // £25.00
    image: '/images/products/prole_adventures_field_report.webp',
    images: [
      '/images/products/prole_adventures_field_report.webp'
    ],
    category: 'Intel'
  },
  {
    id: 'prole-sticker-pack',
    name: 'Propaganda Sticker Pack',
    description: 'A set of 5 weatherproof vinyl stickers. Perfect for water bottles, laptops, and street furniture.',
    price: 800, // £8.00
    image: '/images/products/prole_adventures_kiss_cut_stickers_1.webp',
    images: [
      '/images/products/prole_adventures_kiss_cut_stickers_1.webp',
      '/images/products/prole_adventures_kiss_cut_stickers_2.webp'
    ],
    category: 'Merch'
  }
];
