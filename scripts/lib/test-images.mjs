// Real product photos (Unsplash, free to use) for the demo / test data. Every id below was checked to resolve and to show
// what its key says. The seed scripts write these URLs straight into the database. Note: the app's own API only accepts
// images uploaded to its Cloudinary account, so a seller who edits one of these products must re-upload its photos.
const ID = {
  phone1: "1511707171634-5f897ff02aa9",
  phone2: "1592899677977-9c10ca588bbd",
  phone3: "1598327105666-5b89351aff97",
  laptop1: "1496181133206-80ce9b88a853",
  laptop2: "1517336714731-489689fd1ca8",
  laptop3: "1525547719571-a2d4ac8945e2",
  earbuds1: "1590658268037-6bf12165a8df",
  headphones1: "1505740420928-5e560c06d30e",
  headphones2: "1583394838336-acd977736f90",
  watch1: "1523275335684-37898b6baf30",
  watch2: "1546868871-7041f2a55e12",
  shirt1: "1596755094514-f87e34085b2c",
  shirt2: "1602810318383-e386cc2a3ccf",
  dress1: "1572804013309-59a88b7e92f1",
  sneaker1: "1542291026-7eec264c27ff",
  sneaker2: "1549298916-b41d501d3772",
  sneaker3: "1460353581641-37baddab0fa2",
  bag1: "1584917865442-de89df76afd3",
  bag2: "1548036328-c9fa89d128fa",
  lamp1: "1507473885765-e6ed057f782c",
  stool1: "1503602642458-232111445657",
  mug1: "1514228742587-6b1558fcca3d",
  sofa1: "1555041469-a586c61ea9bc",
  ball1: "1579952363873-27f3bade9f55",
  yoga1: "1544367567-0f2fcb009e0b",
  dumbbell1: "1583454110551-21f2fa2afe61",
  toys1: "1558060370-d644479cb6f7",
  teddy1: "1559454403-b8fb88521f11",
  book1: "1544947950-fa07a98d237f",
  notebook1: "1531346878377-a5be20888e57",
  pen1: "1583485088034-697b5bc54ccd",
  car1: "1492144534655-ae79c964c9d7",
  tv1: "1593359677879-a4bb92f829d1",
  camera1: "1516035069371-29a1b244cc32",
  speaker1: "1608043152269-423dbba4e7e1",
  sunglasses1: "1572635196237-14b3f281503f",
  jeans1: "1542272604-787c3835535d",
  jacket1: "1551028719-00167b16eac5",
};

/** URL for an image key; `w` is the width in px (square-ish product photos use 800, wide banners 1600). */
export const img = (key, w = 800) => {
  if (!ID[key]) throw new Error(`Unknown test image "${key}"`);
  return `https://images.unsplash.com/photo-${ID[key]}?auto=format&fit=crop&w=${w}&q=80`;
};
export const imgs = (...keys) => keys.map((k) => img(k));
export const banner = (key) => `${img(key, 1600)}&h=600`;

/** Photos for the 8 products created by seed-demo.mjs, keyed by product title. */
export const DEMO_PRODUCT_IMAGES = {
  "Galaxy-style Smartphone 128GB": imgs("phone2", "phone1"),
  "Budget Android Phone 64GB": imgs("phone3"),
  "14-inch Ultrabook i5 16GB": imgs("laptop1", "laptop2"),
  "Wireless Earbuds Pro": imgs("earbuds1"),
  "Classic Cotton Shirt": imgs("shirt1", "shirt2"),
  "Floral Summer Dress": imgs("dress1"),
  "Running Sneakers": imgs("sneaker1", "sneaker3"),
  "Leather Handbag": imgs("bag1", "bag2"),
};

/** Category cover photos, keyed by category name. */
export const CATEGORY_IMAGES = {
  Electronics: img("tv1", 600),
  Fashion: img("jacket1", 600),
  "Home & Living": img("lamp1", 600),
  "Sports & Fitness": img("yoga1", 600),
  "Toys & Kids": img("teddy1", 600),
  "Books & Stationery": img("book1", 600),
  "Vehicles & Auto": img("car1", 600),
};

/** Photos for the demo banners, keyed by the banner title. */
export const BANNER_IMAGES = {
  "[Demo] Mega Sale": banner("camera1"),
  "[Demo] New Arrivals": banner("shirt2"),
};

/**
 * Extra catalogue added by seed-test-data.mjs: [slug, title, category, subcategory|null, price, quantity, brand, description, tags, photos].
 * "tech" listings belong to Tech Hub, everything else to Style Corner.
 */
export const CATALOG = [
  ["test-smart-watch", "Smart Watch Series 6", "Electronics", null, 54900, 18, "Pulse", "Always-on display, heart-rate and sleep tracking, water resistant.", ["watch", "wearable"], imgs("watch2", "watch1"), "tech"],
  ["test-over-ear-headphones", "Over-Ear Studio Headphones", "Electronics", "Audio", 18500, 30, "SoundCo", "Padded over-ear headphones with deep bass and a detachable cable.", ["headphones", "audio"], imgs("headphones1", "headphones2"), "tech"],
  ["test-bluetooth-speaker", "Portable Bluetooth Speaker", "Electronics", "Audio", 14900, 45, "SoundCo", "Waterproof portable speaker, 12 hours of playtime.", ["speaker", "audio"], imgs("speaker1"), "tech"],
  ["test-smart-tv", "55-inch 4K Smart TV", "Electronics", null, 149000, 6, "Vista", "4K UHD smart TV with built-in streaming apps.", ["tv", "4k"], imgs("tv1"), "tech"],
  ["test-mirrorless-camera", "Mirrorless Camera with 2 Lenses", "Electronics", null, 289000, 4, "Optix", "24MP mirrorless camera kit with a kit lens and a prime lens.", ["camera", "photography"], imgs("camera1"), "tech"],
  ["test-pro-laptop", "Creator Laptop 16GB / 512GB", "Electronics", "Laptops", 325000, 5, "Brand Z", "Slim creator laptop with a bright backlit keyboard.", ["laptop"], imgs("laptop3", "laptop2"), "tech"],
  ["test-slim-jeans", "Slim Fit Denim Jeans", "Fashion", "Men", 6490, 60, "Urban", "Stretch denim, mid-rise, slim fit.", ["jeans", "denim"], imgs("jeans1"), "style"],
  ["test-leather-jacket", "Black Leather Jacket", "Fashion", "Men", 24900, 12, "Urban", "Genuine leather biker jacket with a quilted lining.", ["jacket", "leather"], imgs("jacket1"), "style"],
  ["test-sunglasses", "Classic Black Sunglasses", "Fashion", null, 4200, 80, "Shade", "UV400 polarised lenses in a classic black frame.", ["sunglasses", "accessories"], imgs("sunglasses1"), "style"],
  ["test-casual-sneakers", "Tan Casual Sneakers", "Fashion", "Shoes", 9900, 25, "Stride", "Low-top leather sneakers with a cushioned insole.", ["sneakers", "shoes"], imgs("sneaker2"), "style"],
  ["test-desk-lamp", "Adjustable Desk Lamp", "Home & Living", "Decor", 3800, 40, "Lumen", "Metal desk lamp with an adjustable arm.", ["lamp", "lighting"], imgs("lamp1"), "style"],
  ["test-wooden-stool", "Light Wood Bar Stool", "Home & Living", "Decor", 7500, 14, "Nordic", "Solid wood stool with a footrest.", ["stool", "furniture"], imgs("stool1"), "style"],
  ["test-ceramic-mug", "White Ceramic Mug", "Home & Living", "Kitchen", 950, 120, "Hearth", "350ml glazed ceramic mug, dishwasher safe.", ["mug", "kitchen"], imgs("mug1"), "style"],
  ["test-velvet-sofa", "Green Velvet 3-Seater Sofa", "Home & Living", "Decor", 119000, 3, "Nordic", "Three-seater velvet sofa on solid wood legs.", ["sofa", "furniture"], imgs("sofa1"), "style"],
  ["test-football", "Match Football Size 5", "Sports & Fitness", null, 4500, 50, "Striker", "Size 5 match ball with a durable weather-resistant cover.", ["football", "sports"], imgs("ball1"), "style"],
  ["test-dumbbell-set", "Adjustable Dumbbell Set", "Sports & Fitness", null, 16500, 20, "IronFit", "Pair of adjustable dumbbells for home workouts.", ["gym", "weights"], imgs("dumbbell1"), "style"],
  ["test-toy-collection", "Assorted Toy Collection", "Toys & Kids", null, 3200, 35, "PlayCo", "A mixed box of colourful toy cars and figures.", ["toys", "kids"], imgs("toys1"), "style"],
  ["test-teddy-bear", "Plush Teddy Bear with Blanket", "Toys & Kids", null, 2900, 28, "Cuddle", "Soft teddy bear with a knitted blanket and basket.", ["teddy", "plush"], imgs("teddy1"), "style"],
  ["test-poetry-book", "Poetry Collection Paperback", "Books & Stationery", null, 1800, 70, "Paperline", "Bestselling illustrated poetry collection.", ["book", "poetry"], imgs("book1"), "style"],
  ["test-spiral-notebook", "A5 Spiral Notebook", "Books & Stationery", null, 650, 200, "Paperline", "A5 spiral-bound notebook, 100 ruled pages.", ["notebook", "stationery"], imgs("notebook1"), "style"],
  ["test-gel-pen", "Black Gel Pen", "Books & Stationery", null, 250, 300, "Paperline", "Smooth-writing 0.5mm gel pen.", ["pen", "stationery"], imgs("pen1"), "style"],
];
