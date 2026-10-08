export interface IndustryDefinition {
  id: string;
  name: string;
  shortLabel: string;
  iconName?: string;
  description: string;
  categories: string[];
  defaultUnit: string;
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
  },
  {
    id: 'general',
    name: 'General Retail / Other',
    shortLabel: 'General',
    description: 'Any other kind of shop or service business',
    defaultUnit: 'pieces',
    categories: ['General', 'Services', 'Other'],
  },
];

/**
 * Helper to match any registered category or industry slug to the accurate categories array
 */
export function getIndustryDefinition(industryOrCategoryString?: string): IndustryDefinition {
  if (!industryOrCategoryString) {
    return INDUSTRY_TYPES.find((i) => i.id === 'general')!;
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
  return INDUSTRY_TYPES.find((i) => i.id === 'general')!;
}

export function getCategoriesByIndustry(industryOrCategoryString?: string): string[] {
  const def = getIndustryDefinition(industryOrCategoryString);
  return def.categories;
}
