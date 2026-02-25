const fs = require('fs');
const path = require('path');

// ─── Configuration ───────────────────────────────────────────────────────────
const DEFAULT_DB_DIR = path.join(__dirname, '..', '.db');
const STATS_FILE = 'stats.json';

// ─── StatsManager Class ─────────────────────────────────────────────────────
class StatsManager {
  constructor(dbDir) {
    this.dbDir = dbDir || DEFAULT_DB_DIR;
    this.statsFile = path.join(this.dbDir, STATS_FILE);
    this.stats = {};
    this._ensureDir();
    this._load();
  }

  // ─── Public Methods ─────────────────────────────────────────────────────────

  getPlayerStats(nickname) {
    const key = nickname.toLowerCase();
    const entry = this.stats[key];
    if (!entry) {
      return {
        nickname: nickname,
        kills: 0,
        deaths: 0,
        gamesPlayed: 0,
        wins: 0,
        winRate: 0
      };
    }
    return {
      nickname: entry.nickname,
      kills: entry.kills,
      deaths: entry.deaths,
      gamesPlayed: entry.gamesPlayed,
      wins: entry.wins,
      winRate: entry.gamesPlayed > 0 ? entry.wins / entry.gamesPlayed : 0
    };
  }

  recordRoundResults(players, winnerId) {
    for (const player of players) {
      const key = player.nickname.toLowerCase();

      if (!this.stats[key]) {
        this.stats[key] = {
          nickname: player.nickname,
          kills: 0,
          deaths: 0,
          gamesPlayed: 0,
          wins: 0
        };
      }

      const entry = this.stats[key];
      // Update nickname to latest casing
      entry.nickname = player.nickname;
      entry.kills += player.kills || 0;
      entry.deaths += player.deaths || 0;
      entry.gamesPlayed++;

      if (player.id === winnerId) {
        entry.wins++;
      }
    }

    this._save();
  }

  getLeaderboard(limit) {
    if (limit === undefined || limit === null) limit = 20;

    const entries = Object.values(this.stats).map(entry => ({
      nickname: entry.nickname,
      kills: entry.kills,
      deaths: entry.deaths,
      gamesPlayed: entry.gamesPlayed,
      wins: entry.wins,
      winRate: entry.gamesPlayed > 0 ? entry.wins / entry.gamesPlayed : 0
    }));

    // Sort by wins descending, then kills descending
    entries.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.kills - a.kills;
    });

    // Add rank and limit
    return entries.slice(0, limit).map((entry, index) => ({
      rank: index + 1,
      ...entry
    }));
  }

  // ─── Private Methods ────────────────────────────────────────────────────────

  _load() {
    try {
      if (fs.existsSync(this.statsFile)) {
        const raw = fs.readFileSync(this.statsFile, 'utf8');
        if (!raw || raw.trim().length === 0) {
          console.log('stats.json is empty, starting fresh');
          return;
        }
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          this.stats = data;
          console.log('Loaded player stats:', Object.keys(this.stats).length, 'players');
        }
      }
    } catch (e) {
      console.log('Could not load stats.json (' + e.message + '), starting fresh');
      this.stats = {};
    }
  }

  _save() {
    try {
      this._ensureDir();
      fs.writeFileSync(this.statsFile, JSON.stringify(this.stats, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to persist stats to ' + this.statsFile + ':', e.message);
    }
  }

  _ensureDir() {
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
      console.log('Created .db/ directory for stats persistence');
    }
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────
module.exports = { StatsManager };
