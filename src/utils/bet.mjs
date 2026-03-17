export const DEFAULT_TITLE = '\u660e\u5929\u4f1a\u4e0b\u96e8\u5417?';

export const DEFAULT_POSITIVE_BETS = [
  { name: '\u5c0f\u660e', amount: 50, paid: true, settlementAmount: 0, settlementStatus: 'pending' },
  { name: '\u5c0f\u7ea2', amount: 30, paid: false, settlementAmount: 0, settlementStatus: 'pending' }
];

export const DEFAULT_NEGATIVE_BETS = [
  { name: '\u5c0f\u674e', amount: 100, paid: true, settlementAmount: 0, settlementStatus: 'pending' }
];

export const GAME_STATUS = {
  draft: 'draft',
  locked: 'locked',
  settled: 'settled',
  archived: 'archived'
};

export const GAME_RESULT = {
  pending: 'pending',
  positive: 'positive',
  negative: 'negative',
  draw: 'draw'
};

export const STORAGE_KEYS = {
  title: 'bet_title',
  positive: 'bet_positive',
  negative: 'bet_negative',
  games: 'bet_games',
  activeGameId: 'bet_active_game_id'
};

export function sanitizeName(value) {
  return String(value ?? '').trim();
}

export function sanitizeAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Number(amount.toFixed(2));
}

export function normalizeSettlementStatus(value) {
  const status = sanitizeName(value);
  if (['pending', 'won', 'lost', 'refund'].includes(status)) {
    return status;
  }
  return 'pending';
}

export function normalizeBet(item) {
  const name = sanitizeName(item?.name);
  const amount = sanitizeAmount(item?.amount);

  if (!name || amount <= 0) {
    return null;
  }

  return {
    name,
    amount,
    paid: Boolean(item?.paid),
    settlementAmount: Number(Number(item?.settlementAmount || 0).toFixed(2)),
    settlementStatus: normalizeSettlementStatus(item?.settlementStatus)
  };
}

export function normalizeBetList(list, fallback = []) {
  if (!Array.isArray(list)) {
    return [...fallback];
  }

  const normalized = list
    .map(normalizeBet)
    .filter(Boolean);

  if (normalized.length || list.length === 0) {
    return normalized;
  }

  return [...fallback];
}

export function parseStoredBetList(rawValue, fallback = []) {
  if (!rawValue) {
    return [...fallback];
  }

  try {
    return normalizeBetList(JSON.parse(rawValue), fallback);
  } catch (error) {
    return [...fallback];
  }
}

export function calculateTotal(list) {
  return normalizeBetList(list).reduce((sum, item) => sum + item.amount, 0);
}

export function calculateOdds(sideTotal, poolTotal) {
  if (sideTotal <= 0 || poolTotal <= 0) {
    return 0;
  }

  return Number((poolTotal / sideTotal).toFixed(2));
}

export function calculatePayout(amount, odds) {
  return Number((sanitizeAmount(amount) * Number(odds || 0)).toFixed(2));
}

export function createGameId() {
  return `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultGame(overrides = {}) {
  const now = Date.now();
  return {
    id: createGameId(),
    title: DEFAULT_TITLE,
    status: GAME_STATUS.draft,
    result: GAME_RESULT.pending,
    positiveBets: [...DEFAULT_POSITIVE_BETS],
    negativeBets: [...DEFAULT_NEGATIVE_BETS],
    createdAt: now,
    updatedAt: now,
    lockedAt: null,
    settledAt: null,
    archivedAt: null,
    ...overrides
  };
}

export function normalizeGameStatus(value) {
  const status = sanitizeName(value);
  if (Object.values(GAME_STATUS).includes(status)) {
    return status;
  }
  return GAME_STATUS.draft;
}

export function normalizeGameResult(value) {
  const result = sanitizeName(value);
  if (Object.values(GAME_RESULT).includes(result)) {
    return result;
  }
  return GAME_RESULT.pending;
}

export function normalizeGame(game, fallbackGame = createDefaultGame()) {
  const id = sanitizeName(game?.id) || fallbackGame.id;
  const title = sanitizeName(game?.title) || DEFAULT_TITLE;
  const positiveBets = normalizeBetList(game?.positiveBets, fallbackGame.positiveBets || DEFAULT_POSITIVE_BETS);
  const negativeBets = normalizeBetList(game?.negativeBets, fallbackGame.negativeBets || DEFAULT_NEGATIVE_BETS);
  const createdAt = Number.isFinite(Number(game?.createdAt)) ? Number(game.createdAt) : Date.now();
  const updatedAt = Number.isFinite(Number(game?.updatedAt)) ? Number(game.updatedAt) : Date.now();
  const lockedAt = game?.lockedAt ? Number(game.lockedAt) : null;
  const settledAt = game?.settledAt ? Number(game.settledAt) : null;
  const archivedAt = game?.archivedAt ? Number(game.archivedAt) : null;

  return {
    id,
    title,
    status: normalizeGameStatus(game?.status),
    result: normalizeGameResult(game?.result),
    positiveBets,
    negativeBets,
    createdAt,
    updatedAt,
    lockedAt,
    settledAt,
    archivedAt
  };
}

export function normalizeGameList(list, fallback = [createDefaultGame()]) {
  if (!Array.isArray(list)) {
    return [...fallback];
  }

  const normalized = list.map((item, index) => normalizeGame(item, fallback[index] || createDefaultGame())).filter(Boolean);

  return normalized.length ? normalized : [...fallback];
}

export function parseStoredGameList(rawValue, fallback = [createDefaultGame()]) {
  if (!rawValue) {
    return [...fallback];
  }

  try {
    return normalizeGameList(JSON.parse(rawValue), fallback);
  } catch (error) {
    return [...fallback];
  }
}

export function resolveActiveGameId(games, activeGameId) {
  const normalizedId = sanitizeName(activeGameId);

  if (normalizedId && games.some((game) => game.id === normalizedId)) {
    return normalizedId;
  }

  return games[0]?.id || '';
}

export function migrateLegacyGame(titleRaw, positiveRaw, negativeRaw) {
  const title = sanitizeName(titleRaw) || DEFAULT_TITLE;
  const positiveBets = parseStoredBetList(positiveRaw, DEFAULT_POSITIVE_BETS);
  const negativeBets = parseStoredBetList(negativeRaw, DEFAULT_NEGATIVE_BETS);

  return createDefaultGame({
    title,
    positiveBets,
    negativeBets,
    updatedAt: Date.now()
  });
}

export function canEditGame(game) {
  const status = normalizeGameStatus(game?.status);
  return status === GAME_STATUS.draft;
}

export function canSettleGame(game) {
  const status = normalizeGameStatus(game?.status);
  return status === GAME_STATUS.locked;
}

export function canArchiveGame(game) {
  const status = normalizeGameStatus(game?.status);
  return status === GAME_STATUS.settled;
}

export function lockGame(game) {
  const normalizedGame = normalizeGame(game);
  if (normalizedGame.status !== GAME_STATUS.draft) {
    return normalizedGame;
  }

  const now = Date.now();
  return {
    ...normalizedGame,
    status: GAME_STATUS.locked,
    updatedAt: now,
    lockedAt: now
  };
}

export function settleBetList(list, odds, outcome) {
  return normalizeBetList(list).map((bet) => {
    if (outcome === 'won') {
      return {
        ...bet,
        settlementAmount: calculatePayout(bet.amount, odds),
        settlementStatus: 'won'
      };
    }

    if (outcome === 'refund') {
      return {
        ...bet,
        settlementAmount: Number(bet.amount.toFixed(2)),
        settlementStatus: 'refund'
      };
    }

    return {
      ...bet,
      settlementAmount: 0,
      settlementStatus: 'lost'
    };
  });
}

export function settleGame(game, result) {
  const normalizedGame = normalizeGame(game);
  const normalizedResult = normalizeGameResult(result);

  if (normalizedGame.status !== GAME_STATUS.locked || normalizedResult === GAME_RESULT.pending) {
    return normalizedGame;
  }

  const positiveTotal = calculateTotal(normalizedGame.positiveBets);
  const negativeTotal = calculateTotal(normalizedGame.negativeBets);
  const totalPool = positiveTotal + negativeTotal;
  const positiveOdds = calculateOdds(positiveTotal, totalPool);
  const negativeOdds = calculateOdds(negativeTotal, totalPool);
  const now = Date.now();

  let nextPositiveBets = normalizedGame.positiveBets;
  let nextNegativeBets = normalizedGame.negativeBets;

  if (normalizedResult === GAME_RESULT.positive) {
    nextPositiveBets = settleBetList(normalizedGame.positiveBets, positiveOdds, 'won');
    nextNegativeBets = settleBetList(normalizedGame.negativeBets, negativeOdds, 'lost');
  } else if (normalizedResult === GAME_RESULT.negative) {
    nextPositiveBets = settleBetList(normalizedGame.positiveBets, positiveOdds, 'lost');
    nextNegativeBets = settleBetList(normalizedGame.negativeBets, negativeOdds, 'won');
  } else if (normalizedResult === GAME_RESULT.draw) {
    nextPositiveBets = settleBetList(normalizedGame.positiveBets, positiveOdds, 'refund');
    nextNegativeBets = settleBetList(normalizedGame.negativeBets, negativeOdds, 'refund');
  }

  return {
    ...normalizedGame,
    result: normalizedResult,
    status: GAME_STATUS.settled,
    positiveBets: nextPositiveBets,
    negativeBets: nextNegativeBets,
    settledAt: now,
    updatedAt: now
  };
}

export function archiveGame(game) {
  const normalizedGame = normalizeGame(game);
  if (normalizedGame.status !== GAME_STATUS.settled) {
    return normalizedGame;
  }

  const now = Date.now();
  return {
    ...normalizedGame,
    status: GAME_STATUS.archived,
    archivedAt: now,
    updatedAt: now
  };
}
