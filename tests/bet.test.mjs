import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_NEGATIVE_BETS,
  DEFAULT_POSITIVE_BETS,
  DEFAULT_TITLE,
  GAME_RESULT,
  GAME_STATUS,
  archiveGame,
  calculateOdds,
  calculatePayout,
  calculateTotal,
  canArchiveGame,
  canEditGame,
  createDefaultGame,
  lockGame,
  migrateLegacyGame,
  normalizeBet,
  normalizeBetList,
  normalizeGame,
  parseStoredBetList,
  parseStoredGameList,
  resolveActiveGameId,
  sanitizeAmount,
  sanitizeName,
  settleGame
} from '../src/utils/bet.mjs';

test('default data stays stable', () => {
  assert.equal(DEFAULT_TITLE, '\u660e\u5929\u4f1a\u4e0b\u96e8\u5417?');
  assert.equal(DEFAULT_POSITIVE_BETS.length, 2);
  assert.equal(DEFAULT_NEGATIVE_BETS.length, 1);
});

test('sanitizeName trims safely', () => {
  assert.equal(sanitizeName('  \u5c0f\u660e  '), '\u5c0f\u660e');
  assert.equal(sanitizeName(null), '');
});

test('sanitizeAmount keeps positive finite numbers', () => {
  assert.equal(sanitizeAmount('12.345'), 12.35);
  assert.equal(sanitizeAmount(8), 8);
  assert.equal(sanitizeAmount('0'), 0);
  assert.equal(sanitizeAmount('-1'), 0);
  assert.equal(sanitizeAmount('abc'), 0);
});

test('normalizeBet rejects invalid items', () => {
  assert.equal(normalizeBet({ name: '  ', amount: 10, paid: true }), null);
  assert.equal(normalizeBet({ name: '\u5c0f\u674e', amount: 0, paid: true }), null);
  assert.equal(normalizeBet({ name: ' \u5c0f\u674e ', amount: '15.2', paid: 1 }).name, '\u5c0f\u674e');
});

test('normalizeBetList preserves empty arrays', () => {
  assert.deepEqual(normalizeBetList([], DEFAULT_POSITIVE_BETS), []);
});

test('normalizeBetList falls back when all entries are invalid', () => {
  const fallback = [{ name: '\u5907\u7528', amount: 9, paid: true, settlementAmount: 0, settlementStatus: 'pending' }];
  assert.deepEqual(normalizeBetList([{ name: '', amount: 0, paid: false }], fallback), fallback);
});

test('parseStoredBetList parses valid JSON and falls back on bad JSON', () => {
  const fallback = [{ name: '\u5907\u7528', amount: 9, paid: true, settlementAmount: 0, settlementStatus: 'pending' }];
  const parsed = parseStoredBetList('[{"name":"\u5c0f\u738b","amount":6,"paid":false}]', fallback);
  assert.equal(parsed[0].name, '\u5c0f\u738b');
  assert.deepEqual(parseStoredBetList('bad-json', fallback), fallback);
});

test('calculateTotal sums normalized amounts', () => {
  assert.equal(calculateTotal([
    { name: '\u5c0f\u660e', amount: 10, paid: true },
    { name: '\u5c0f\u7ea2', amount: '20.556', paid: false }
  ]), 30.56);
});

test('calculateOdds handles zero and rounds', () => {
  assert.equal(calculateOdds(0, 100), 0);
  assert.equal(calculateOdds(80, 180), 2.25);
  assert.equal(calculateOdds(100, 180), 1.8);
});

test('calculatePayout rounds with sanitized amount', () => {
  assert.equal(calculatePayout('50', 2.25), 112.5);
  assert.equal(calculatePayout('12.345', 1.8), 22.23);
});

test('createDefaultGame creates a valid game shape', () => {
  const game = createDefaultGame();
  assert.ok(game.id.startsWith('game_'));
  assert.equal(game.title, DEFAULT_TITLE);
  assert.equal(game.status, GAME_STATUS.draft);
  assert.equal(game.result, GAME_RESULT.pending);
});

test('normalizeGame sanitizes title and nested bets', () => {
  const game = normalizeGame({
    id: '  abc ',
    title: '  \u65b0\u8d4c\u5c40 ',
    positiveBets: [{ name: ' A ', amount: '10', paid: 1 }],
    negativeBets: [{ name: '', amount: 0, paid: false }]
  }, createDefaultGame());

  assert.equal(game.id, 'abc');
  assert.equal(game.title, '\u65b0\u8d4c\u5c40');
  assert.equal(game.positiveBets[0].name, 'A');
});

test('parseStoredGameList parses list and falls back on invalid data', () => {
  const fallback = [createDefaultGame({ id: 'fallback' })];
  const parsed = parseStoredGameList('[{"id":"g1","title":"\u5c40 1","positiveBets":[],"negativeBets":[]}]', fallback);
  assert.equal(parsed[0].id, 'g1');
  assert.deepEqual(parseStoredGameList('bad-json', fallback), fallback);
});

test('resolveActiveGameId keeps valid id or falls back to first game', () => {
  const games = [createDefaultGame({ id: 'g1' }), createDefaultGame({ id: 'g2' })];
  assert.equal(resolveActiveGameId(games, 'g2'), 'g2');
  assert.equal(resolveActiveGameId(games, 'missing'), 'g1');
});

test('migrateLegacyGame converts single-game storage into game object', () => {
  const game = migrateLegacyGame(
    '\u65e7\u8d4c\u5c40',
    '[{"name":"\u7532","amount":8,"paid":true}]',
    '[{"name":"\u4e59","amount":9,"paid":false}]'
  );

  assert.equal(game.title, '\u65e7\u8d4c\u5c40');
  assert.equal(game.positiveBets[0].name, '\u7532');
  assert.equal(game.negativeBets[0].name, '\u4e59');
});

test('canEditGame only allows draft games', () => {
  assert.equal(canEditGame({ status: GAME_STATUS.draft }), true);
  assert.equal(canEditGame({ status: GAME_STATUS.locked }), false);
});

test('lockGame updates draft game into locked state', () => {
  const locked = lockGame(createDefaultGame({ status: GAME_STATUS.draft }));
  assert.equal(locked.status, GAME_STATUS.locked);
  assert.ok(locked.lockedAt);
});

test('settleGame marks positive winners correctly', () => {
  const game = lockGame(createDefaultGame({
    positiveBets: [{ name: 'A', amount: 50, paid: true, settlementAmount: 0, settlementStatus: 'pending' }],
    negativeBets: [{ name: 'B', amount: 100, paid: true, settlementAmount: 0, settlementStatus: 'pending' }]
  }));
  const settled = settleGame(game, GAME_RESULT.positive);

  assert.equal(settled.status, GAME_STATUS.settled);
  assert.equal(settled.positiveBets[0].settlementStatus, 'won');
  assert.equal(settled.negativeBets[0].settlementStatus, 'lost');
  assert.equal(settled.positiveBets[0].settlementAmount, 150);
});

test('settleGame marks draw as refund', () => {
  const game = lockGame(createDefaultGame({
    positiveBets: [{ name: 'A', amount: 50, paid: true, settlementAmount: 0, settlementStatus: 'pending' }],
    negativeBets: [{ name: 'B', amount: 100, paid: true, settlementAmount: 0, settlementStatus: 'pending' }]
  }));
  const settled = settleGame(game, GAME_RESULT.draw);

  assert.equal(settled.positiveBets[0].settlementStatus, 'refund');
  assert.equal(settled.negativeBets[0].settlementStatus, 'refund');
  assert.equal(settled.positiveBets[0].settlementAmount, 50);
  assert.equal(settled.negativeBets[0].settlementAmount, 100);
});

test('canArchiveGame only allows settled games', () => {
  assert.equal(canArchiveGame({ status: GAME_STATUS.settled }), true);
  assert.equal(canArchiveGame({ status: GAME_STATUS.locked }), false);
});

test('archiveGame updates settled game into archived state', () => {
  const settled = settleGame(lockGame(createDefaultGame()), GAME_RESULT.draw);
  const archived = archiveGame(settled);

  assert.equal(archived.status, GAME_STATUS.archived);
  assert.ok(archived.archivedAt);
});
