import { PrismaClient } from "@prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

interface Country {
  name: string;
}

interface Team {
  name: string;
  country: string;
}

const countries: Country[] = [
  { name: "Spain" },
  { name: "England" },
  { name: "Germany" },
  { name: "France" },
  { name: "Italy" },
  { name: "Portugal" },
  { name: "Netherlands" },
  { name: "Belgium" },
  { name: "Greece" },
  { name: "Czech Republic" },
  { name: "Norway" },
  { name: "Denmark" },
  { name: "Turkey" },
  { name: "Azerbaijan" },
  { name: "Cyprus" },
  { name: "Kazakhstan" },
];

const teams: Team[] = [
  // Pot 1
  { name: "Paris Saint-Germain", country: "France" },
  { name: "Real Madrid", country: "Spain" },
  { name: "Manchester City", country: "England" },
  { name: "Bayern München", country: "Germany" },
  { name: "Liverpool", country: "England" },
  { name: "Inter", country: "Italy" },
  { name: "Chelsea", country: "England" },
  { name: "Borussia Dortmund", country: "Germany" },
  { name: "Barcelona", country: "Spain" },

  // Pot 2
  { name: "Arsenal", country: "England" },
  { name: "Bayer Leverkusen", country: "Germany" },
  { name: "Atletico Madrid", country: "Spain" },
  { name: "Benfica", country: "Portugal" },
  { name: "Atalanta", country: "Italy" },
  { name: "Villarreal", country: "Spain" },
  { name: "Juventus", country: "Italy" },
  { name: "Eintracht Frankfurt", country: "Germany" },
  { name: "Club Brugge", country: "Belgium" },

  // Pot 3
  { name: "Tottenham Hotspur", country: "England" },
  { name: "PSV Eindhoven", country: "Netherlands" },
  { name: "Ajax", country: "Netherlands" },
  { name: "Napoli", country: "Italy" },
  { name: "Sporting CP", country: "Portugal" },
  { name: "Olympiacos", country: "Greece" },
  { name: "Slavia Praha", country: "Czech Republic" },
  { name: "Bodø/Glimt", country: "Norway" },
  { name: "Marseille", country: "France" },

  // Pot 4
  { name: "FC Copenhagen", country: "Denmark" },
  { name: "AS Monaco", country: "France" },
  { name: "Galatasaray", country: "Turkey" },
  { name: "Union SG", country: "Belgium" },
  { name: "Qarabağ", country: "Azerbaijan" },
  { name: "Athletic Club", country: "Spain" },
  { name: "Newcastle United", country: "England" },
  { name: "Pafos", country: "Cyprus" },
  { name: "Kairat Almaty", country: "Kazakhstan" },
];

async function seed() {
  console.log("Starting seed...");

  try {
    // Clean existing data
    console.log("Cleaning existing data...");
    await prisma.match.deleteMany({});
    await prisma.drawTeamPot.deleteMany({});
    await prisma.pot.deleteMany({});
    await prisma.draw.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.country.deleteMany({});

    // Seed countries
    console.log("Seeding countries...");
    for (const country of countries) {
      await prisma.country.create({
        data: country,
      });
    }

    // Seed pots
    console.log("Seeding pots...");
    const pots = [
      { id: 1, name: "Pot 1" },
      { id: 2, name: "Pot 2" },
      { id: 3, name: "Pot 3" },
      { id: 4, name: "Pot 4" },
    ];
    for (const pot of pots) {
      await prisma.pot.create({
        data: pot,
      });
    }

    // Seed teams
    console.log("Seeding teams...");
    for (const team of teams) {
      const country = await prisma.country.findUnique({
        where: { name: team.country },
      });

      if (!country) {
        throw new Error(`Country ${team.country} not found`);
      }

      await prisma.team.create({
        data: {
          name: team.name,
          countryId: country.id,
        },
      });
    }

    console.log("Seed completed successfully!");
    console.log(`Created ${countries.length} countries`);
    console.log(`Created ${pots.length} pots`);
    console.log(`Created ${teams.length} teams`);
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
