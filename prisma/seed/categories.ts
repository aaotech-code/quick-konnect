
import { PrismaClient } from '@prisma/client';

type Cat = {
  slug: string;
  name: string;
  icon: string;
  imageUrl: string;
  children?: { slug: string; name: string; icon: string; imageUrl: string }[];
};

const IMG = (id: string) =>
  'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=1200&q=85';

const TREE: Cat[] = [
  {
    slug: 'home-property', name: 'Home & Property', icon: '🏠', imageUrl: IMG('photo-1564013799919-ab600027ffc6'),
    children: [
      { slug: 'cleaning',               name: 'Cleaning',                 icon: '🧹', imageUrl: IMG('photo-1581578731548-c64695cc6952') },
      { slug: 'fumigation',             name: 'Fumigation',               icon: '🪳', imageUrl: IMG('photo-1558618666-fcd25c85cd64') },
      { slug: 'plumbing',               name: 'Plumbing',                 icon: '🚰', imageUrl: IMG('photo-1607472586893-edb57bdc0e39') },
      { slug: 'electrical',             name: 'Electrical',               icon: '⚡', imageUrl: IMG('photo-1621905252507-b35492cc74b4') },
      { slug: 'painting',               name: 'Painting',                 icon: '🎨', imageUrl: IMG('photo-1562259949-e8e7689d7828') },
      { slug: 'carpentry',              name: 'Carpentry',                icon: '🪚', imageUrl: IMG('photo-1530124566582-a618bc2615dc') },
      { slug: 'furniture',              name: 'Furniture',                icon: '🪑', imageUrl: IMG('photo-1555041469-a586c61ea9bc') },
      { slug: 'welding',                name: 'Welding',                  icon: '🔩', imageUrl: IMG('photo-1504917595217-d4dc5ebe6122') },
      { slug: 'tiling',                 name: 'Tiling',                   icon: '🧱', imageUrl: IMG('photo-1600566753190-17f0baa2a6c3') },
      { slug: 'masonry',                name: 'Masonry',                  icon: '🏗️', imageUrl: IMG('photo-1504307651254-35680f356dfd') },
      { slug: 'roofing',                name: 'Roofing',                  icon: '🏚️', imageUrl: IMG('photo-1632759145351-1d592919f522') },
      { slug: 'pop-ceiling',            name: 'POP / Ceiling',            icon: '🏛️', imageUrl: IMG('photo-1600210492486-724fe5c67fb0') },
      { slug: 'generator-services',     name: 'Generator Services',       icon: '⚙️', imageUrl: IMG('photo-1473341304170-971dccb5ac1e') },
      { slug: 'ac-installation-repair', name: 'AC Installation / Repair', icon: '❄️', imageUrl: IMG('photo-1631545806609-3e2c2f6a0b1e') },
      { slug: 'home-maintenance',       name: 'Home Maintenance',         icon: '🔨', imageUrl: IMG('photo-1581783898377-1c85bf937427') },
    ],
  },
  {
    slug: 'personal', name: 'Personal', icon: '👤', imageUrl: IMG('photo-1517841905240-472988babdf9'),
    children: [
      { slug: 'barbing',           name: 'Barbing',           icon: '💈', imageUrl: IMG('photo-1503951914875-452162b0f3f1') },
      { slug: 'hair-styling',      name: 'Hair Styling',      icon: '💇', imageUrl: IMG('photo-1560066984-138dadb4c035') },
      { slug: 'makeup',            name: 'Makeup',            icon: '💄', imageUrl: IMG('photo-1487412912498-0447578fcca8') },
      { slug: 'tailoring',         name: 'Tailoring',         icon: '🧵', imageUrl: IMG('photo-1598032895397-b9472444bf93') },
      { slug: 'personal-services', name: 'Personal Services', icon: '✨', imageUrl: IMG('photo-1544161515-4ab6ce6db874') },
    ],
  },
  {
    slug: 'automotive', name: 'Automotive', icon: '🚗', imageUrl: IMG('photo-1487754180451-c456f719a1fc'),
    children: [
      { slug: 'mechanics',       name: 'Mechanics',       icon: '🔧', imageUrl: IMG('photo-1486006920555-c77dcf18193c') },
      { slug: 'auto-electrical', name: 'Auto Electrical', icon: '🔌', imageUrl: IMG('photo-1492144534655-ae79c964c9d7') },
      { slug: 'car-washing',     name: 'Car Washing',     icon: '🚿', imageUrl: IMG('photo-1520340356584-f9917d1eea6f') },
      { slug: 'car-detailing',   name: 'Car Detailing',   icon: '✨', imageUrl: IMG('photo-1607860108855-64acf2078ed9') },
      { slug: 'towing',          name: 'Towing',          icon: '🚛', imageUrl: IMG('photo-1592833159155-c62df1b65634') },
      { slug: 'tire-services',   name: 'Tire Services',   icon: '🛞', imageUrl: IMG('photo-1558981806-ec527fa84c39') },
    ],
  },
  {
    slug: 'technology', name: 'Technology', icon: '💻', imageUrl: IMG('photo-1497366754035-f200968a6e72'),
    children: [
      { slug: 'website-design',  name: 'Website Design',  icon: '🌐', imageUrl: IMG('photo-1547658719-da2b51169166') },
      { slug: 'graphic-design',  name: 'Graphic Design',  icon: '🎨', imageUrl: IMG('photo-1561070791-2526d30994b5') },
      { slug: 'computer-repair', name: 'Computer Repair', icon: '💻', imageUrl: IMG('photo-1593642632559-0c6d3fc62b89') },
      { slug: 'phone-repair',    name: 'Phone Repair',    icon: '📱', imageUrl: IMG('photo-1605236453806-6ff36851218e') },
      { slug: 'it-support',      name: 'IT Support',      icon: '🖥️', imageUrl: IMG('photo-1558494949-ef010cbdcc31') },
      { slug: 'hosting-setup',   name: 'Hosting / Setup', icon: '☁️', imageUrl: IMG('photo-1558494949-ef010cbdcc31') },
    ],
  },
  {
    slug: 'events', name: 'Events', icon: '🎉', imageUrl: IMG('photo-1519167758481-83f550bb49b3'),
    children: [
      { slug: 'catering',       name: 'Catering',       icon: '🍽️', imageUrl: IMG('photo-1555244162-803834f70033') },
      { slug: 'photography',    name: 'Photography',    icon: '📷', imageUrl: IMG('photo-1452780212940-6f5c0d14d848') },
      { slug: 'videography',    name: 'Videography',    icon: '🎥', imageUrl: IMG('photo-1492619375914-88005aa9e8fb') },
      { slug: 'decoration',     name: 'Decoration',     icon: '🎈', imageUrl: IMG('photo-1519225421980-715cb0215aed') },
      { slug: 'dj',             name: 'DJ',             icon: '🎧', imageUrl: IMG('photo-1571266028243-d220c9c3bde2') },
      { slug: 'event-planning', name: 'Event Planning', icon: '📋', imageUrl: IMG('photo-1507504031003-b417219a0fde') },
    ],
  },
];

export async function seedCategories(db: PrismaClient) {
  for (const [i, parent] of TREE.entries()) {
    const p = await db.serviceCategory.upsert({
      where: { slug: parent.slug },
      update: { name: parent.name, icon: parent.icon, imageUrl: parent.imageUrl, sortOrder: i, isActive: true },
      create: { slug: parent.slug, name: parent.name, icon: parent.icon, imageUrl: parent.imageUrl, sortOrder: i, isActive: true },
    });
    for (const [j, child] of (parent.children ?? []).entries()) {
      await db.serviceCategory.upsert({
        where: { slug: child.slug },
        update: { name: child.name, icon: child.icon, imageUrl: child.imageUrl, parentId: p.id, sortOrder: j, isActive: true },
        create: { slug: child.slug, name: child.name, icon: child.icon, imageUrl: child.imageUrl, parentId: p.id, sortOrder: j, isActive: true },
      });
    }
  }
}
