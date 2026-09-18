import { PrismaClient } from '@prisma/client';

type State = { slug: string; name: string; cities: { slug: string; name: string }[] };

const NIGERIA: State[] = [
  {
    slug: 'enugu', name: 'Enugu',
    cities: [
      { slug: 'enugu-city', name: 'Enugu City' },
      { slug: 'nsukka',     name: 'Nsukka' },
      { slug: 'oji-river',  name: 'Oji River' },
    ],
  },
  {
    slug: 'abuja-fct', name: 'Abuja (FCT)',
    cities: [
      { slug: 'abuja-municipal', name: 'Abuja Municipal' },
      { slug: 'gwagwalada',      name: 'Gwagwalada' },
      { slug: 'kuje',            name: 'Kuje' },
    ],
  },
  {
    slug: 'benue', name: 'Benue',
    cities: [
      { slug: 'makurdi', name: 'Makurdi' },
      { slug: 'gboko',   name: 'Gboko' },
    ],
  },
  {
    slug: 'nasarawa', name: 'Nasarawa',
    cities: [
      { slug: 'lafia', name: 'Lafia' },
      { slug: 'keffi', name: 'Keffi' },
    ],
  },
  {
    slug: 'plateau', name: 'Plateau',
    cities: [
      { slug: 'jos',     name: 'Jos' },
      { slug: 'bukuru',  name: 'Bukuru' },
    ],
  },
  {
    slug: 'kogi', name: 'Kogi',
    cities: [
      { slug: 'lokoja', name: 'Lokoja' },
      { slug: 'okene',  name: 'Okene' },
    ],
  },
];

/** Find-or-create helper. Uses findFirst because the unique key includes a nullable parentId. */
async function findOrCreate(
  db: PrismaClient,
  where: { parentId: string | null; slug: string },
  data:  { parentId: string | null; type: string; name: string; slug: string; isActive: boolean },
) {
  const existing = await db.location.findFirst({ where });
  if (existing) return existing;
  return db.location.create({ data });
}

export async function seedLocations(db: PrismaClient) {
  const nigeria = await findOrCreate(
    db,
    { parentId: null, slug: 'nigeria' },
    { parentId: null, type: 'country', name: 'Nigeria', slug: 'nigeria', isActive: true },
  );

  for (const state of NIGERIA) {
    const s = await findOrCreate(
      db,
      { parentId: nigeria.id, slug: state.slug },
      { parentId: nigeria.id, type: 'state', name: state.name, slug: state.slug, isActive: true },
    );

    for (const city of state.cities) {
      await findOrCreate(
        db,
        { parentId: s.id, slug: city.slug },
        { parentId: s.id, type: 'city', name: city.name, slug: city.slug, isActive: true },
      );
    }
  }
}