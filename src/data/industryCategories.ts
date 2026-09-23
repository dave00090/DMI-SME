export interface IndustryDefinition {
  id: string;
  name: string;
  shortLabel: string;
  iconName?: string;
  description: string;
  categories: string[];
  defaultUnit: string;
  sampleProducts: {
    name: string;
    category: string;
    costPrice: number;
    sellingPrice: number;
    unit: string;
    stockQuantity: number;
    isService?: boolean;
  }[];
}

export const INDUSTRY_TYPES: IndustryDefinition[] = [
  {
    id: 'hardware',
    name: 'Hardware & Building Supplies',
    shortLabel: 'Hardware',
    description: 'Cement, timber, roofing sheets, fasteners, tools, electrical & plumbing',
    defaultUnit: 'pieces',
    categories: [
      'Cement & Masonry',
      'Paints & Finishes',
      'Fasteners & Nails',
      'Roofing & Timber',
      'Plumbing & Pipes',
      'Electrical & Lighting',
      'Tools & Safety Gear',
      'Steel & Rebar',
      'Hardware & Security',
      'General Retail',
    ],
    sampleProducts: [
      { name: 'Rhino Cement 50kg (32.5R)', category: 'Cement & Masonry', costPrice: 650, sellingPrice: 750, unit: 'bag', stockQuantity: 100 },
      { name: 'Wire Nails 3-inch (50kg Box)', category: 'Fasteners & Nails', costPrice: 4200, sellingPrice: 5000, unit: 'box', stockQuantity: 15 },
      { name: 'Crown Super Cover White 20L', category: 'Paints & Finishes', costPrice: 3100, sellingPrice: 3750, unit: 'bucket', stockQuantity: 20 },
    ],
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy & Chemist',
    shortLabel: 'Pharmacy',
    description: 'Human medicines, OTC drugs, first aid, supplements, medical supplies',
    defaultUnit: 'packs',
    categories: [
      'Prescription Medicines',
      'OTC Pain & Cold',
      'Antibiotics & Antimalarials',
      'Vitamins & Supplements',
      'First Aid & Dressings',
      'Personal Care & Hygiene',
      'Baby & Mother Care',
      'Medical Devices & Diagnostics',
      'Surgical & Sanitizers',
    ],
    sampleProducts: [
      { name: 'Panadol Extra Tablets (100s)', category: 'OTC Pain & Cold', costPrice: 450, sellingPrice: 600, unit: 'pack', stockQuantity: 40 },
      { name: 'Amoxicillin 500mg Capsules (10x10)', category: 'Antibiotics & Antimalarials', costPrice: 380, sellingPrice: 550, unit: 'box', stockQuantity: 30 },
      { name: 'Digital Blood Pressure Monitor', category: 'Medical Devices & Diagnostics', costPrice: 2800, sellingPrice: 3800, unit: 'piece', stockQuantity: 8 },
    ],
  },
  {
    id: 'salon',
    name: 'Hair Salon, Barbershop & Spa',
    shortLabel: 'Salon & Barber',
    description: 'Haircuts, styling, weaving, braids, facials, cosmetics, hair oils',
    defaultUnit: 'service',
    categories: [
      'Hair Styling & Cuts (Service)',
      'Braiding & Weaving (Service)',
      'Facial & Skin Therapy (Service)',
      'Nails & Pedicure (Service)',
      'Massage & Spa (Service)',
      'Hair Oils & Lotions',
      'Shampoos & Conditioners',
      'Cosmetics & Makeup',
      'Salon Accessories',
    ],
    sampleProducts: [
      { name: 'Executive Haircut & Beard Trim', category: 'Hair Styling & Cuts (Service)', costPrice: 0, sellingPrice: 500, unit: 'service', stockQuantity: 999999, isService: true },
      { name: 'Knotless Braids Medium', category: 'Braiding & Weaving (Service)', costPrice: 0, sellingPrice: 2500, unit: 'service', stockQuantity: 999999, isService: true },
      { name: 'Miadi Olive Oil Hair Treatment 500ml', category: 'Hair Oils & Lotions', costPrice: 350, sellingPrice: 500, unit: 'bottle', stockQuantity: 25 },
    ],
  },
  {
    id: 'bakery',
    name: 'Bakery & Pastries',
    shortLabel: 'Bakery',
    description: 'Fresh bread, cakes, pastries, mandazi, buns, baking ingredients',
    defaultUnit: 'pieces',
    categories: [
      'Fresh Breads & Loaves',
      'Cakes & Custom Birthday Cakes',
      'Pastries & Meat Pies',
      'Mandazi & Samosas',
      'Cookies & Biscuits',
      'Baking Ingredients & Flours',
      'Icing & Cake Decorations',
      'Beverages & Milk',
    ],
    sampleProducts: [
      { name: 'White Bread Sliced 800g', category: 'Fresh Breads & Loaves', costPrice: 70, sellingPrice: 95, unit: 'loaf', stockQuantity: 60 },
      { name: 'Black Forest Cake 1kg', category: 'Cakes & Custom Birthday Cakes', costPrice: 1100, sellingPrice: 1800, unit: 'piece', stockQuantity: 10 },
      { name: 'Beef Samosa Fresh Crispy', category: 'Mandazi & Samosas', costPrice: 25, sellingPrice: 50, unit: 'piece', stockQuantity: 150 },
    ],
  },
  {
    id: 'supermarket',
    name: 'Supermarket & Grocery Minimart',
    shortLabel: 'Supermarket',
    description: 'FMCG goods, dry foods, dairy, beverages, toiletries, household',
    defaultUnit: 'pieces',
    categories: [
      'Dry Foods & Flours',
      'Cooking Oils & Spices',
      'Dairy & Fresh Milk',
      'Beverages & Sodas',
      'Toiletries & Detergents',
      'Fresh Fruits & Vegetables',
      'Confectionery & Sweets',
      'Household Essentials',
      'Canned & Packaged Goods',
    ],
    sampleProducts: [
      { name: 'Pembe Maize Flour 2kg', category: 'Dry Foods & Flours', costPrice: 160, sellingPrice: 195, unit: 'packet', stockQuantity: 80 },
      { name: 'Rina Vegetable Oil 3L', category: 'Cooking Oils & Spices', costPrice: 650, sellingPrice: 780, unit: 'jerrycan', stockQuantity: 40 },
      { name: 'Ariel Auto Washing Powder 1kg', category: 'Toiletries & Detergents', costPrice: 280, sellingPrice: 350, unit: 'packet', stockQuantity: 50 },
    ],
  },
  {
    id: 'boutique',
    name: 'Boutique & Fashion Apparel',
    shortLabel: 'Boutique',
    description: 'Clothing, dresses, suits, kids wear, shoes, handbags, jewelry',
    defaultUnit: 'pieces',
    categories: [
      'Men\'s Wear',
      'Women\'s Fashion',
      'Children & Kids',
      'Shoes & Footwear',
      'Handbags & Wallets',
      'Belts & Accessories',
      'Jewelry & Watches',
      'Perfumes & Scents',
    ],
    sampleProducts: [
      { name: 'Men\'s Slim Fit Chino Trousers', category: 'Men\'s Wear', costPrice: 1200, sellingPrice: 1800, unit: 'piece', stockQuantity: 30 },
      { name: 'Women\'s Floral Maxi Dress', category: 'Women\'s Fashion', costPrice: 1400, sellingPrice: 2200, unit: 'piece', stockQuantity: 25 },
      { name: 'Ladies Leather Handbag Classic', category: 'Handbags & Wallets', costPrice: 1800, sellingPrice: 2800, unit: 'piece', stockQuantity: 15 },
    ],
  },
  {
    id: 'electronics',
    name: 'Electronics & Mobile Phone Accessories',
    shortLabel: 'Electronics',
    description: 'Smartphones, chargers, audio, TV, computer accessories, repairs',
    defaultUnit: 'pieces',
    categories: [
      'Smartphones & Tablets',
      'Laptops & Computers',
      'Audio, Headphones & Speakers',
      'TVs & Home Entertainment',
      'Chargers, Cables & Adapters',
      'Screen Protectors & Covers',
      'Networking & Routers',
      'Phone Repair & Screen Fix (Service)',
    ],
    sampleProducts: [
      { name: 'Type-C Fast Charging Cable 2M', category: 'Chargers, Cables & Adapters', costPrice: 150, sellingPrice: 350, unit: 'piece', stockQuantity: 60 },
      { name: 'Oraimo 20000mAh Powerbank', category: 'Chargers, Cables & Adapters', costPrice: 1800, sellingPrice: 2500, unit: 'piece', stockQuantity: 20 },
      { name: 'Smartphone Screen Replacement (Service)', category: 'Phone Repair & Screen Fix (Service)', costPrice: 1000, sellingPrice: 2500, unit: 'service', stockQuantity: 999999, isService: true },
    ],
  },
  {
    id: 'automotive',
    name: 'Automotive Spare Parts & Garage',
    shortLabel: 'Auto & Garage',
    description: 'Vehicle parts, engine oils, suspension, brake pads, garage repair',
    defaultUnit: 'pieces',
    categories: [
      'Mechanical Repair (Service)',
      'Vehicle Diagnostic (Service)',
      'Engine Oils & Lubricants',
      'Brakes, Pads & Discs',
      'Suspension & Shock Absorbers',
      'Batteries & Electricals',
      'Car Wash & Detailing (Service)',
      'Tires & Wheel Alignment',
      'Filters & Spark Plugs',
    ],
    sampleProducts: [
      { name: 'Total Quartz 5000 15W40 (5L)', category: 'Engine Oils & Lubricants', costPrice: 2800, sellingPrice: 3500, unit: 'gallon', stockQuantity: 25 },
      { name: 'Toyota Probox Front Brake Pads', category: 'Brakes, Pads & Discs', costPrice: 1200, sellingPrice: 1800, unit: 'set', stockQuantity: 15 },
      { name: 'Full Engine Service & Diagnostic', category: 'Vehicle Diagnostic (Service)', costPrice: 0, sellingPrice: 3500, unit: 'service', stockQuantity: 999999, isService: true },
    ],
  },
  {
    id: 'restaurant',
    name: 'Restaurant, Cafe & Fast Food',
    shortLabel: 'Restaurant',
    description: 'Hot meals, burgers, chips, breakfast, tea, coffee, cold drinks',
    defaultUnit: 'plates',
    categories: [
      'Hot Meals & Traditional Dishes',
      'Fast Food & Burgers',
      'Breakfast & Snacks',
      'Hot Beverages (Coffee & Tea)',
      'Cold Drinks & Smoothies',
      'Pastries & Desserts',
      'Meat & Grills',
      'Catering & Buffet (Service)',
    ],
    sampleProducts: [
      { name: 'Ugali Beef & Sukuma Wiki', category: 'Hot Meals & Traditional Dishes', costPrice: 140, sellingPrice: 280, unit: 'plate', stockQuantity: 100 },
      { name: 'Chicken & Chips Combo (Quarter)', category: 'Fast Food & Burgers', costPrice: 220, sellingPrice: 420, unit: 'plate', stockQuantity: 80 },
      { name: 'Special African Spiced Chai', category: 'Hot Beverages (Coffee & Tea)', costPrice: 25, sellingPrice: 80, unit: 'cup', stockQuantity: 200 },
    ],
  },
  {
    id: 'butchery',
    name: 'Butchery & Meat Supply',
    shortLabel: 'Butchery',
    description: 'Fresh beef, goat meat, chicken, pork, sausages, bones, BBQ cuts',
    defaultUnit: 'kg',
    categories: [
      'Fresh Beef & Steak',
      'Goat Meat (Mbuzi)',
      'Pork Cuts',
      'Fresh Chicken & Broilers',
      'Kienyeji Poultry',
      'Sausages & Smokies',
      'Bones & Broth Cuts',
      'Marinated & BBQ Grills',
    ],
    sampleProducts: [
      { name: 'Prime Beef Steak (1kg)', category: 'Fresh Beef & Steak', costPrice: 520, sellingPrice: 650, unit: 'kg', stockQuantity: 60 },
      { name: 'Fresh Goat Ribs (Mbuzi Choma 1kg)', category: 'Goat Meat (Mbuzi)', costPrice: 680, sellingPrice: 850, unit: 'kg', stockQuantity: 40 },
      { name: 'Farmer\'s Choice Beef Sausages (1kg)', category: 'Sausages & Smokies', costPrice: 460, sellingPrice: 580, unit: 'packet', stockQuantity: 25 },
    ],
  },
  {
    id: 'agrovet',
    name: 'Agrovet & Animal Feeds',
    shortLabel: 'Agrovet',
    description: 'Veterinary drugs, cattle/poultry feeds, seeds, fertilizers, pesticides',
    defaultUnit: 'bags',
    categories: [
      'Dairy & Cattle Feeds',
      'Poultry & Layer Feeds',
      'Veterinary Medicines',
      'Crop Pesticides & Fungicides',
      'Fertilizers & Seedlings',
      'Farm Tools & Sprayers',
      'Pet Foods & Grooming',
      'Dewormers & Vaccines',
    ],
    sampleProducts: [
      { name: 'Dairy Meal Supreme 50kg', category: 'Dairy & Cattle Feeds', costPrice: 2400, sellingPrice: 2850, unit: 'bag', stockQuantity: 50 },
      { name: 'DAP Planting Fertilizer 50kg', category: 'Fertilizers & Seedlings', costPrice: 3200, sellingPrice: 3750, unit: 'bag', stockQuantity: 40 },
      { name: 'Thunder Insecticide 100ml', category: 'Crop Pesticides & Fungicides', costPrice: 420, sellingPrice: 550, unit: 'bottle', stockQuantity: 30 },
    ],
  },
  {
    id: 'bookshop',
    name: 'Bookshop & Stationery Supplies',
    shortLabel: 'Bookshop',
    description: 'School textbooks, exercise books, pens, office papers, art craft',
    defaultUnit: 'pieces',
    categories: [
      'School Textbooks & Set Books',
      'Exercise Books & Notebooks',
      'Pens, Inks & Markers',
      'Office Paper & Reams',
      'Art & Craft Materials',
      'Calculators & Geometry Sets',
      'Envelopes & Filing',
      'Printing & Laminating (Service)',
    ],
    sampleProducts: [
      { name: 'JKF Primary Maths Book 4', category: 'School Textbooks & Set Books', costPrice: 450, sellingPrice: 600, unit: 'book', stockQuantity: 35 },
      { name: 'Kasuku A4 200 Pages Ruled Book', category: 'Exercise Books & Notebooks', costPrice: 90, sellingPrice: 130, unit: 'piece', stockQuantity: 150 },
      { name: 'Rotatrim A4 Printing Paper (Ream)', category: 'Office Paper & Reams', costPrice: 580, sellingPrice: 750, unit: 'ream', stockQuantity: 40 },
    ],
  },
  {
    id: 'liquor',
    name: 'Wines, Spirits & Liquor Store',
    shortLabel: 'Liquor Store',
    description: 'Whiskeys, beers, wines, gin, vodka, ciders, mixers, party ice',
    defaultUnit: 'bottles',
    categories: [
      'Whiskies & Bourbons',
      'Vodkas & Gins',
      'Local & Imported Beers',
      'Red & White Wines',
      'Ciders & Ready-to-Drink',
      'Brandy & Cognac',
      'Mixers & Soft Drinks',
      'Ice & Party Accessories',
    ],
    sampleProducts: [
      { name: 'Johnnie Walker Red Label 750ml', category: 'Whiskies & Bourbons', costPrice: 1800, sellingPrice: 2300, unit: 'bottle', stockQuantity: 24 },
      { name: 'Tusker Lager 500ml Can', category: 'Local & Imported Beers', costPrice: 190, sellingPrice: 250, unit: 'can', stockQuantity: 96 },
      { name: 'Gordon\'s London Dry Gin 750ml', category: 'Vodkas & Gins', costPrice: 1400, sellingPrice: 1850, unit: 'bottle', stockQuantity: 20 },
    ],
  },
  {
    id: 'cosmetics',
    name: 'Cosmetics & Beauty Supplies',
    shortLabel: 'Cosmetics',
    description: 'Skincare, makeup, foundations, fragrances, lipsticks, hair weaves',
    defaultUnit: 'pieces',
    categories: [
      'Skincare & Sunscreen',
      'Makeup & Foundations',
      'Lipsticks & Eye Makeup',
      'Fragrances & Body Mists',
      'Nail Polishes & Kits',
      'Hair Extensions & Wigs',
      'Soaps & Scrubs',
      'Beauty Tools & Brushes',
    ],
    sampleProducts: [
      { name: 'Garnier Vitamin C Serum 30ml', category: 'Skincare & Sunscreen', costPrice: 950, sellingPrice: 1350, unit: 'bottle', stockQuantity: 30 },
      { name: 'Maybelline Fit Me Matte Foundation', category: 'Makeup & Foundations', costPrice: 1100, sellingPrice: 1600, unit: 'bottle', stockQuantity: 25 },
      { name: 'Darling Darling Yaki Braid (Pack)', category: 'Hair Extensions & Wigs', costPrice: 180, sellingPrice: 280, unit: 'pack', stockQuantity: 70 },
    ],
  },
  {
    id: 'furniture',
    name: 'Furniture & Carpentry Workshop',
    shortLabel: 'Furniture',
    description: 'Sofas, beds, dining sets, office desks, wardrobes, custom timber',
    defaultUnit: 'pieces',
    categories: [
      'Living Room Sofas & Sets',
      'Beds & Bedroom Sets',
      'Dining Tables & Chairs',
      'Office Desks & Ergonomic Chairs',
      'Wardrobes & Cabinets',
      'Mattresses & Foam',
      'Wood Varnish & Polish',
      'Custom Carpentry (Service)',
    ],
    sampleProducts: [
      { name: 'Executive 5x6 Mahogany Bed Frame', category: 'Beds & Bedroom Sets', costPrice: 18000, sellingPrice: 26000, unit: 'set', stockQuantity: 4 },
      { name: 'Ergonomic Mesh Office Swivel Chair', category: 'Office Desks & Ergonomic Chairs', costPrice: 7500, sellingPrice: 11000, unit: 'piece', stockQuantity: 8 },
      { name: 'Custom Fitted Wardrobe (Per Meter)', category: 'Custom Carpentry (Service)', costPrice: 0, sellingPrice: 8500, unit: 'service', stockQuantity: 999999, isService: true },
    ],
  },
  {
    id: 'electrical',
    name: 'Electricals, Solar & Lighting',
    shortLabel: 'Solar & Lighting',
    description: 'Solar panels, inverters, batteries, LED lights, cables, breakers',
    defaultUnit: 'pieces',
    categories: [
      'Solar Panels & Inverters',
      'Solar Batteries & Charge Controllers',
      'Indoor LED Lighting',
      'Outdoor Floodlights & Security Lights',
      'Electrical Cables & Conduits',
      'Switches & Sockets',
      'Circuit Breakers & Distribution Boxes',
      'Generators & Backup Power',
    ],
    sampleProducts: [
      { name: 'Solar Monocrystalline Panel 350W', category: 'Solar Panels & Inverters', costPrice: 11500, sellingPrice: 14500, unit: 'piece', stockQuantity: 12 },
      { name: 'Solar Street Flood Light 200W + Remote', category: 'Outdoor Floodlights & Security Lights', costPrice: 2800, sellingPrice: 4200, unit: 'piece', stockQuantity: 20 },
      { name: 'East African Cables 1.5mm Single Core', category: 'Electrical Cables & Conduits', costPrice: 3200, sellingPrice: 3900, unit: 'roll', stockQuantity: 15 },
    ],
  },
  {
    id: 'plumbing',
    name: 'Plumbing & Water Solutions',
    shortLabel: 'Plumbing',
    description: 'PPR/PVC pipes, water tanks, pumps, taps, sanitaryware, fittings',
    defaultUnit: 'pieces',
    categories: [
      'PVC & PPR Pipes',
      'Water Tanks & Storage',
      'Sump Pumps & Booster Pumps',
      'Taps, Faucets & Sinks',
      'Valves & Connectors',
      'Toilet Suites & Sanitaryware',
      'Water Filters & Purifiers',
      'Plumbing Installation (Service)',
    ],
    sampleProducts: [
      { name: 'Roto Water Storage Tank 1000L', category: 'Water Tanks & Storage', costPrice: 9500, sellingPrice: 12500, unit: 'tank', stockQuantity: 6 },
      { name: 'PPR Pipe 32mm PN20 (4m length)', category: 'PVC & PPR Pipes', costPrice: 380, sellingPrice: 520, unit: 'piece', stockQuantity: 50 },
      { name: 'Brass Kitchen Sink Mixer Tap Heavy', category: 'Taps, Faucets & Sinks', costPrice: 1600, sellingPrice: 2400, unit: 'piece', stockQuantity: 18 },
    ],
  },
  {
    id: 'lpg_gas',
    name: 'LPG Cooking Gas & Energy Distribution',
    shortLabel: 'LPG Gas',
    description: 'Gas cylinders, refills, regulators, hoses, safety valves, stoves',
    defaultUnit: 'cylinders',
    categories: [
      'Complete Gas Cylinders (6kg, 13kg, 50kg)',
      'Gas Refills & Exchange',
      'Gas Regulators & Hoses',
      'Burners & Grills',
      'Gas Stoves & Cookers',
      'Safety Valves & Leak Detectors',
      'Cylinder Accessories',
      'Home Delivery (Service)',
    ],
    sampleProducts: [
      { name: 'Pro Gas 6kg Refill Exchange', category: 'Gas Refills & Exchange', costPrice: 1100, sellingPrice: 1350, unit: 'cylinder', stockQuantity: 40 },
      { name: 'K-Gas 13kg Refill Exchange', category: 'Gas Refills & Exchange', costPrice: 2450, sellingPrice: 2850, unit: 'cylinder', stockQuantity: 30 },
      { name: 'Heavy Duty Gas Hose & 2 Clips (2m)', category: 'Gas Regulators & Hoses', costPrice: 250, sellingPrice: 450, unit: 'piece', stockQuantity: 35 },
    ],
  },
  {
    id: 'motorcycle',
    name: 'Motorcycle (Boda Boda) & Bicycle Spare Parts',
    shortLabel: 'Boda Parts',
    description: 'Boda boda parts, tyres, chains, sprockets, helmets, 4T oils',
    defaultUnit: 'pieces',
    categories: [
      'Engine Parts & Pistons',
      'Tyres & Tubes',
      'Brake Shoes & Cables',
      'Chains & Sprockets',
      'Headlights & Indicators',
      'Helmets & Safety Jackets',
      '2T & 4T Engine Lubricants',
      'Boda Boda Repair (Service)',
    ],
    sampleProducts: [
      { name: 'Boxer BM150 Heavy Duty Tyre 3.00-17', category: 'Tyres & Tubes', costPrice: 1900, sellingPrice: 2600, unit: 'piece', stockQuantity: 20 },
      { name: 'Castrol Activ 4T 20W50 Motorcycle Oil 1L', category: '2T & 4T Engine Lubricants', costPrice: 580, sellingPrice: 750, unit: 'bottle', stockQuantity: 40 },
      { name: 'Motorcycle Drive Chain 428H Heavy Duty', category: 'Chains & Sprockets', costPrice: 650, sellingPrice: 950, unit: 'piece', stockQuantity: 25 },
    ],
  },
  {
    id: 'cyber_cafe',
    name: 'Cyber Cafe, Printing & Computer Bureau',
    shortLabel: 'Cyber Bureau',
    description: 'Photocopying, printing, KRA/eCitizen, typing, flash drives, laminating',
    defaultUnit: 'pages',
    categories: [
      'Photocopying & Printing (Service)',
      'Scanning & Typesetting (Service)',
      'KRA & eCitizen Services (Service)',
      'Laminating & Binding (Service)',
      'Passport Photos & Studio (Service)',
      'Flash Drives & Memory Cards',
      'Stationery & Envelopes',
      'Internet Browsing & Gaming (Service)',
    ],
    sampleProducts: [
      { name: 'A4 B&W Printing / Photocopy (Per Page)', category: 'Photocopying & Printing (Service)', costPrice: 2, sellingPrice: 10, unit: 'page', stockQuantity: 999999, isService: true },
      { name: 'KRA Nil Returns Filing Service', category: 'KRA & eCitizen Services (Service)', costPrice: 0, sellingPrice: 200, unit: 'service', stockQuantity: 999999, isService: true },
      { name: 'Sandisk 32GB USB Flash Drive 3.0', category: 'Flash Drives & Memory Cards', costPrice: 550, sellingPrice: 850, unit: 'piece', stockQuantity: 25 },
    ],
  },
  {
    id: 'cereals',
    name: 'Cereals, Grains & Produce Millers',
    shortLabel: 'Cereals & Millers',
    description: 'Maize, beans, rice, sorghum, flours, animal bran, posho mill',
    defaultUnit: 'kg',
    categories: [
      'Maize & White Corn',
      'Dry Beans & Legumes',
      'Rice (Basmati, Pishori, Biryani)',
      'Millet & Sorghum',
      'Wheat & Ground Flours',
      'Animal Bran & Pollard',
      'Grain Sacks & Packaging',
      'Posho Mill Grinding (Service)',
    ],
    sampleProducts: [
      { name: 'Mwea Pishori Pure Rice (1kg)', category: 'Rice (Basmati, Pishori, Biryani)', costPrice: 180, sellingPrice: 230, unit: 'kg', stockQuantity: 100 },
      { name: 'Yellow Beans (Nyayo 1kg)', category: 'Dry Beans & Legumes', costPrice: 130, sellingPrice: 170, unit: 'kg', stockQuantity: 80 },
      { name: 'White Maize Grain (90kg Bag)', category: 'Maize & White Corn', costPrice: 3100, sellingPrice: 3700, unit: 'bag', stockQuantity: 25 },
    ],
  },
  {
    id: 'paint_glass',
    name: 'Paint, Glass & Aluminium Mart',
    shortLabel: 'Paint & Glass',
    description: 'Emulsion paint, gloss, window panes, aluminium profiles, glazing',
    defaultUnit: 'pieces',
    categories: [
      'Emulsion & Silk Wall Paints',
      'Gloss & Oil Paints',
      'Primers & Undercoats',
      'Paint Brushes & Rollers',
      'Window Glass & Tinted Panes',
      'Aluminium Profiles & Frames',
      'Putty & Thinners',
      'Cutting & Glazing (Service)',
    ],
    sampleProducts: [
      { name: 'Silk Vinyl Washable Paint 20L Brilliant White', category: 'Emulsion & Silk Wall Paints', costPrice: 4200, sellingPrice: 5200, unit: 'bucket', stockQuantity: 15 },
      { name: 'Clear Float Window Glass 4mm (Sq Foot)', category: 'Window Glass & Tinted Panes', costPrice: 85, sellingPrice: 140, unit: 'sqft', stockQuantity: 200 },
      { name: 'Standard 9-inch Paint Roller & Tray Set', category: 'Paint Brushes & Rollers', costPrice: 280, sellingPrice: 450, unit: 'set', stockQuantity: 30 },
    ],
  },
  {
    id: 'footwear',
    name: 'Footwear & Leather Goods',
    shortLabel: 'Footwear',
    description: 'Shoes, boots, sneakers, heels, sandals, belts, polish, shoe repair',
    defaultUnit: 'pairs',
    categories: [
      'Men\'s Formal Shoes',
      'Women\'s Heels & Flats',
      'Sneakers & Sports Shoes',
      'School Shoes & Boots',
      'Sandals & Slippers',
      'Leather Belts & Wallets',
      'Shoe Polishes & Brushes',
      'Shoe Repair & Stitching (Service)',
    ],
    sampleProducts: [
      { name: 'Bata Toughies Leather School Shoes', category: 'School Shoes & Boots', costPrice: 1600, sellingPrice: 2200, unit: 'pair', stockQuantity: 35 },
      { name: 'Men\'s Genuine Leather Oxford Shoes', category: 'Men\'s Formal Shoes', costPrice: 2400, sellingPrice: 3600, unit: 'pair', stockQuantity: 18 },
      { name: 'Kiwi Black Shoe Polish 100ml', category: 'Shoe Polishes & Brushes', costPrice: 120, sellingPrice: 180, unit: 'tin', stockQuantity: 50 },
    ],
  },
  {
    id: 'gym',
    name: 'Gym & Fitness Center',
    shortLabel: 'Gym & Fitness',
    description: 'Workout memberships, daily pass, supplements, drinks, fitness classes',
    defaultUnit: 'service',
    categories: [
      'Daily Workout Pass (Service)',
      'Monthly Gym Membership (Service)',
      'Personal Training (Service)',
      'Protein Powders & Shakes',
      'Energy & Pre-Workout Drinks',
      'Gym Gloves & Belts',
      'Branded Shaker Bottles',
      'Aerobics & Zumba Classes (Service)',
    ],
    sampleProducts: [
      { name: 'Daily Gym Access Pass', category: 'Daily Workout Pass (Service)', costPrice: 0, sellingPrice: 300, unit: 'service', stockQuantity: 999999, isService: true },
      { name: 'Monthly Unlimited Membership', category: 'Monthly Gym Membership (Service)', costPrice: 0, sellingPrice: 3500, unit: 'service', stockQuantity: 999999, isService: true },
      { name: 'Gold Standard Whey Protein 2lbs', category: 'Protein Powders & Shakes', costPrice: 4200, sellingPrice: 5800, unit: 'tub', stockQuantity: 10 },
    ],
  },
  {
    id: 'laundry',
    name: 'Laundry, Dry Cleaning & Laundromat',
    shortLabel: 'Laundromat',
    description: 'Wash and fold, dry cleaning, duvet wash, ironing, carpet cleaning',
    defaultUnit: 'service',
    categories: [
      'Wash & Fold (Service)',
      'Ironing & Pressing (Service)',
      'Dry Cleaning Suits & Gowns (Service)',
      'Duvet & Blanket Washing (Service)',
      'Carpet & Rug Cleaning (Service)',
      'Fabric Softeners & Bleach',
      'Laundry Bags & Hangers',
      'Pick-up & Delivery (Service)',
    ],
    sampleProducts: [
      { name: 'Heavy Duvet Washing & Sanitize', category: 'Duvet & Blanket Washing (Service)', costPrice: 0, sellingPrice: 800, unit: 'service', stockQuantity: 999999, isService: true },
      { name: 'Two-Piece Suit Dry Cleaning & Steam Press', category: 'Dry Cleaning Suits & Gowns (Service)', costPrice: 0, sellingPrice: 750, unit: 'service', stockQuantity: 999999, isService: true },
      { name: 'Standard Laundry Wash & Fold (Per Kg)', category: 'Wash & Fold (Service)', costPrice: 0, sellingPrice: 150, unit: 'kg', stockQuantity: 999999, isService: true },
    ],
  },
];

/**
 * Helper to match any registered category or industry slug to the accurate categories array
 */
export function getIndustryDefinition(industryOrCategoryString?: string): IndustryDefinition {
  if (!industryOrCategoryString) {
    return INDUSTRY_TYPES[0]; // Hardware default
  }

  const raw = industryOrCategoryString.toLowerCase().trim();

  // Direct id match
  const directMatch = INDUSTRY_TYPES.find((ind) => ind.id.toLowerCase() === raw);
  if (directMatch) return directMatch;

  // Partial name or keyword match
  const nameMatch = INDUSTRY_TYPES.find((ind) =>
    ind.name.toLowerCase().includes(raw) ||
    raw.includes(ind.name.toLowerCase()) ||
    raw.includes(ind.shortLabel.toLowerCase())
  );
  if (nameMatch) return nameMatch;

  // Keyword heuristic
  if (raw.includes('pharm') || raw.includes('chem') || raw.includes('drug') || raw.includes('med')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'pharmacy')!;
  }
  if (raw.includes('salon') || raw.includes('barber') || raw.includes('hair') || raw.includes('spa')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'salon')!;
  }
  if (raw.includes('bake') || raw.includes('cake') || raw.includes('pastr')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'bakery')!;
  }
  if (raw.includes('super') || raw.includes('mart') || raw.includes('groc')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'supermarket')!;
  }
  if (raw.includes('bout') || raw.includes('cloth') || raw.includes('fash') || raw.includes('apparel')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'boutique')!;
  }
  if (raw.includes('elect') || raw.includes('phone') || raw.includes('comput')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'electronics')!;
  }
  if (raw.includes('auto') || raw.includes('garage') || raw.includes('motor') || raw.includes('car')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'automotive')!;
  }
  if (raw.includes('rest') || raw.includes('cafe') || raw.includes('food') || raw.includes('hotel')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'restaurant')!;
  }
  if (raw.includes('butch') || raw.includes('meat') || raw.includes('beef')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'butchery')!;
  }
  if (raw.includes('agro') || raw.includes('feed') || raw.includes('vet') || raw.includes('farm')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'agrovet')!;
  }
  if (raw.includes('book') || raw.includes('stat') || raw.includes('school')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'bookshop')!;
  }
  if (raw.includes('wine') || raw.includes('spirit') || raw.includes('liquor') || raw.includes('beer') || raw.includes('bar')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'liquor')!;
  }
  if (raw.includes('cosm') || raw.includes('beauty') || raw.includes('skin')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'cosmetics')!;
  }
  if (raw.includes('furn') || raw.includes('carpen') || raw.includes('wood') || raw.includes('timber')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'furniture')!;
  }
  if (raw.includes('light') || raw.includes('solar')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'electrical')!;
  }
  if (raw.includes('plumb') || raw.includes('pipe') || raw.includes('water')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'plumbing')!;
  }
  if (raw.includes('gas') || raw.includes('lpg')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'lpg_gas')!;
  }
  if (raw.includes('boda') || raw.includes('cycle') || raw.includes('bike')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'motorcycle')!;
  }
  if (raw.includes('cyber') || raw.includes('print')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'cyber_cafe')!;
  }
  if (raw.includes('cereal') || raw.includes('grain') || raw.includes('mill')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'cereals')!;
  }
  if (raw.includes('glass') || raw.includes('paint')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'paint_glass')!;
  }
  if (raw.includes('shoe') || raw.includes('foot') || raw.includes('leather')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'footwear')!;
  }
  if (raw.includes('gym') || raw.includes('fit')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'gym')!;
  }
  if (raw.includes('laund') || raw.includes('clean') || raw.includes('wash')) {
    return INDUSTRY_TYPES.find((i) => i.id === 'laundry')!;
  }

  // Fallback
  return INDUSTRY_TYPES[0];
}

export function getCategoriesByIndustry(industryOrCategoryString?: string): string[] {
  const def = getIndustryDefinition(industryOrCategoryString);
  return def.categories;
}
