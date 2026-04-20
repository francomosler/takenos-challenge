import chai, { should } from 'chai';
import chaiHttp from 'chai-http';
import app from '../app.js';
import { prisma } from '../prisma/lib/prisma.js';

chai.use(chaiHttp);
should();

const TEAMS = [
  'Real Madrid', 'Barcelona', 'Manchester City', 'Bayern Munich', 'Paris Saint-Germain',
  'Liverpool', 'Chelsea', 'Inter Milan', 'AC Milan', 'Juventus',
  'Atletico Madrid', 'Borussia Dortmund', 'Arsenal', 'Tottenham', 'Manchester United',
  'Napoli', 'AS Roma', 'Sevilla', 'Benfica', 'Porto',
  'Ajax', 'PSV Eindhoven', 'Celtic', 'Rangers', 'Shakhtar Donetsk',
  'Dynamo Kyiv', 'Red Bull Salzburg', 'RB Leipzig', 'Atalanta', 'Lazio',
  'Villarreal', 'Real Sociedad', 'Feyenoord', 'Galatasaray', 'Olympiacos',
  'Copenhagen'
];

describe('Champions League Draw API', () => {
  beforeEach(async () => {
    // Reset database completely
    // Delete in correct order to avoid FK constraints
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM Match`);
      await prisma.$executeRawUnsafe(`DELETE FROM DrawTeamPot`);
      await prisma.$executeRawUnsafe(`DELETE FROM Draw`);
      // Reset SQLite autoincrement counters
      await prisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence WHERE name IN ('Match', 'Draw')`);
    } catch (e) {
      // Tables might not exist or be empty
    }
  });

  after(async () => {
    await prisma.$disconnect();
  });

  describe('POST /draw', () => {
    it('should create the draw successfully on first call', async () => {
      const response = await chai.request(app)
        .post('/draw')
        .send();

      response.should.have.status(201);
      response.body.should.have.property('message').eql('Draw created successfully');
    });

    it('should return 409 if draw already exists', async () => {
      await chai.request(app)
        .post('/draw')
        .send();

      const response = await chai.request(app)
        .post('/draw')
        .send();

      response.should.have.status(409);
      response.text.should.eql('Draw already exists');
    });

    it('should generate exactly 144 matches', async () => {
      await chai.request(app)
        .post('/draw')
        .send();

      const response = await chai.request(app)
        .get('/matches')
        .query({ limit: 100 });

      response.should.have.status(200);
      response.body.pagination.total.should.eql(144);
    });

    it('should ensure each team plays exactly 8 matches', async () => {
      await chai.request(app)
        .post('/draw')
        .send();

      // Get all teams from database to check their actual IDs
      const teams = await prisma.team.findMany({
        orderBy: { id: 'asc' },
      });

      teams.should.have.length(36, 'Should have exactly 36 teams');

      // Check for each team
      for (const team of teams) {
        const response = await chai.request(app)
          .get('/matches')
          .query({ teamId: team.id, limit: 100 });

        response.should.have.status(200);
        response.body.pagination.total.should.eql(8, `Team ${team.id} (${team.name}) should have exactly 8 matches`);
      }
    });

    it('should ensure each team has 4 home and 4 away matches', async () => {
      await chai.request(app)
        .post('/draw')
        .send();

      // Get all teams from database to check their actual IDs
      const teams = await prisma.team.findMany({
        orderBy: { id: 'asc' },
      });

      // Check home/away balance for each team
      for (const team of teams) {
        const response = await chai.request(app)
          .get('/matches')
          .query({ teamId: team.id, limit: 100 });

        response.should.have.status(200);
        const matches = response.body.matches;

        const homeMatches = matches.filter((m: any) => m.homeTeam.id === team.id).length;
        const awayMatches = matches.filter((m: any) => m.awayTeam.id === team.id).length;

        homeMatches.should.eql(4, `Team ${team.id} (${team.name}) should have 4 home matches`);
        awayMatches.should.eql(4, `Team ${team.id} (${team.name}) should have 4 away matches`);
      }
    });

    it('should ensure no team plays the same opponent twice', async () => {
      await chai.request(app)
        .post('/draw')
        .send();

      // Get all teams from database to check their actual IDs
      const teams = await prisma.team.findMany({
        orderBy: { id: 'asc' },
      });

      for (const team of teams) {
        const response = await chai.request(app)
          .get('/matches')
          .query({ teamId: team.id, limit: 100 });

        const matches = response.body.matches;
        const opponents = new Set<number>();

        matches.forEach((match: any) => {
          const opponentId = match.homeTeam.id === team.id ? match.awayTeam.id : match.homeTeam.id;
          if (opponents.has(opponentId)) {
            throw new Error(`Team ${team.id} (${team.name}) plays opponent ${opponentId} more than once`);
          }
          opponents.add(opponentId);
        });

        opponents.size.should.eql(8, `Team ${team.id} (${team.name}) should play against 8 different opponents`);
      }
    });

    it('should distribute matches across 8 match days', async () => {
      await chai.request(app)
        .post('/draw')
        .send();

      // Check each match day has matches
      for (let matchDay = 1; matchDay <= 8; matchDay++) {
        const response = await chai.request(app)
          .get('/matches')
          .query({ matchDay, limit: 100 });

        response.should.have.status(200);
        response.body.pagination.total.should.be.greaterThan(0, `Match day ${matchDay} should have matches`);
      }
    });

    it('should ensure each team plays once per match day', async () => {
      await chai.request(app)
        .post('/draw')
        .send();

      // Get all teams from database to check their actual IDs
      const teams = await prisma.team.findMany({
        orderBy: { id: 'asc' },
      });

      for (const team of teams) {
        const response = await chai.request(app)
          .get('/matches')
          .query({ teamId: team.id, limit: 100 });

        const matches = response.body.matches;
        const matchDays = matches.map((m: any) => m.matchDay);

        // Each team should have one match per match day
        const uniqueMatchDays = new Set(matchDays);
        uniqueMatchDays.size.should.eql(8, `Team ${team.id} (${team.name}) should play on 8 different match days`);

        // Verify no duplicate match days
        matchDays.length.should.eql(uniqueMatchDays.size, `Team ${team.id} (${team.name}) should not play multiple matches on same day`);
      }
    });

    it('should respect confederation constraints (no same country)', async () => {
      await chai.request(app)
        .post('/draw')
        .send();

      // Get all teams with their countries
      const teams = await prisma.team.findMany({
        include: { country: true }
      });

      // Get matches in two pages since limit is max 100
      const [page1, page2] = await Promise.all([
        chai.request(app).get('/matches').query({ limit: 100, page: 1 }),
        chai.request(app).get('/matches').query({ limit: 100, page: 2 })
      ]);

      const matches = [...page1.body.matches, ...page2.body.matches];

      // Check each match respects country constraints
      matches.forEach((match: any) => {
        const homeTeam = teams.find(t => t.id === match.homeTeam.id);
        const awayTeam = teams.find(t => t.id === match.awayTeam.id);

        if (homeTeam && awayTeam && homeTeam.countryId && awayTeam.countryId) {
          homeTeam.countryId.should.not.eql(awayTeam.countryId,
            `Match ${match.id}: Teams from same country should not play (${homeTeam.name} vs ${awayTeam.name})`
          );
        }
      });
    });

    it('should limit each team to max 2 opponents from same confederation', async () => {
      await chai.request(app)
        .post('/draw')
        .send();

      // Get all teams with their countries
      const teams = await prisma.team.findMany({
        include: { country: true }
      });

      for (let teamId = 1; teamId <= 36; teamId++) {
        const response = await chai.request(app)
          .get('/matches')
          .query({ teamId, limit: 100 });

        const matches = response.body.matches;
        const team = teams.find(t => t.id === teamId);

        if (!team) continue;

        // Count opponents by country
        const opponentCountries = new Map<number, number>();

        matches.forEach((match: any) => {
          const opponentId = match.homeTeamId === teamId ? match.awayTeamId : match.homeTeamId;
          const opponent = teams.find(t => t.id === opponentId);

          if (opponent && opponent.countryId && team.countryId && opponent.countryId !== team.countryId) {
            const count = opponentCountries.get(opponent.countryId) || 0;
            opponentCountries.set(opponent.countryId, count + 1);
          }
        });

        // Verify no country has more than 2 opponents
        opponentCountries.forEach((count, countryId) => {
          count.should.be.at.most(2,
            `Team ${teamId} (${team.name}) should not face more than 2 teams from country ${countryId}`
          );
        });
      }
    });
  });

  describe('GET /matches', () => {
    beforeEach(async () => {
      await chai.request(app)
        .post('/draw')
        .send();
    });

    it('should return matches with pagination', async () => {
      const response = await chai.request(app)
        .get('/matches')
        .query({ page: 1, limit: 10 });
      
      response.should.have.status(200);
      response.body.should.have.property('matches').that.is.an('array');
      response.body.should.have.property('pagination');
      response.body.pagination.should.have.property('page').eql(1);
      response.body.pagination.should.have.property('limit').eql(10);
      response.body.pagination.should.have.property('total').that.is.a('number');
      response.body.pagination.should.have.property('totalPages').that.is.a('number');
      response.body.matches.should.have.length(10);
    });

    it('should return matches with id field', async () => {
      const response = await chai.request(app)
        .get('/matches')
        .query({ limit: 5 });
      
      response.should.have.status(200);
      response.body.matches.should.be.an('array');
      response.body.matches.forEach((match: any) => {
        match.should.have.property('id');
      });
    });

    it('should filter matches by teamId', async () => {
      const teamId = 1;
      const response = await chai.request(app)
        .get('/matches')
        .query({ teamId });
      
      response.should.have.status(200);
      response.body.matches.should.be.an('array');
      response.body.pagination.should.have.property('total').that.is.a('number');
    });

    it('should filter matches by matchDay', async () => {
      const matchDay = 1;
      const response = await chai.request(app)
        .get('/matches')
        .query({ matchDay });
      
      response.should.have.status(200);
      response.body.matches.should.be.an('array');
      response.body.pagination.should.have.property('total').that.is.a('number');
    });

    it('should filter matches by both teamId and matchDay', async () => {
      const teamId = 1;
      const matchDay = 1;
      const response = await chai.request(app)
        .get('/matches')
        .query({ teamId, matchDay });
      
      response.should.have.status(200);
      response.body.matches.should.be.an('array');
      response.body.pagination.should.have.property('total').that.is.a('number');
    });

    it('should return empty array when no matches match filter', async () => {
      const response = await chai.request(app)
        .get('/matches')
        .query({ teamId: 999 });
      
      response.should.have.status(200);
      response.body.matches.should.have.length(0);
      response.body.pagination.total.should.eql(0);
      response.body.pagination.totalPages.should.eql(0);
    });

    it('should handle pagination correctly', async () => {
      const response1 = await chai.request(app)
        .get('/matches')
        .query({ page: 1, limit: 20 });
      
      const response2 = await chai.request(app)
        .get('/matches')
        .query({ page: 2, limit: 20 });
      
      response1.should.have.status(200);
      response2.should.have.status(200);
      
      response1.body.matches.should.be.an('array');
      response2.body.matches.should.be.an('array');
      
      // Ensure no duplicates
      const ids1 = response1.body.matches.map((m: any) => m.id);
      const ids2 = response2.body.matches.map((m: any) => m.id);
      ids1.forEach((id: any) => {
        ids2.includes(id).should.be.false;
      });
    });

    it('should use default pagination when not provided', async () => {
      const response = await chai.request(app)
        .get('/matches');
      
      response.should.have.status(200);
      response.body.pagination.page.should.eql(1);
      response.body.pagination.limit.should.eql(10);
    });

    it('should return 400 for invalid page number', async () => {
      const response = await chai.request(app)
        .get('/matches')
        .query({ page: 0 });
      
      response.should.have.status(400);
    });

    it('should return 400 for negative page number', async () => {
      const response = await chai.request(app)
        .get('/matches')
        .query({ page: -1 });
      
      response.should.have.status(400);
    });

    it('should return 400 for limit greater than 100', async () => {
      const response = await chai.request(app)
        .get('/matches')
        .query({ limit: 101 });
      
      response.should.have.status(400);
    });

    it('should return 400 for negative limit', async () => {
      const response = await chai.request(app)
        .get('/matches')
        .query({ limit: -1 });
      
      response.should.have.status(400);
    });
  });

  describe('GET /matches without draw', () => {
    it('should return empty array when no draw exists', async () => {
      const response = await chai.request(app)
        .get('/matches');

      response.should.have.status(200);
      response.body.matches.should.have.length(0);
      response.body.pagination.total.should.eql(0);
      response.body.pagination.totalPages.should.eql(0);
    });
  });

  describe('Draw Algorithm Robustness', () => {
    it('should consistently generate valid draws on multiple attempts', async () => {
      // Test that the algorithm is deterministic and robust
      for (let attempt = 1; attempt <= 3; attempt++) {
        // Clean up before each attempt
        await prisma.$executeRawUnsafe(`DELETE FROM Match`);
        await prisma.$executeRawUnsafe(`DELETE FROM DrawTeamPot`);
        await prisma.$executeRawUnsafe(`DELETE FROM Draw`);

        const response = await chai.request(app)
          .post('/draw')
          .send();

        response.should.have.status(201);

        // Verify 144 matches were created
        const matchesResponse = await chai.request(app)
          .get('/matches')
          .query({ limit: 100 });

        matchesResponse.body.pagination.total.should.eql(144,
          `Attempt ${attempt}: Should generate exactly 144 matches`
        );
      }
    });

    it('should not have any duplicate matches', async () => {
      await chai.request(app)
        .post('/draw')
        .send();

      // Get all matches in two pages
      const [page1, page2] = await Promise.all([
        chai.request(app).get('/matches').query({ limit: 100, page: 1 }),
        chai.request(app).get('/matches').query({ limit: 100, page: 2 })
      ]);

      const matches = [...page1.body.matches, ...page2.body.matches];
      const matchKeys = new Set<string>();

      matches.forEach((match: any) => {
        // Create a normalized key (always smaller ID first)
        const team1 = Math.min(match.homeTeam.id, match.awayTeam.id);
        const team2 = Math.max(match.homeTeam.id, match.awayTeam.id);
        const key = `${team1}-${team2}`;

        if (matchKeys.has(key)) {
          throw new Error(`Duplicate match found: Team ${team1} vs Team ${team2}`);
        }
        matchKeys.add(key);
      });

      matchKeys.size.should.eql(144, 'Should have 144 unique matches');
    });

    it('should have valid match day distribution (18 matches per day)', async () => {
      await chai.request(app)
        .post('/draw')
        .send();

      // Each match day should have exactly 18 matches (36 teams / 2)
      for (let matchDay = 1; matchDay <= 8; matchDay++) {
        const response = await chai.request(app)
          .get('/matches')
          .query({ matchDay, limit: 100 });

        response.should.have.status(200);
        response.body.pagination.total.should.eql(18,
          `Match day ${matchDay} should have exactly 18 matches (36 teams / 2)`
        );
      }
    });
  });

  describe('Validation Edge Cases', () => {
    it('should return 400 for invalid matchDay (0)', async () => {
      const response = await chai.request(app)
        .get('/matches')
        .query({ matchDay: 0 });

      response.should.have.status(400);
    });

    it('should return 400 for invalid matchDay (9)', async () => {
      const response = await chai.request(app)
        .get('/matches')
        .query({ matchDay: 9 });

      response.should.have.status(400);
    });

    it('should return 400 for invalid matchDay (-1)', async () => {
      const response = await chai.request(app)
        .get('/matches')
        .query({ matchDay: -1 });

      response.should.have.status(400);
    });

    it('should handle page beyond total pages gracefully', async () => {
      await chai.request(app)
        .post('/draw')
        .send();

      const response = await chai.request(app)
        .get('/matches')
        .query({ page: 1000, limit: 10 });

      response.should.have.status(200);
      response.body.matches.should.be.an('array');
      response.body.matches.should.have.length(0);
    });

    it('should return 400 for limit of 0', async () => {
      const response = await chai.request(app)
        .get('/matches')
        .query({ limit: 0 });

      response.should.have.status(400);
    });

    it('should return appropriate response for non-existent teamId', async () => {
      await chai.request(app)
        .post('/draw')
        .send();

      const response = await chai.request(app)
        .get('/matches')
        .query({ teamId: 999 });

      response.should.have.status(200);
      response.body.matches.should.have.length(0);
      response.body.pagination.total.should.eql(0);
    });
  });

  describe('GET /draw', () => {
    it('should return 404 when no draw exists', async () => {
      const response = await chai.request(app)
        .get('/draw');

      response.should.have.status(404);
    });

    it('should return draw details after creation', async () => {
      await chai.request(app)
        .post('/draw')
        .send();

      const response = await chai.request(app)
        .get('/draw');

      response.should.have.status(200);
      response.body.should.have.property('id');
      response.body.should.have.property('createdAt');
    });
  });

  describe('DELETE /draw', () => {
    it('should delete the current draw successfully', async () => {
      // First create a draw
      await chai.request(app)
        .post('/draw')
        .send();

      // Then delete it
      const deleteResponse = await chai.request(app)
        .delete('/draw')
        .send();

      deleteResponse.should.have.status(200);
      deleteResponse.body.should.have.property('message');

      // Verify draw no longer exists
      const getResponse = await chai.request(app)
        .get('/draw');

      getResponse.should.have.status(404);
    });

    it('should return 404 when trying to delete non-existent draw', async () => {
      const response = await chai.request(app)
        .delete('/draw')
        .send();

      response.should.have.status(404);
      response.body.should.have.property('message');
    });
  });

  describe('GET /health', () => {
    it('should return 200 with health status', async () => {
      const response = await chai.request(app)
        .get('/health')
        .send();

      response.should.have.status(200);
      response.body.should.have.property('status');
      response.body.status.should.equal('ok');
    });

    it('should include service information', async () => {
      const response = await chai.request(app)
        .get('/health')
        .send();

      response.should.have.status(200);
      response.body.should.have.property('service');
      response.body.should.have.property('timestamp');
    });
  });
});
