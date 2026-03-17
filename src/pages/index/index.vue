<template>
  <view class="container">
    <view class="game-panel">
      <view class="game-summary" hover-class="tap-active" hover-stay-time="70" @tap="showGameManager = !showGameManager">
        <view class="game-summary-main">
          <view class="game-summary-label">{{ TEXT.gameManager }}</view>
          <view class="game-summary-title">{{ title || TEXT.untitledGame }}</view>
        </view>
        <view class="game-summary-side">
          <text class="game-summary-count">{{ filteredGames.length }}/{{ games.length }}</text>
          <text class="game-summary-arrow">{{ showGameManager ? TEXT.collapseSymbol : TEXT.expandSymbol }}</text>
        </view>
      </view>

      <view v-if="showGameManager" class="game-manager-card">
        <scroll-view class="game-scroll" scroll-x enable-flex>
          <view class="game-list">
            <view
              v-for="game in filteredGames"
              :key="game.id"
              class="game-chip"
              :class="{ active: game.id === activeGameId }"
              @tap="switchGame(game.id)"
            >
              <text class="game-chip-text">{{ game.title || TEXT.untitledGame }}</text>
            </view>
          </view>
        </scroll-view>
        <view class="game-actions">
          <view class="action-btn" hover-class="tap-active" hover-stay-time="70" @tap="createGame">{{ TEXT.newGame }}</view>
          <view v-if="isGameDeleteConfirming" class="inline-confirm-group">
            <view class="confirm-btn confirm-yes" @tap="confirmDeleteCurrentGame">{{ TEXT.confirmIcon }}</view>
            <view class="confirm-btn confirm-no" @tap="cancelDeleteCurrentGame">{{ TEXT.cancelIcon }}</view>
          </view>
          <view v-else class="action-btn danger" hover-class="tap-active" hover-stay-time="70" @tap="requestDeleteCurrentGame">{{ TEXT.deleteGame }}</view>
        </view>
        <view class="filter-tabs">
          <view class="filter-tab" :class="{ active: selectedFilter === 'all' }" @tap="selectedFilter = 'all'">{{ TEXT.filterAll }}</view>
          <view class="filter-tab" :class="{ active: selectedFilter === GAME_STATUS.draft }" @tap="selectedFilter = GAME_STATUS.draft">{{ TEXT.draftStatus }}</view>
          <view class="filter-tab" :class="{ active: selectedFilter === GAME_STATUS.locked }" @tap="selectedFilter = GAME_STATUS.locked">{{ TEXT.lockedStatus }}</view>
          <view class="filter-tab" :class="{ active: selectedFilter === GAME_STATUS.settled }" @tap="selectedFilter = GAME_STATUS.settled">{{ TEXT.settledStatus }}</view>
          <view class="filter-tab" :class="{ active: selectedFilter === GAME_STATUS.archived }" @tap="selectedFilter = GAME_STATUS.archived">{{ TEXT.archivedStatus }}</view>
        </view>
      </view>
    </view>

    <view class="status-bar">
      <view class="status-tag" :class="`status-${currentStatus}`">{{ currentStatusText }}</view>
      <view class="status-actions-right">
        <view v-if="isArchiveConfirming" class="inline-confirm-group">
          <view class="confirm-btn confirm-yes" @tap="confirmArchiveCurrentGame">{{ TEXT.confirmIcon }}</view>
          <view class="confirm-btn confirm-no" @tap="cancelStatusConfirm">{{ TEXT.cancelIcon }}</view>
        </view>
        <view v-else-if="canArchiveCurrentGame" class="status-action secondary" hover-class="tap-active-dark" hover-stay-time="70" @tap="requestArchiveCurrentGame">{{ TEXT.archiveGame }}</view>
      </view>
    </view>

    <view class="title-section">
      <input
        v-if="editingTitle && isEditable"
        v-model="title"
        class="title-input"
        :focus="editingTitle"
        maxlength="30"
        confirm-type="done"
        @blur="finishEditingTitle"
        @confirm="finishEditingTitle"
      />
      <view v-else class="title" @tap="startEditingTitle">
        <text class="title-text">{{ title }}</text>
        <text v-if="isEditable" class="edit-icon">{{ TEXT.editIcon }}</text>
      </view>
    </view>

    <view class="prize-pool">
      <view class="pool-label">{{ TEXT.poolLabel }}</view>
      <view class="pool-amount">{{ TEXT.currency }}{{ formatMoney(displayTotalPool) }}</view>
    </view>

    <view class="bet-table">
      <view class="table-header">
        <view class="header-cell positive">{{ sideHeader(TEXT.positiveLabel, displayPositiveOdds) }}</view>
        <view class="header-cell negative">{{ sideHeader(TEXT.negativeLabel, displayNegativeOdds) }}</view>
      </view>

      <view class="table-body">
        <view class="table-row">
          <view class="column column-left">
            <view
              v-for="(bet, index) in positiveBets"
              :key="`pos-${index}`"
              class="bet-item"
              :class="{ unpaid: !bet.paid }"
            >
              <view class="check-icon" :class="{ checked: bet.paid, disabled: !isEditable }" @tap="togglePaid('positive', index)">
                <text class="check-mark">{{ TEXT.checkMark }}</text>
              </view>
              <view class="bet-info">
                <view class="bet-name">
                  {{ bet.name }}
                  <text v-if="!bet.paid" class="unpaid-tag">{{ TEXT.unpaidTag }}</text>
                </view>
                <view class="bet-meta-line">
                  <text class="bet-meta-label">{{ TEXT.amountLabel }}</text>
                  <text class="bet-meta-value">{{ moneyText(bet.amount) }}</text>
                </view>
                <view class="bet-meta-line highlight">
                  <text class="bet-meta-label">{{ isSettled ? TEXT.winLabel : TEXT.previewLabel }}</text>
                  <text class="bet-meta-value">{{ moneyText(getPayout(bet.amount, displayPositiveOdds)) }}</text>
                </view>
              </view>
              <view v-if="isDeleteConfirming('positive', index)" class="delete-confirm-actions">
                <view class="confirm-btn confirm-yes" @tap="confirmRemoveBet('positive', index)">{{ TEXT.confirmIcon }}</view>
                <view class="confirm-btn confirm-no" @tap="cancelRemoveBet">{{ TEXT.cancelIcon }}</view>
              </view>
              <view v-else class="delete-btn" hover-class="tap-active" hover-stay-time="70" :class="{ disabled: !isEditable }" @tap="requestRemoveBet('positive', index)">{{ TEXT.deleteIcon }}</view>
            </view>

            <view v-if="!positiveBets.length" class="empty-bets empty-positive">{{ TEXT.emptyPositive }}</view>

            <view v-if="isEditable" class="add-section">
              <input v-model="newPositiveName" class="input-field name-input" maxlength="12" :placeholder="TEXT.namePlaceholder" />
              <view class="add-row">
                <input v-model="newPositiveAmount" class="input-field amount-input" type="digit" :placeholder="TEXT.amountPlaceholder" />
                <view class="add-btn" @tap="addBet('positive')">+</view>
              </view>
              <view class="draft-hint">{{ positiveDraftHint }}</view>
            </view>

            <view class="subtotal">{{ subtotalText(displayPositiveTotal) }}</view>
          </view>

          <view class="column">
            <view
              v-for="(bet, index) in negativeBets"
              :key="`neg-${index}`"
              class="bet-item"
              :class="{ unpaid: !bet.paid }"
            >
              <view class="check-icon" :class="{ checked: bet.paid, disabled: !isEditable }" @tap="togglePaid('negative', index)">
                <text class="check-mark">{{ TEXT.checkMark }}</text>
              </view>
              <view class="bet-info">
                <view class="bet-name">
                  {{ bet.name }}
                  <text v-if="!bet.paid" class="unpaid-tag">{{ TEXT.unpaidTag }}</text>
                </view>
                <view class="bet-meta-line">
                  <text class="bet-meta-label">{{ TEXT.amountLabel }}</text>
                  <text class="bet-meta-value">{{ moneyText(bet.amount) }}</text>
                </view>
                <view class="bet-meta-line highlight">
                  <text class="bet-meta-label">{{ isSettled ? TEXT.winLabel : TEXT.previewLabel }}</text>
                  <text class="bet-meta-value">{{ moneyText(getPayout(bet.amount, displayNegativeOdds)) }}</text>
                </view>
              </view>
              <view v-if="isDeleteConfirming('negative', index)" class="delete-confirm-actions">
                <view class="confirm-btn confirm-yes" @tap="confirmRemoveBet('negative', index)">{{ TEXT.confirmIcon }}</view>
                <view class="confirm-btn confirm-no" @tap="cancelRemoveBet">{{ TEXT.cancelIcon }}</view>
              </view>
              <view v-else class="delete-btn" hover-class="tap-active" hover-stay-time="70" :class="{ disabled: !isEditable }" @tap="requestRemoveBet('negative', index)">{{ TEXT.deleteIcon }}</view>
            </view>

            <view v-if="!negativeBets.length" class="empty-bets empty-negative">{{ TEXT.emptyNegative }}</view>

            <view v-if="isEditable" class="add-section">
              <input v-model="newNegativeName" class="input-field name-input" maxlength="12" :placeholder="TEXT.namePlaceholder" />
              <view class="add-row">
                <input v-model="newNegativeAmount" class="input-field amount-input" type="digit" :placeholder="TEXT.amountPlaceholder" />
                <view class="add-btn" @tap="addBet('negative')">+</view>
              </view>
              <view class="draft-hint">{{ negativeDraftHint }}</view>
            </view>

            <view class="subtotal negative">{{ subtotalText(displayNegativeTotal) }}</view>
          </view>
        </view>
      </view>
    </view>

    <view class="lock-panel" v-if="currentStatus === GAME_STATUS.draft || currentStatus === GAME_STATUS.locked">
      <view class="lock-panel-info">
        <view class="lock-panel-title">{{ TEXT.lockPanelTitle }}</view>
        <view class="lock-panel-desc">{{ currentStatus === GAME_STATUS.draft ? TEXT.lockPanelDraftDesc : TEXT.lockedStatus }}</view>
      </view>
      <view class="lock-panel-action">
        <view v-if="isLockConfirming" class="inline-confirm-group">
          <view class="confirm-btn confirm-yes" @tap="confirmLockCurrentGame">{{ TEXT.confirmIcon }}</view>
          <view class="confirm-btn confirm-no" @tap="cancelStatusConfirm">{{ TEXT.cancelIcon }}</view>
        </view>
        <view v-else class="status-action" hover-class="tap-active-dark" hover-stay-time="70" :class="{ disabled: !canLockCurrentGame }" @tap="requestLockCurrentGame">{{ TEXT.lockBetting }}</view>
      </view>
    </view>

    <view class="result-panel">
      <view class="result-header" @tap="showResultPanel = !showResultPanel">
        <view class="result-title">{{ TEXT.resultTitle }}</view>
        <text class="result-toggle">{{ showResultPanel ? TEXT.collapseSymbol : TEXT.expandSymbol }}</text>
      </view>
      <view v-if="showResultPanel">
      <view v-if="currentStatus === GAME_STATUS.draft" class="result-empty-tip">
        {{ TEXT.resultDraftHint }}
      </view>
      <view v-if="canSettleCurrentGame" class="result-actions">
        <view v-if="settleConfirmResult === 'positive'" class="inline-confirm-group result-inline-confirm">
          <view class="confirm-btn confirm-yes" @tap="confirmApplyResult('positive')">{{ TEXT.confirmIcon }}</view>
          <view class="confirm-btn confirm-no" @tap="cancelSettleConfirm">{{ TEXT.cancelIcon }}</view>
        </view>
        <view v-else class="result-btn positive" @tap="requestApplyResult('positive')">{{ TEXT.positiveWin }}</view>

        <view v-if="settleConfirmResult === 'negative'" class="inline-confirm-group result-inline-confirm">
          <view class="confirm-btn confirm-yes" @tap="confirmApplyResult('negative')">{{ TEXT.confirmIcon }}</view>
          <view class="confirm-btn confirm-no" @tap="cancelSettleConfirm">{{ TEXT.cancelIcon }}</view>
        </view>
        <view v-else class="result-btn negative" @tap="requestApplyResult('negative')">{{ TEXT.negativeWin }}</view>

        <view v-if="settleConfirmResult === 'draw'" class="inline-confirm-group result-inline-confirm">
          <view class="confirm-btn confirm-yes" @tap="confirmApplyResult('draw')">{{ TEXT.confirmIcon }}</view>
          <view class="confirm-btn confirm-no" @tap="cancelSettleConfirm">{{ TEXT.cancelIcon }}</view>
        </view>
        <view v-else class="result-btn draw" @tap="requestApplyResult('draw')">{{ TEXT.drawResult }}</view>
      </view>
      <view v-if="isSettled" class="result-summary">
        <view class="result-badge" :class="'result-' + activeGame.result">{{ currentResultText }}</view>
        <view class="result-summary-text">{{ settlementSummaryText }}</view>
        <view class="settlement-list">
          <view v-for="item in settlementRows" :key="item.key" class="settlement-item">
            <view class="settlement-name">{{ item.name }}</view>
            <view class="settlement-meta">{{ item.sideLabel }}</view>
            <view class="settlement-amount" :class="item.status">{{ item.amountText }}</view>
          </view>
        </view>
      </view>
      <view v-if="currentStatus === GAME_STATUS.archived" class="result-empty-tip archived">
        {{ TEXT.resultArchivedHint }}
      </view>
      </view>
    </view>

    <view class="rules">
      <view class="rules-title">{{ TEXT.rulesTitle }}</view>
      <view class="rules-list">
        <view v-for="rule in RULE_LINES" :key="rule" class="rule-item">{{ rule }}</view>
      </view>
    </view>

    <button class="save-btn" :disabled="isGeneratingPoster" @tap="saveAsImage">{{ isGeneratingPoster ? TEXT.generatingImage : TEXT.saveButton }}</button>

    <view v-if="posterActionVisible" class="poster-sheet-mask" @tap="closePosterActions">
      <view class="poster-sheet" @tap.stop>
        <view class="poster-sheet-title">{{ TEXT.generatedReady }}</view>
        <image v-if="generatedPosterPath" :src="generatedPosterPath" class="poster-sheet-preview" mode="aspectFit" @tap="previewGeneratedPoster" />
        <view class="poster-sheet-actions">
          <view class="poster-sheet-btn secondary" @tap="saveGeneratedPoster">{{ TEXT.saveImage }}</view>
          <!-- #ifdef MP-WEIXIN -->
          <button class="poster-sheet-btn primary share-btn" open-type="share">{{ TEXT.shareWechat }}</button>
          <!-- #endif -->
          <!-- #ifndef MP-WEIXIN -->
          <view class="poster-sheet-btn primary" @tap="shareGeneratedPoster">{{ TEXT.shareWechat }}</view>
          <!-- #endif -->
        </view>
        <view class="poster-sheet-cancel" @tap="closePosterActions">{{ TEXT.closePanel }}</view>
      </view>
    </view>

    <canvas canvas-id="bet-poster-canvas" id="bet-poster-canvas" class="poster-canvas" :style="posterCanvasStyle" />
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue';
import { onShareAppMessage } from '@dcloudio/uni-app';
import {
  calculateOdds,
  calculatePayout,
  calculateTotal,
  archiveGame,
  canEditGame,
  canArchiveGame,
  canSettleGame,
  createDefaultGame,
  DEFAULT_TITLE,
  GAME_RESULT,
  GAME_STATUS,
  lockGame,
  migrateLegacyGame,
  parseStoredGameList,
  resolveActiveGameId,
  sanitizeAmount,
  sanitizeName,
  settleGame,
  STORAGE_KEYS
} from '../../utils/bet.mjs';

const TEXT = {
  editIcon: '\u270e',
  checkMark: '\u2713',
  confirmIcon: '\u2714',
  cancelIcon: '\u2715',
  deleteIcon: '\ud83d\uddd1\ufe0f',
  currency: '\u00a5',
  poolLabel: '\u603b\u5956\u6c60',
  positiveLabel: '\u6b63\u65b9',
  negativeLabel: '\u53cd\u65b9',
  oddsLabel: '\u8d54\u7387',
  unpaidTag: '\uff08\u672a\u7f34\uff09',
  namePlaceholder: '\u59d3\u540d',
  amountPlaceholder: '\u91d1\u989d',
  amountLabel: '\u6295\u5165',
  emptyPositive: '\u6682\u65e0\u6b63\u65b9\u4e0b\u6ce8',
  emptyNegative: '\u6682\u65e0\u53cd\u65b9\u4e0b\u6ce8',
  subtotalLabel: '\u5c0f\u8ba1\uff1a',
  rulesTitle: '\u89c4\u5219\u8bf4\u660e',
  resultTitle: '\u51fa\u7ed3\u679c\u4e0e\u7ed3\u7b97',
  resultDraftHint: '\u8bf7\u5148\u5173\u95ed\u4e0b\u6ce8\uff0c\u7136\u540e\u518d\u9009\u62e9\u6b63\u65b9\u8d62\u3001\u53cd\u65b9\u8d62\u6216\u6d41\u5c40',
  resultArchivedHint: '\u5f53\u524d\u8d4c\u5c40\u5df2\u5f52\u6863\uff0c\u4ecd\u53ef\u5bfc\u51fa\u5305\u542b\u7ed3\u679c\u7684\u6d77\u62a5',
  saveButton: '\ud83d\udcf7 \u4fdd\u5b58\u4e3a\u56fe\u7247',
  saveImage: '\u4fdd\u5b58\u56fe\u7247',
  shareWechat: '\u5206\u4eab\u5230\u5fae\u4fe1',
  shareUnavailable: '\u5f53\u524d\u73af\u5883\u6682\u4e0d\u652f\u6301\u7cfb\u7edf\u5206\u4eab',
  livePreviewHint: '\u8f93\u5165\u91d1\u989d\u540e\u5c06\u5b9e\u65f6\u9884\u4f30',
  previewLabel: '\u9884\u4f30',
  closePanel: '\u53d6\u6d88',
  generatedReady: '\u56fe\u7247\u5df2\u751f\u6210\uff0c\u9009\u62e9\u4e0b\u4e00\u6b65\u64cd\u4f5c',
  shareUnavailable: '\u5f53\u524d\u73af\u5883\u6682\u4e0d\u652f\u6301\u7cfb\u7edf\u5206\u4eab',
  archiveGame: '\u5f52\u6863\u8d4c\u5c40',
  filterAll: '\u5168\u90e8',
  gameManager: '\u8d4c\u5c40',
  expandSymbol: '\u25be',
  collapseSymbol: '\u25b4',
  newGame: '\u65b0\u5efa\u8d4c\u5c40',
  deleteGame: '\u5220\u9664\u8d4c\u5c40',
  lockBetting: '\u5173\u95ed\u4e0b\u6ce8',
  lockPanelTitle: '\u4e0b\u6ce8\u9636\u6bb5',
  lockPanelDraftDesc: '\u786e\u8ba4\u4eba\u5458\u548c\u91d1\u989d\u65e0\u8bef\u540e\u518d\u5173\u95ed',
  positiveWin: '\u6b63\u65b9\u8d62',
  negativeWin: '\u53cd\u65b9\u8d62',
  drawResult: '\u6d41\u5c40',
  untitledGame: '\u672a\u547d\u540d\u8d4c\u5c40',
  defaultGameName: '\u65b0\u8d4c\u5c40',
  confirmDeleteTitle: '\u786e\u8ba4\u5220\u9664',
  confirmDeleteContent: '\u786e\u5b9a\u8981\u5220\u9664\u8fd9\u6761\u8bb0\u5f55\u5417\uff1f',
  confirmDeleteGameContent: '\u786e\u5b9a\u8981\u5220\u9664\u5f53\u524d\u8d4c\u5c40\u5417\uff1f',
  confirmArchiveContent: '\u786e\u5b9a\u8981\u5c06\u5f53\u524d\u8d4c\u5c40\u5f52\u6863\u5417\uff1f',
  confirmLockContent: '\u786e\u5b9a\u8981\u5173\u95ed\u4e0b\u6ce8\u5417\uff1f\u5173\u95ed\u540e\u5c06\u65e0\u6cd5\u7ee7\u7eed\u4fee\u6539\u4eba\u5458\u548c\u91d1\u989d\u3002',
  confirmSettleTitle: '\u786e\u8ba4\u7ed3\u7b97',
  confirmSettleContent: '\u786e\u5b9a\u6309\u5f53\u524d\u7ed3\u679c\u751f\u6210\u7ed3\u7b97\u5417\uff1f',
  cannotDeleteLastGame: '\u81f3\u5c11\u4fdd\u7559\u4e00\u4e2a\u8d4c\u5c40',
  bettingClosed: '\u5df2\u5173\u95ed\u4e0b\u6ce8',
  settledDone: '\u5df2\u751f\u6210\u7ed3\u7b97',
  draftStatus: '\u8fdb\u884c\u4e2d',
  lockedStatus: '\u5df2\u5173\u95ed',
  settledStatus: '\u5df2\u7ed3\u7b97',
  archivedStatus: '\u5df2\u5f52\u6863',
  archivedDone: '\u5df2\u5f52\u6863',
  positiveResult: '\u6b63\u65b9\u83b7\u80dc',
  negativeResult: '\u53cd\u65b9\u83b7\u80dc',
  drawResultLabel: '\u6d41\u5c40\u9000\u56de',
  cannotEditLocked: '\u5f53\u524d\u8d4c\u5c40\u5df2\u5173\u95ed\u4e0b\u6ce8',
  inputNameRequired: '\u8bf7\u8f93\u5165\u59d3\u540d',
  inputAmountRequired: '\u8bf7\u8f93\u5165\u6b63\u786e\u91d1\u989d',
  saveAlbumPermissionTitle: '\u9700\u8981\u76f8\u518c\u6743\u9650',
  saveAlbumPermissionContent: '\u8bf7\u5728\u8bbe\u7f6e\u4e2d\u5141\u8bb8\u4fdd\u5b58\u5230\u76f8\u518c\uff0c\u7136\u540e\u518d\u8bd5\u4e00\u6b21\u3002',
  saveFailed: '\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5',
  saveSuccessTitle: '\u4fdd\u5b58\u6210\u529f',
  saveSuccessContent: '\u56fe\u7247\u5df2\u4fdd\u5b58\u5230\u7cfb\u7edf\u76f8\u518c\uff0c\u53ef\u4ee5\u76f4\u63a5\u53d1\u7ed9\u670b\u53cb\u3002',
  previewGenerated: '\u5df2\u751f\u6210\u56fe\u7247\u9884\u89c8',
  generatingImage: '\u751f\u6210\u56fe\u7247\u4e2d...',
  generateFailed: '\u751f\u6210\u56fe\u7247\u5931\u8d25',
  exportFailed: '\u5bfc\u51fa\u5931\u8d25',
  exportRetryHint: '\u8bf7\u518d\u8bd5\u4e00\u6b21\uff0c\u82e5\u4ecd\u5931\u8d25\u8bf7\u622a\u56fe\u63a7\u5236\u53f0\u9519\u8bef',
  winLabel: '\u5e94\u5f97',
  lossLabel: '\u672c\u8f6e\u8f93\u6389',
  refundLabel: '\u9000\u56de',
  posterFooter: 'Bet Helper \u00b7 \u7531\u5f53\u524d\u9875\u9762\u6570\u636e\u751f\u6210'
};

const CANVAS_ID = 'bet-poster-canvas';
const POSTER_WIDTH = 690;
const RULE_LINES = [
  '\u2022 \u8d54\u7387 = \u603b\u5956\u6c60 / \u8be5\u65b9\u603b\u6295\u5165',
  '\u2022 \u83b7\u80dc\u6536\u76ca = \u4e2a\u4eba\u6295\u5165 \u00d7 \u8d54\u7387',
  '\u2022 \u6295\u5165\u8d8a\u5c11\u7684\u4e00\u65b9\u8d54\u7387\u8d8a\u9ad8'
];

const componentInstance = getCurrentInstance()?.proxy;
const games = ref([createDefaultGame()]);
const activeGameId = ref('');
const selectedFilter = ref('all');
const showGameManager = ref(false);
const posterActionVisible = ref(false);
const generatedPosterPath = ref('');
const isGeneratingPoster = ref(false);
const deleteConfirmState = ref({ side: '', index: -1 });
const isGameDeleteConfirming = ref(false);
const isLockConfirming = ref(false);
const isArchiveConfirming = ref(false);
const settleConfirmResult = ref('');
const showResultPanel = ref(true);
const editingTitle = ref(false);
const newPositiveName = ref('');
const newPositiveAmount = ref('');
const newNegativeName = ref('');
const newNegativeAmount = ref('');

const filteredGames = computed(() => {
  if (selectedFilter.value === 'all') {
    return games.value;
  }
  return games.value.filter((game) => game.status === selectedFilter.value);
});
const activeGame = computed(() => games.value.find((game) => game.id === activeGameId.value) || games.value[0]);
const isEditable = computed(() => canEditGame(activeGame.value));
const canArchiveCurrentGame = computed(() => canArchiveGame(activeGame.value));
const canSettleCurrentGame = computed(() => canSettleGame(activeGame.value));
const isSettled = computed(() => activeGame.value?.status === GAME_STATUS.settled);
const currentStatus = computed(() => activeGame.value?.status || GAME_STATUS.draft);
const currentStatusText = computed(() => ({
  [GAME_STATUS.draft]: TEXT.draftStatus,
  [GAME_STATUS.locked]: TEXT.lockedStatus,
  [GAME_STATUS.settled]: TEXT.settledStatus,
  [GAME_STATUS.archived]: TEXT.archivedStatus
}[currentStatus.value] || TEXT.draftStatus));
const currentResultText = computed(() => ({
  [GAME_RESULT.positive]: TEXT.positiveResult,
  [GAME_RESULT.negative]: TEXT.negativeResult,
  [GAME_RESULT.draw]: TEXT.drawResultLabel,
  [GAME_RESULT.pending]: TEXT.lockedStatus
}[activeGame.value?.result || GAME_RESULT.pending] || TEXT.lockedStatus));
const canLockCurrentGame = computed(() => currentStatus.value === GAME_STATUS.draft);

const title = computed({
  get: () => activeGame.value?.title || DEFAULT_TITLE,
  set: (value) => {
    if (activeGame.value) {
      activeGame.value.title = value;
      activeGame.value.updatedAt = Date.now();
    }
  }
});
const positiveBets = computed(() => activeGame.value?.positiveBets || []);
const negativeBets = computed(() => activeGame.value?.negativeBets || []);
const positiveTotal = computed(() => calculateTotal(positiveBets.value));
const negativeTotal = computed(() => calculateTotal(negativeBets.value));
const totalPool = computed(() => positiveTotal.value + negativeTotal.value);
const positiveOdds = computed(() => calculateOdds(positiveTotal.value, totalPool.value));
const negativeOdds = computed(() => calculateOdds(negativeTotal.value, totalPool.value));
const positiveDraftAmount = computed(() => isEditable.value ? sanitizeAmount(newPositiveAmount.value) : 0);
const negativeDraftAmount = computed(() => isEditable.value ? sanitizeAmount(newNegativeAmount.value) : 0);
const displayPositiveTotal = computed(() => positiveTotal.value + positiveDraftAmount.value);
const displayNegativeTotal = computed(() => negativeTotal.value + negativeDraftAmount.value);
const displayTotalPool = computed(() => displayPositiveTotal.value + displayNegativeTotal.value);
const displayPositiveOdds = computed(() => calculateOdds(displayPositiveTotal.value, displayTotalPool.value));
const displayNegativeOdds = computed(() => calculateOdds(displayNegativeTotal.value, displayTotalPool.value));
const settlementRows = computed(() => {
  const rows = [];
  positiveBets.value.forEach((item, index) => rows.push({ key: 'p-' + index, name: item.name, sideLabel: TEXT.positiveLabel, amountText: settlementText(item), status: item.settlementStatus }));
  negativeBets.value.forEach((item, index) => rows.push({ key: 'n-' + index, name: item.name, sideLabel: TEXT.negativeLabel, amountText: settlementText(item), status: item.settlementStatus }));
  return rows;
});
const posterSettlementRows = computed(() => settlementRows.value.slice(0, 8));
const settlementSummaryText = computed(() => {
  const wonCount = settlementRows.value.filter((item) => item.status === 'won').length;
  const refundCount = settlementRows.value.filter((item) => item.status === 'refund').length;

  if (activeGame.value?.result === GAME_RESULT.draw) {
    return `共 ${settlementRows.value.length} 人原额退回`;
  }

  return `赢家 ${wonCount} 人，退款 ${refundCount} 人`;
});
const posterHeight = computed(() => getPosterMetrics().height);
const posterCanvasStyle = computed(() => `position: fixed; left: -2000px; top: -2000px; width: ${POSTER_WIDTH}px; height: ${posterHeight.value}px; pointer-events: none;`);

const formatMoney = (value) => Number(value || 0).toFixed(2);
const moneyText = (value) => `${TEXT.currency}${formatMoney(value)}`;
const subtotalText = (value) => `${TEXT.subtotalLabel}${moneyText(value)}`;
const sideHeader = (label, odds) => `${label}\uff08${TEXT.oddsLabel} ${odds}\uff09`;
const getPayout = (amount, odds) => calculatePayout(amount, odds);
const settlementText = (bet) => {
  if (bet.settlementStatus === 'won') {
    return TEXT.winLabel + ' ' + moneyText(bet.settlementAmount);
  }
  if (bet.settlementStatus === 'refund') {
    return TEXT.refundLabel + ' ' + moneyText(bet.settlementAmount);
  }
  return TEXT.lossLabel;
};
const positiveDraftHint = computed(() => {
  if (!positiveDraftAmount.value) {
    return TEXT.livePreviewHint;
  }

  return `${TEXT.previewLabel} ${TEXT.oddsLabel} ${displayPositiveOdds.value} · ${TEXT.amountLabel}${moneyText(positiveDraftAmount.value)} · ${TEXT.winLabel}${moneyText(getPayout(positiveDraftAmount.value, displayPositiveOdds.value))}`;
});
const negativeDraftHint = computed(() => {
  if (!negativeDraftAmount.value) {
    return TEXT.livePreviewHint;
  }

  return `${TEXT.previewLabel} ${TEXT.oddsLabel} ${displayNegativeOdds.value} · ${TEXT.amountLabel}${moneyText(negativeDraftAmount.value)} · ${TEXT.winLabel}${moneyText(getPayout(negativeDraftAmount.value, displayNegativeOdds.value))}`;
});

const markGameUpdated = () => {
  if (activeGame.value) {
    activeGame.value.updatedAt = Date.now();
  }
};

const isDeleteConfirming = (side, index) => deleteConfirmState.value.side === side && deleteConfirmState.value.index === index;

const cancelRemoveBet = () => {
  deleteConfirmState.value = { side: '', index: -1 };
};

const cancelDeleteCurrentGame = () => {
  isGameDeleteConfirming.value = false;
};

const cancelStatusConfirm = () => {
  isLockConfirming.value = false;
  isArchiveConfirming.value = false;
};

const cancelSettleConfirm = () => {
  settleConfirmResult.value = '';
};

const requestRemoveBet = (side, index) => {
  if (!ensureEditable()) {
    return;
  }
  if (isDeleteConfirming(side, index)) {
    cancelRemoveBet();
    return;
  }
  deleteConfirmState.value = { side, index };
};

const ensureEditable = () => {
  if (isEditable.value) {
    return true;
  }
  showToast(TEXT.cannotEditLocked);
  return false;
};

const finishEditingTitle = () => {
  if (!ensureEditable()) {
    editingTitle.value = false;
    return;
  }
  title.value = sanitizeName(title.value) || DEFAULT_TITLE;
  editingTitle.value = false;
  markGameUpdated();
};

const startEditingTitle = () => {
  if (!ensureEditable()) {
    return;
  }
  editingTitle.value = true;
};

const showToast = (titleText) => {
  uni.showToast({ title: titleText, icon: 'none' });
};

const switchGame = (gameId) => {
  activeGameId.value = gameId;
  editingTitle.value = false;
  resetDraft();
  cancelRemoveBet();
  cancelDeleteCurrentGame();
  cancelStatusConfirm();
  cancelSettleConfirm();
};

const createGame = () => {
  const nextGame = createDefaultGame({ title: `${TEXT.defaultGameName} ${games.value.length + 1}`, positiveBets: [], negativeBets: [] });
  games.value.unshift(nextGame);
  activeGameId.value = nextGame.id;
  editingTitle.value = true;
  resetDraft();
  cancelRemoveBet();
  cancelDeleteCurrentGame();
  cancelStatusConfirm();
  cancelSettleConfirm();
};

const requestDeleteCurrentGame = () => {
  if (games.value.length <= 1) {
    showToast(TEXT.cannotDeleteLastGame);
    return;
  }

  isGameDeleteConfirming.value = true;
};

const confirmDeleteCurrentGame = () => {
  if (games.value.length <= 1 || !activeGame.value) {
    cancelDeleteCurrentGame();
    return;
  }

  const index = games.value.findIndex((game) => game.id === activeGame.value.id);
  games.value.splice(index, 1);
  activeGameId.value = resolveActiveGameId(games.value, games.value[index]?.id || games.value[index - 1]?.id);
  cancelDeleteCurrentGame();
};

const requestArchiveCurrentGame = () => {
  if (!canArchiveCurrentGame.value || !activeGame.value) {
    return;
  }

  isArchiveConfirming.value = true;
  isLockConfirming.value = false;
};

const confirmArchiveCurrentGame = () => {
  if (!canArchiveCurrentGame.value || !activeGame.value) {
    cancelStatusConfirm();
    return;
  }

  Object.assign(activeGame.value, archiveGame(activeGame.value));
  cancelStatusConfirm();
  showToast(TEXT.archivedDone);
};

const requestLockCurrentGame = () => {
  if (!canLockCurrentGame.value || !activeGame.value) {
    return;
  }

  isLockConfirming.value = true;
  isArchiveConfirming.value = false;
};

const confirmLockCurrentGame = () => {
  if (!canLockCurrentGame.value || !activeGame.value) {
    cancelStatusConfirm();
    return;
  }

  Object.assign(activeGame.value, lockGame(activeGame.value));
  editingTitle.value = false;
  resetDraft();
  cancelStatusConfirm();
  showToast(TEXT.bettingClosed);
};

const requestApplyResult = (result) => {
  if (!canSettleCurrentGame.value || !activeGame.value) {
    return;
  }

  settleConfirmResult.value = result;
};

const confirmApplyResult = (result) => {
  if (!canSettleCurrentGame.value || !activeGame.value) {
    cancelSettleConfirm();
    return;
  }

  Object.assign(activeGame.value, settleGame(activeGame.value, result));
  cancelSettleConfirm();
  showToast(TEXT.settledDone);
};

const togglePaid = (side, index) => {
  if (!ensureEditable()) {
    return;
  }
  const targetList = side === 'positive' ? positiveBets.value : negativeBets.value;
  const targetBet = targetList[index];
  if (targetBet) {
    targetBet.paid = !targetBet.paid;
    markGameUpdated();
  }
};

const resetDraft = () => {
  newPositiveName.value = '';
  newPositiveAmount.value = '';
  newNegativeName.value = '';
  newNegativeAmount.value = '';
};

const addBet = (side) => {
  if (!ensureEditable()) {
    return;
  }
  const isPositive = side === 'positive';
  const name = sanitizeName(isPositive ? newPositiveName.value : newNegativeName.value);
  const amount = sanitizeAmount(isPositive ? newPositiveAmount.value : newNegativeAmount.value);

  if (!name) {
    showToast(TEXT.inputNameRequired);
    return;
  }
  if (amount <= 0) {
    showToast(TEXT.inputAmountRequired);
    return;
  }

  const targetList = isPositive ? positiveBets.value : negativeBets.value;
  targetList.push({ name, amount, paid: true, settlementAmount: 0, settlementStatus: 'pending' });
  markGameUpdated();
  resetDraft();
};

const confirmRemoveBet = (side, index) => {
  if (!ensureEditable()) {
    return;
  }
  const targetList = side === 'positive' ? positiveBets.value : negativeBets.value;
  if (!targetList[index]) {
    cancelRemoveBet();
    return;
  }

  targetList.splice(index, 1);
  markGameUpdated();
  cancelRemoveBet();
};

const saveData = () => {
  uni.setStorageSync(STORAGE_KEYS.games, JSON.stringify(games.value));
  uni.setStorageSync(STORAGE_KEYS.activeGameId, activeGameId.value);
};

const loadData = () => {
  const savedGames = uni.getStorageSync(STORAGE_KEYS.games);
  const savedActiveGameId = sanitizeName(uni.getStorageSync(STORAGE_KEYS.activeGameId));

  if (savedGames) {
    games.value = parseStoredGameList(savedGames, [createDefaultGame()]);
    activeGameId.value = resolveActiveGameId(games.value, savedActiveGameId);
    return;
  }

  const legacyTitle = uni.getStorageSync(STORAGE_KEYS.title);
  const legacyPositive = uni.getStorageSync(STORAGE_KEYS.positive);
  const legacyNegative = uni.getStorageSync(STORAGE_KEYS.negative);
  const legacyGame = migrateLegacyGame(legacyTitle, legacyPositive, legacyNegative);

  games.value = [legacyGame];
  activeGameId.value = legacyGame.id;
};

const splitTitle = (value) => {
  const source = sanitizeName(value) || DEFAULT_TITLE;
  const chars = Array.from(source);
  const lines = [];
  while (chars.length && lines.length < 2) {
    lines.push(chars.splice(0, 10).join(''));
  }
  if (chars.length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, 9)}...`;
  }
  return lines.length ? lines : [DEFAULT_TITLE];
};

const getPosterMetrics = () => {
  const titleLines = Math.min(splitTitle(title.value).length, 2);
  const rows = Math.max(positiveBets.value.length, negativeBets.value.length, 1);
  const rowHeight = 88;
  const titleHeight = titleLines * 52;
  const listHeight = 82 + rows * rowHeight + 82;
  const rulesHeight = 158;
  const resultHeight = isSettled.value ? 110 + posterSettlementRows.value.length * 28 : 0;
  const footerHeight = 48;
  const statusHeight = 50;
  const height = 44 + statusHeight + titleHeight + 36 + 146 + 32 + listHeight + 28 + resultHeight + rulesHeight + footerHeight;
  return { width: POSTER_WIDTH, height, rowHeight };
};

const drawRoundRect = (ctx, x, y, width, height, radius, fillColor, strokeColor = '') => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.setFillStyle(fillColor);
  ctx.fill();
  if (strokeColor) {
    ctx.setStrokeStyle(strokeColor);
    ctx.setLineWidth(2);
    ctx.stroke();
  }
};

const drawText = (ctx, text, x, y, options = {}) => {
  const { color = '#111827', fontSize = 24, align = 'left' } = options;
  ctx.setFillStyle(color);
  ctx.setFontSize(fontSize);
  ctx.setTextAlign(align);
  ctx.fillText(String(text), x, y);
};

const drawDivider = (ctx, x, y, height) => {
  ctx.beginPath();
  ctx.setStrokeStyle('#d1d5db');
  ctx.setLineWidth(2);
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + height);
  ctx.stroke();
};

const drawBetRow = (ctx, options) => {
  const { x, y, width, rowHeight, bet, positiveSide } = options;
  if (!bet) {
    return;
  }

  drawRoundRect(ctx, x, y, width, rowHeight - 10, 0, bet.paid ? '#ffffff' : '#fafafa');
  ctx.beginPath();
  ctx.arc(x + 30, y + 30, 15, 0, Math.PI * 2);
  ctx.setStrokeStyle(bet.paid ? '#059669' : '#6b7280');
  ctx.setLineWidth(4);
  ctx.stroke();
  if (bet.paid) {
    drawText(ctx, TEXT.checkMark, x + 30, y + 37, { align: 'center', fontSize: 20, color: '#059669' });
  }
  drawText(ctx, bet.name, x + 60, y + 24, { fontSize: 28 });
  if (!bet.paid) {
    drawText(ctx, TEXT.unpaidTag, x + 60 + Math.min(220, bet.name.length * 28), y + 24, { fontSize: 22, color: '#dc2626' });
  }
  drawText(ctx, `${TEXT.amountLabel} ${moneyText(bet.amount)}`, x + 60, y + 52, {
    fontSize: 18,
    color: '#6b7280'
  });
  drawText(ctx, `${TEXT.winLabel} ${moneyText(getPayout(bet.amount, positiveSide ? positiveOdds.value : negativeOdds.value))}`, x + 60, y + 76, {
    fontSize: 20,
    color: positiveSide ? '#047857' : '#9a3412'
  });
};

const drawPoster = () => new Promise((resolve, reject) => {
  try {
    const metrics = getPosterMetrics();
    const ctx = uni.createCanvasContext(CANVAS_ID);
    const padding = 28;
    const contentWidth = metrics.width - padding * 2;
    const columnWidth = (contentWidth - 2) / 2;
    const titleLines = splitTitle(title.value);
    let cursorY = 0;

    ctx.setFillStyle('#f8fafc');
    ctx.fillRect(0, 0, metrics.width, metrics.height);

    drawRoundRect(ctx, 12, 12, metrics.width - 24, metrics.height - 24, 28, '#f3f4f6');

    cursorY = 42;
    const statusFill = currentStatus.value === GAME_STATUS.locked
      ? '#fef3c7'
      : currentStatus.value === GAME_STATUS.settled
        ? '#dbeafe'
        : currentStatus.value === GAME_STATUS.archived
          ? '#e5e7eb'
          : '#ecfdf5';
    const statusColor = currentStatus.value === GAME_STATUS.locked
      ? '#b45309'
      : currentStatus.value === GAME_STATUS.settled
        ? '#1d4ed8'
        : currentStatus.value === GAME_STATUS.archived
          ? '#4b5563'
          : '#047857';
    drawRoundRect(ctx, padding, cursorY - 10, 180, 34, 16, statusFill);
    drawText(ctx, currentStatusText.value, padding + 90, cursorY + 12, { align: 'center', fontSize: 22, color: statusColor });

    cursorY += 30;
    titleLines.forEach((line, index) => {
      drawText(ctx, line, metrics.width / 2, cursorY + index * 54, { align: 'center', fontSize: 40 });
    });

    cursorY += titleLines.length * 54 + 24;
    drawRoundRect(ctx, padding, cursorY, contentWidth, 132, 24, '#ffffff', '#cfd8e3');
    drawText(ctx, TEXT.poolLabel, metrics.width / 2, cursorY + 40, { align: 'center', fontSize: 28, color: '#6b7280' });
    drawText(ctx, moneyText(totalPool.value), metrics.width / 2, cursorY + 92, { align: 'center', fontSize: 54, color: '#059669' });

    cursorY += 156;
    drawRoundRect(ctx, padding, cursorY, contentWidth, 66, 24, '#eef2f7', '#cfd8e3');
    drawDivider(ctx, padding + columnWidth + 1, cursorY, 66);
    drawText(ctx, sideHeader(TEXT.positiveLabel, positiveOdds.value), padding + columnWidth / 2, cursorY + 42, { align: 'center', fontSize: 26, color: '#059669' });
    drawText(ctx, sideHeader(TEXT.negativeLabel, negativeOdds.value), padding + columnWidth + 2 + columnWidth / 2, cursorY + 42, { align: 'center', fontSize: 26, color: '#dc2626' });

    cursorY += 68;
    const rows = Math.max(positiveBets.value.length, negativeBets.value.length, 1);
    drawRoundRect(ctx, padding, cursorY, contentWidth, rows * metrics.rowHeight + 82, 24, '#ffffff', '#cfd8e3');
    drawDivider(ctx, padding + columnWidth + 1, cursorY, rows * metrics.rowHeight + 82);

    for (let index = 0; index < rows; index += 1) {
      const rowY = cursorY + index * metrics.rowHeight;
      if (index > 0) {
        ctx.beginPath();
        ctx.setStrokeStyle('#e5e7eb');
        ctx.setLineWidth(2);
        ctx.moveTo(padding, rowY);
        ctx.lineTo(padding + contentWidth, rowY);
        ctx.stroke();
      }
      drawBetRow(ctx, { x: padding + 12, y: rowY + 10, width: columnWidth - 24, rowHeight: metrics.rowHeight, bet: positiveBets.value[index], positiveSide: true });
      drawBetRow(ctx, { x: padding + columnWidth + 14, y: rowY + 10, width: columnWidth - 24, rowHeight: metrics.rowHeight, bet: negativeBets.value[index], positiveSide: false });
    }

    const subtotalY = cursorY + rows * metrics.rowHeight + 12;
    drawRoundRect(ctx, padding + 12, subtotalY, columnWidth - 24, 58, 16, '#ecfdf5');
    drawRoundRect(ctx, padding + columnWidth + 14, subtotalY, columnWidth - 24, 58, 16, '#fef2f2');
    drawText(ctx, subtotalText(positiveTotal.value), padding + columnWidth / 2, subtotalY + 37, { align: 'center', fontSize: 26, color: '#059669' });
    drawText(ctx, subtotalText(negativeTotal.value), padding + columnWidth + 2 + columnWidth / 2, subtotalY + 37, { align: 'center', fontSize: 26, color: '#dc2626' });

    cursorY = subtotalY + 86;
    if (isSettled.value) {
      const resultHeight = 110 + posterSettlementRows.value.length * 28;
      drawRoundRect(ctx, padding, cursorY, contentWidth, resultHeight, 24, '#ffffff', '#cfd8e3');
      drawText(ctx, TEXT.resultTitle, padding + 20, cursorY + 34, { fontSize: 30 });
      drawRoundRect(ctx, padding + 20, cursorY + 48, 180, 34, 16, '#eef2ff');
      drawText(ctx, currentResultText.value, padding + 110, cursorY + 70, { align: 'center', fontSize: 22, color: '#1d4ed8' });
      drawText(ctx, settlementSummaryText.value, padding + contentWidth - 20, cursorY + 70, { align: 'right', fontSize: 20, color: '#6b7280' });
      posterSettlementRows.value.forEach((item, index) => {
        const top = cursorY + 106 + index * 28;
        drawText(ctx, item.name, padding + 20, top, { fontSize: 20 });
        drawText(ctx, item.sideLabel, padding + 160, top, { fontSize: 18, color: '#6b7280' });
        drawText(ctx, item.amountText, padding + contentWidth - 20, top, { align: 'right', fontSize: 20, color: item.status === 'won' ? '#059669' : item.status === 'refund' ? '#1d4ed8' : '#6b7280' });
      });
      if (settlementRows.value.length > posterSettlementRows.value.length) {
        drawText(ctx, `其余 ${settlementRows.value.length - posterSettlementRows.value.length} 人请在小程序内查看`, padding + contentWidth - 20, cursorY + resultHeight - 18, { align: 'right', fontSize: 16, color: '#9ca3af' });
      }
      cursorY += resultHeight + 20;
    }
    drawRoundRect(ctx, padding, cursorY, contentWidth, 146, 24, '#ffffff', '#cfd8e3');
    drawText(ctx, TEXT.rulesTitle, padding + 20, cursorY + 34, { fontSize: 30 });
    RULE_LINES.forEach((line, index) => {
      drawText(ctx, line, padding + 20, cursorY + 74 + index * 28, { fontSize: 22, color: '#4b5563' });
    });

    drawText(ctx, TEXT.posterFooter, metrics.width / 2, metrics.height - 18, { align: 'center', fontSize: 18, color: '#9ca3af' });
    ctx.draw(false, () => setTimeout(resolve, 300));
  } catch (error) {
    reject(error);
  }
});

const exportPoster = () => new Promise((resolve, reject) => {
  const exportOptions = {
    canvasId: CANVAS_ID,
    width: POSTER_WIDTH,
    height: posterHeight.value,
    destWidth: POSTER_WIDTH * 2,
    destHeight: posterHeight.value * 2,
    fileType: 'png',
    success: (res) => resolve(res.tempFilePath),
    fail: reject
  };

  try {
    uni.canvasToTempFilePath(exportOptions, componentInstance);
  } catch (error) {
    reject(error);
  }
});

const handleSaveImageError = (error) => {
  const message = String(error?.errMsg || '');
  if (message.includes('auth deny') || message.includes('authorize') || message.includes('auth denied')) {
    uni.showModal({
      title: TEXT.saveAlbumPermissionTitle,
      content: TEXT.saveAlbumPermissionContent,
      success: ({ confirm }) => {
        if (confirm) {
          uni.openSetting({});
        }
      }
    });
    return;
  }
  showToast(TEXT.saveFailed);
};

const closePosterActions = () => {
  posterActionVisible.value = false;
};

const previewGeneratedPoster = () => {
  if (!generatedPosterPath.value) {
    return;
  }

  uni.previewImage({
    urls: [generatedPosterPath.value],
    current: generatedPosterPath.value
  });
};

const openPosterActions = (tempFilePath) => {
  generatedPosterPath.value = tempFilePath;
  posterActionVisible.value = true;
};

const saveGeneratedPoster = () => {
  if (!generatedPosterPath.value) {
    showToast(TEXT.generateFailed);
    return;
  }

  // #ifdef MP-WEIXIN
  uni.saveImageToPhotosAlbum({
    filePath: generatedPosterPath.value,
    success: () => {
      closePosterActions();
      showToast(TEXT.saveSuccessTitle);
    },
    fail: (error) => {
      handleSaveImageError(error);
    }
  });
  // #endif

  // #ifndef MP-WEIXIN
  if (typeof document !== 'undefined') {
    const link = document.createElement('a');
    link.href = generatedPosterPath.value;
    link.download = `${title.value || 'bet-helper'}.png`;
    link.click();
    closePosterActions();
  } else if (typeof uni.previewImage === 'function') {
    uni.previewImage({
      urls: [generatedPosterPath.value],
      current: generatedPosterPath.value
    });
  } else {
    showToast(TEXT.saveFailed);
  }
  // #endif
};

const shareGeneratedPoster = () => {
  // #ifdef H5
  if (typeof navigator !== 'undefined' && navigator.share && generatedPosterPath.value) {
    navigator.share({ title: title.value, text: currentResultText.value || title.value, url: generatedPosterPath.value }).then(() => {
      closePosterActions();
    }).catch(() => {});
    return;
  }
  showToast(TEXT.shareUnavailable);
  // #endif
};

const saveAsImage = async () => {
  if (isGeneratingPoster.value) {
    return;
  }

  isGeneratingPoster.value = true;
  uni.showLoading({ title: TEXT.generatingImage });
  try {
    await nextTick();
    await drawPoster();
    await new Promise((resolve) => setTimeout(resolve, 180));
    const tempFilePath = await exportPoster();
    uni.hideLoading();
    openPosterActions(tempFilePath);
    isGeneratingPoster.value = false;
  } catch (error) {
    uni.hideLoading();
    isGeneratingPoster.value = false;
    console.error('Failed to export poster', error);
    const errorText = String(error?.errMsg || error?.message || '').slice(0, 18);
    showToast(errorText ? `${TEXT.exportFailed}:${errorText}` : TEXT.generateFailed);
  }
};

onShareAppMessage(() => ({
  title: title.value || DEFAULT_TITLE,
  path: '/pages/index/index',
  imageUrl: generatedPosterPath.value || ''
}));

watch([games, activeGameId], saveData, { deep: true });

onMounted(() => {
  loadData();
  activeGameId.value = resolveActiveGameId(games.value, activeGameId.value);
});
</script>

<style scoped>
.container { min-height: 100vh; padding: 28rpx 24rpx 36rpx; background: linear-gradient(180deg, #f8fafc 0%, #f3f4f6 100%); }
.game-panel { margin-bottom: 20rpx; }
.game-summary { display: flex; align-items: center; justify-content: space-between; padding: 18rpx 20rpx; border: 2rpx solid rgba(255,255,255,0.7); border-radius: 20rpx; background: rgba(255,255,255,0.82); box-shadow: 0 6rpx 18rpx rgba(15,23,42,0.05); backdrop-filter: blur(8px); }
.game-summary-main { flex: 1; min-width: 0; }
.game-summary-label { font-size: 20rpx; color: #6b7280; margin-bottom: 6rpx; }
.game-summary-title { font-size: 24rpx; color: #111827; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.game-summary-side { display: flex; align-items: center; gap: 12rpx; margin-left: 16rpx; }
.game-summary-count { font-size: 20rpx; color: #6b7280; }
.game-summary-arrow { font-size: 20rpx; color: #111827; }
.game-manager-card { margin-top: 14rpx; padding: 18rpx; border: 2rpx solid #eef2f7; border-radius: 24rpx; background: rgba(255,255,255,0.96); box-shadow: 0 8rpx 24rpx rgba(15,23,42,0.06); }
.game-scroll { white-space: nowrap; }
.game-list { display: inline-flex; gap: 16rpx; }
.game-chip { max-width: 300rpx; padding: 16rpx 24rpx; border-radius: 999rpx; background: #e5e7eb; color: #374151; }
.game-chip.active { background: #059669; color: #ffffff; }
.game-chip-text { font-size: 24rpx; }
.game-actions { display: flex; gap: 16rpx; margin-top: 16rpx; }
.action-btn { padding: 14rpx 24rpx; border-radius: 16rpx; background: #ffffff; color: #111827; font-size: 24rpx; box-shadow: 0 4rpx 12rpx rgba(15,23,42,0.06); }
.action-btn.danger { color: #dc2626; }
.inline-confirm-group { display: flex; gap: 12rpx; }
.filter-tabs { display: flex; gap: 12rpx; flex-wrap: wrap; margin-top: 16rpx; }
.filter-tab { padding: 10rpx 18rpx; border-radius: 999rpx; background: #e5e7eb; color: #374151; font-size: 22rpx; }
.filter-tab.active { background: #111827; color: #ffffff; }
.status-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16rpx; gap: 16rpx; }
.status-tag { padding: 10rpx 20rpx; border-radius: 999rpx; font-size: 22rpx; font-weight: 600; }
.status-draft { color: #047857; background: #ecfdf5; }
.status-locked { color: #b45309; background: #fef3c7; }
.status-settled { color: #1d4ed8; background: #dbeafe; }
.status-archived { color: #6b7280; background: #e5e7eb; }
.status-actions-right { display: flex; gap: 12rpx; }
.status-action { padding: 12rpx 24rpx; border-radius: 16rpx; background: #111827; color: #ffffff; font-size: 24rpx; box-shadow: 0 6rpx 14rpx rgba(17,24,39,0.14); }
.status-action.secondary { background: #2563eb; box-shadow: 0 6rpx 14rpx rgba(37,99,235,0.16); }
.status-action.disabled { opacity: 0.45; }
.title-section { display: flex; justify-content: center; margin-bottom: 30rpx; }
.title { display: inline-flex; align-items: center; justify-content: center; max-width: 100%; }
.title-text { font-size: 56rpx; font-weight: 700; color: #111827; line-height: 1.35; text-align: center; }
.edit-icon { margin-left: 14rpx; color: #6b7280; font-size: 42rpx; }
.title-input { min-width: 420rpx; max-width: 100%; padding: 10rpx 16rpx; border-bottom: 4rpx solid #10b981; font-size: 56rpx; font-weight: 700; color: #111827; text-align: center; background: transparent; }
.prize-pool, .bet-table, .rules, .result-panel { background: #ffffff; border: 2rpx solid #e5e7eb; border-radius: 32rpx; box-shadow: 0 10rpx 28rpx rgba(15,23,42,0.06); }
.prize-pool { padding: 34rpx 28rpx; margin-bottom: 20rpx; text-align: center; }
.pool-label { margin-bottom: 10rpx; font-size: 26rpx; color: #6b7280; }
.pool-amount { font-size: 56rpx; font-weight: 700; color: #059669; }
.bet-table { overflow: hidden; margin-bottom: 24rpx; }
.table-header { display: flex; background: linear-gradient(180deg, #f3f6fa 0%, #ebf0f5 100%); }
.header-cell { flex: 1; padding: 28rpx 16rpx; font-size: 34rpx; font-weight: 700; text-align: center; color: #374151; }
.header-cell.positive { color: #059669; border-right: 2rpx solid #d1d5db; }
.header-cell.negative { color: #dc2626; }
.table-row { display: flex; }
.column { flex: 1; padding: 0 0 20rpx; }
.column-left { border-right: 2rpx solid #e5e7eb; }
.bet-item { display: flex; align-items: center; padding: 28rpx 20rpx; border-bottom: 2rpx solid #e5e7eb; background: #ffffff; transition: all 0.2s ease; }
.bet-item.unpaid { background: #fafafa; }
.empty-bets { display: flex; align-items: center; justify-content: center; min-height: 140rpx; padding: 24rpx 20rpx; border-bottom: 2rpx dashed #e5e7eb; font-size: 24rpx; color: #9ca3af; }
.empty-positive { background: linear-gradient(180deg, #f8fffb 0%, #ffffff 100%); }
.empty-negative { background: linear-gradient(180deg, #fffafa 0%, #ffffff 100%); }
.check-icon { display: flex; align-items: center; justify-content: center; width: 46rpx; height: 46rpx; margin-right: 16rpx; border: 4rpx solid #6b7280; border-radius: 50%; color: transparent; }
.check-icon.checked { border-color: #059669; color: #059669; }
.check-icon.disabled, .delete-btn.disabled { opacity: 0.4; }
.check-mark { font-size: 26rpx; font-weight: 700; line-height: 1; }
.delete-confirm-actions { display: flex; gap: 10rpx; }
.confirm-btn { display: flex; align-items: center; justify-content: center; width: 52rpx; height: 52rpx; border-radius: 50%; font-size: 24rpx; font-weight: 700; }
.confirm-yes { background: #ecfdf5; color: #059669; }
.confirm-no { background: #fef2f2; color: #dc2626; }
.bet-info { flex: 1; }
.bet-name { margin-bottom: 8rpx; font-size: 28rpx; font-weight: 700; color: #111827; }
.unpaid-tag { color: #dc2626; font-size: 24rpx; font-weight: 600; }
.bet-meta-line { display: flex; align-items: center; justify-content: space-between; margin-top: 6rpx; font-size: 22rpx; color: #4b5563; }
.bet-meta-line.highlight { margin-top: 8rpx; }
.bet-meta-label { color: #6b7280; }
.bet-meta-value { color: #111827; font-weight: 600; }
.bet-meta-line.highlight .bet-meta-value { color: #059669; }
.delete-btn { padding: 10rpx; font-size: 32rpx; opacity: 0.65; }
.add-section { display: flex; flex-direction: column; gap: 12rpx; padding: 22rpx 18rpx; border-bottom: 2rpx solid #e5e7eb; background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%); }
.add-row { display: flex; align-items: center; gap: 12rpx; width: 100%; }
.input-field { flex: 1; min-width: 0; height: 72rpx; padding: 0 18rpx; background: #f9fafb; border: 2rpx solid #d1d5db; border-radius: 16rpx; font-size: 24rpx; box-shadow: inset 0 2rpx 6rpx rgba(15,23,42,0.03); }
.name-input { width: 100%; }
.amount-input { flex: 1; margin-left: 0; }
.add-btn { display: flex; align-items: center; justify-content: center; width: 64rpx; min-width: 64rpx; height: 64rpx; margin-left: 0; border-radius: 16rpx; background: #f3f4f6; font-size: 48rpx; line-height: 1; color: #111827; }
.draft-hint { width: 100%; font-size: 20rpx; color: #6b7280; line-height: 1.5; }
.subtotal { padding: 26rpx 20rpx; font-size: 28rpx; font-weight: 700; text-align: center; color: #059669; background: #ecfdf5; }
.subtotal.negative { color: #dc2626; background: #fef2f2; }
.lock-panel { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; padding: 20rpx 22rpx; margin-bottom: 18rpx; border: 2rpx solid #e5e7eb; border-radius: 24rpx; background: #ffffff; box-shadow: 0 8rpx 22rpx rgba(15,23,42,0.05); }
.lock-panel-info { flex: 1; min-width: 0; }
.lock-panel-title { font-size: 26rpx; font-weight: 700; color: #111827; }
.lock-panel-desc { margin-top: 6rpx; font-size: 22rpx; color: #6b7280; }
.lock-panel-action { display: flex; align-items: center; }
.result-panel { padding: 24rpx; margin-bottom: 20rpx; }
.result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12rpx; }
.result-title { font-size: 32rpx; font-weight: 700; color: #111827; }
.result-toggle { font-size: 24rpx; color: #6b7280; }
.result-empty-tip { padding: 18rpx 20rpx; border-radius: 18rpx; background: #f8fafc; color: #6b7280; font-size: 24rpx; line-height: 1.6; }
.result-empty-tip.archived { background: #f3f4f6; }
.result-actions { display: flex; gap: 16rpx; }
.result-btn { flex: 1; padding: 18rpx 0; border-radius: 18rpx; text-align: center; font-size: 26rpx; font-weight: 700; }
.result-btn.positive { background: #ecfdf5; color: #059669; }
.result-btn.negative { background: #fef2f2; color: #dc2626; }
.result-btn.draw { background: #eff6ff; color: #2563eb; }
.result-inline-confirm { flex: 1; justify-content: center; }
.result-summary { margin-top: 12rpx; }
.result-summary-text { margin-top: 12rpx; font-size: 22rpx; color: #6b7280; }
.result-badge { display: inline-block; padding: 10rpx 20rpx; border-radius: 999rpx; font-size: 24rpx; font-weight: 700; }
.result-positive { color: #059669; background: #ecfdf5; }
.result-negative { color: #dc2626; background: #fef2f2; }
.result-draw { color: #2563eb; background: #eff6ff; }
.settlement-list { margin-top: 18rpx; }
.settlement-item { display: flex; align-items: center; padding: 18rpx 0; border-bottom: 2rpx solid #f3f4f6; }
.settlement-item:last-child { border-bottom: none; }
.settlement-name { flex: 1; font-size: 26rpx; color: #111827; font-weight: 600; }
.settlement-meta { width: 120rpx; font-size: 22rpx; color: #6b7280; }
.settlement-amount { font-size: 24rpx; font-weight: 700; }
.settlement-amount.won { color: #059669; }
.settlement-amount.lost { color: #6b7280; }
.settlement-amount.refund { color: #2563eb; }
.rules { padding: 36rpx; margin-bottom: 140rpx; }
.rules-title { margin-bottom: 16rpx; font-size: 34rpx; font-weight: 700; color: #111827; }
.rule-item { padding: 10rpx 0; font-size: 28rpx; line-height: 1.6; color: #4b5563; }
.save-btn { position: fixed; right: 32rpx; bottom: 32rpx; left: 32rpx; height: 88rpx; line-height: 88rpx; border: none; border-radius: 24rpx; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 32rpx; font-weight: 700; letter-spacing: 1rpx; box-shadow: 0 14rpx 30rpx rgba(5, 150, 105, 0.24); }
.save-btn::after { border: none; }
.poster-sheet-mask { position: fixed; inset: 0; display: flex; align-items: flex-end; background: rgba(15, 23, 42, 0.28); z-index: 30; }
.poster-sheet { width: 100%; padding: 28rpx 24rpx calc(24rpx + env(safe-area-inset-bottom)); border-radius: 28rpx 28rpx 0 0; background: rgba(255,255,255,0.98); box-shadow: 0 -12rpx 30rpx rgba(15,23,42,0.12); }
.poster-sheet-title { margin-bottom: 18rpx; text-align: center; font-size: 26rpx; color: #374151; }
.poster-sheet-preview { width: 100%; height: 220rpx; margin-bottom: 14rpx; border-radius: 20rpx; background: #f3f4f6; }
.poster-sheet-actions { display: flex; gap: 18rpx; }
.poster-sheet-btn { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 96rpx; border-radius: 24rpx; font-size: 30rpx; font-weight: 700; padding: 0 20rpx; }
.poster-sheet-btn.primary { background: #10b981; color: #ffffff; }
.poster-sheet-btn.secondary { background: #eff6ff; color: #2563eb; }
.share-btn { border: none; padding: 0; margin: 0; }
.share-btn::after { border: none; }
.tap-active { transform: scale(0.985); opacity: 0.88; }
.tap-active-dark { transform: scale(0.985); opacity: 0.92; }
.poster-sheet-cancel { margin-top: 22rpx; padding: 16rpx 0; text-align: center; font-size: 30rpx; color: #6b7280; }
.poster-canvas { opacity: 0; }
@media screen and (max-width: 768px) {
  .title-text, .title-input { font-size: 48rpx; }
  .pool-amount { font-size: 48rpx; }
  .lock-panel { align-items: stretch; flex-direction: column; }
  .lock-panel-action { justify-content: flex-end; }
  .result-actions { flex-direction: column; }
  .poster-sheet-actions { flex-direction: column; }
}
</style>
