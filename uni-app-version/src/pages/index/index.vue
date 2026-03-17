<template>
  <view class="container">
    <!-- 标题 -->
    <view class="title-section">
      <input 
        v-if="editingTitle" 
        v-model="title" 
        @blur="editingTitle = false"
        @confirm="editingTitle = false"
        class="title-input"
        :focus="editingTitle"
      />
      <view v-else class="title" @tap="editingTitle = true">
        {{ title }}
        <text class="edit-icon">✏️</text>
      </view>
    </view>

    <!-- 总奖池 -->
    <view class="prize-pool">
      <view class="pool-label">总奖池</view>
      <view class="pool-amount">¥{{ totalPool.toFixed(2) }}</view>
    </view>

    <!-- 投注表格 -->
    <view class="bet-table">
      <!-- 表头 -->
      <view class="table-header">
        <view class="header-cell positive">正方 (赔率 {{ positiveOdds }})</view>
        <view class="header-cell negative">反方 (赔率 {{ negativeOdds }})</view>
      </view>

      <!-- 参与者列表 -->
      <view class="table-body">
        <view class="table-row">
          <!-- 正方列 -->
          <view class="column">
            <view 
              v-for="(bet, index) in positiveBets" 
              :key="'pos-' + index"
              class="bet-item"
              :class="{ unpaid: !bet.paid }"
            >
              <checkbox 
                :checked="bet.paid" 
                @tap="togglePaid('positive', index)"
                class="checkbox"
                color="#10b981"
              />
              <view class="bet-info">
                <view class="bet-name">
                  {{ bet.name }}
                  <text v-if="!bet.paid" class="unpaid-tag">(未缴)</text>
                </view>
                <view class="bet-amount">¥{{ bet.amount }} → ¥{{ (bet.amount * positiveOdds).toFixed(2) }}</view>
              </view>
              <view @tap="removeBet('positive', index)" class="delete-btn">🗑️</view>
            </view>

            <!-- 添加按钮 -->
            <view class="add-section">
              <input 
                v-model="newPositiveName" 
                placeholder="姓名" 
                class="input-field"
              />
              <input 
                v-model="newPositiveAmount" 
                placeholder="金额" 
                type="digit"
                class="input-field"
              />
              <view @tap="addBet('positive')" class="add-btn">+</view>
            </view>

            <!-- 小计 -->
            <view class="subtotal">小计：¥{{ positiveTotal.toFixed(2) }}</view>
          </view>

          <!-- 反方列 -->
          <view class="column">
            <view 
              v-for="(bet, index) in negativeBets" 
              :key="'neg-' + index"
              class="bet-item"
              :class="{ unpaid: !bet.paid }"
            >
              <checkbox 
                :checked="bet.paid" 
                @tap="togglePaid('negative', index)"
                class="checkbox"
                color="#10b981"
              />
              <view class="bet-info">
                <view class="bet-name">
                  {{ bet.name }}
                  <text v-if="!bet.paid" class="unpaid-tag">(未缴)</text>
                </view>
                <view class="bet-amount">¥{{ bet.amount }} → ¥{{ (bet.amount * negativeOdds).toFixed(2) }}</view>
              </view>
              <view @tap="removeBet('negative', index)" class="delete-btn">🗑️</view>
            </view>

            <!-- 添加按钮 -->
            <view class="add-section">
              <input 
                v-model="newNegativeName" 
                placeholder="姓名" 
                class="input-field"
              />
              <input 
                v-model="newNegativeAmount" 
                placeholder="金额" 
                type="digit"
                class="input-field"
              />
              <view @tap="addBet('negative')" class="add-btn">+</view>
            </view>

            <!-- 小计 -->
            <view class="subtotal negative">小计：¥{{ negativeTotal.toFixed(2) }}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 规则说明 -->
    <view class="rules">
      <view class="rules-title">规则说明</view>
      <view class="rules-list">
        <view class="rule-item">• 赔率 = 总奖池 / 该方总投入</view>
        <view class="rule-item">• 获胜收益 = 个人投入 × 赔率</view>
        <view class="rule-item">• 投入越少的一方赔率越高</view>
      </view>
    </view>

    <!-- 保存按钮 -->
    <button @tap="saveAsImage" class="save-btn">
      📷 保存为图片
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

interface Bet {
  name: string;
  amount: number;
  paid: boolean;
}

const title = ref('明天会下雨吗?');
const editingTitle = ref(false);

const positiveBets = ref<Bet[]>([
  { name: '小明', amount: 50, paid: true },
  { name: '小红', amount: 30, paid: false }
]);

const negativeBets = ref<Bet[]>([
  { name: '小李', amount: 100, paid: true }
]);

const newPositiveName = ref('');
const newPositiveAmount = ref('');
const newNegativeName = ref('');
const newNegativeAmount = ref('');

// 计算总投入
const positiveTotal = computed(() => {
  return positiveBets.value.reduce((sum, bet) => sum + bet.amount, 0);
});

const negativeTotal = computed(() => {
  return negativeBets.value.reduce((sum, bet) => sum + bet.amount, 0);
});

const totalPool = computed(() => {
  return positiveTotal.value + negativeTotal.value;
});

// 计算赔率
const positiveOdds = computed(() => {
  if (positiveTotal.value === 0) return 0;
  return parseFloat((totalPool.value / positiveTotal.value).toFixed(2));
});

const negativeOdds = computed(() => {
  if (negativeTotal.value === 0) return 0;
  return parseFloat((totalPool.value / negativeTotal.value).toFixed(2));
});

// 切换支付状态
const togglePaid = (side: string, index: number) => {
  if (side === 'positive') {
    positiveBets.value[index].paid = !positiveBets.value[index].paid;
  } else {
    negativeBets.value[index].paid = !negativeBets.value[index].paid;
  }
  saveData();
};

// 添加投注
const addBet = (side: string) => {
  if (side === 'positive') {
    const amount = parseFloat(newPositiveAmount.value);
    if (newPositiveName.value && amount > 0) {
      positiveBets.value.push({
        name: newPositiveName.value,
        amount: amount,
        paid: true
      });
      newPositiveName.value = '';
      newPositiveAmount.value = '';
    }
  } else {
    const amount = parseFloat(newNegativeAmount.value);
    if (newNegativeName.value && amount > 0) {
      negativeBets.value.push({
        name: newNegativeName.value,
        amount: amount,
        paid: true
      });
      newNegativeName.value = '';
      newNegativeAmount.value = '';
    }
  }
  saveData();
};

// 删除投注
const removeBet = (side: string, index: number) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条记录吗？',
    success: (res) => {
      if (res.confirm) {
        if (side === 'positive') {
          positiveBets.value.splice(index, 1);
        } else {
          negativeBets.value.splice(index, 1);
        }
        saveData();
      }
    }
  });
};

// 保存数据到 storage
const saveData = () => {
  uni.setStorageSync('bet_title', title.value);
  uni.setStorageSync('bet_positive', JSON.stringify(positiveBets.value));
  uni.setStorageSync('bet_negative', JSON.stringify(negativeBets.value));
};

// 加载数据
const loadData = () => {
  const savedTitle = uni.getStorageSync('bet_title');
  if (savedTitle) title.value = savedTitle;

  const savedPositive = uni.getStorageSync('bet_positive');
  if (savedPositive) {
    try {
      positiveBets.value = JSON.parse(savedPositive);
    } catch (e) {
      console.error('Failed to parse positive bets', e);
    }
  }

  const savedNegative = uni.getStorageSync('bet_negative');
  if (savedNegative) {
    try {
      negativeBets.value = JSON.parse(savedNegative);
    } catch (e) {
      console.error('Failed to parse negative bets', e);
    }
  }
};

// 保存为图片
const saveAsImage = () => {
  uni.showLoading({
    title: '生成中...'
  });

  // 使用 uni.canvasToTempFilePath 生成图片
  setTimeout(() => {
    uni.hideLoading();
    uni.showModal({
      title: '提示',
      content: '请在微信开发者工具中测试截图功能，或使用分享功能',
      showCancel: false
    });
  }, 500);
};

// 监听数据变化
watch([positiveBets, negativeBets, title], () => {
  saveData();
}, { deep: true });

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.container {
  min-height: 100vh;
  padding: 40rpx;
  background: #f5f5f5;
}

/* 标题部分 */
.title-section {
  text-align: center;
  margin-bottom: 30rpx;
}

.title {
  font-size: 56rpx;
  font-weight: 700;
  color: #333;
  display: inline-flex;
  align-items: center;
}

.edit-icon {
  font-size: 36rpx;
  opacity: 0.3;
  margin-left: 10rpx;
}

.title-input {
  font-size: 56rpx;
  font-weight: 700;
  color: #333;
  border-bottom: 2px solid #10b981;
  text-align: center;
  padding: 10rpx;
}

/* 总奖池 */
.prize-pool {
  background: white;
  border-radius: 32rpx;
  padding: 50rpx;
  text-align: center;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.pool-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.pool-amount {
  font-size: 80rpx;
  font-weight: 700;
  color: #10b981;
}

/* 投注表格 */
.bet-table {
  background: white;
  border-radius: 32rpx;
  overflow: hidden;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.table-header {
  display: flex;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header-cell {
  flex: 1;
  padding: 32rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 600;
  color: white;
}

.header-cell.positive {
  background: rgba(16, 185, 129, 0.15);
}

.header-cell.negative {
  background: rgba(239, 68, 68, 0.15);
}

.table-body {
  padding: 30rpx;
}

.table-row {
  display: flex;
}

.column {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 10rpx;
}

/* 投注项 */
.bet-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #f9fafb;
  border-radius: 20rpx;
  border: 2px solid transparent;
  margin-bottom: 20rpx;
}

.bet-item.unpaid {
  background: #fef2f2;
  border-color: #fecaca;
}

.checkbox {
  margin-right: 16rpx;
  transform: scale(1.2);
}

.bet-info {
  flex: 1;
}

.bet-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.unpaid-tag {
  color: #ef4444;
  font-size: 24rpx;
  font-weight: 400;
}

.bet-amount {
  font-size: 24rpx;
  color: #666;
}

.delete-btn {
  font-size: 32rpx;
  opacity: 0.5;
  padding: 10rpx;
}

/* 添加部分 */
.add-section {
  display: flex;
  padding: 24rpx;
  background: #f0fdf4;
  border-radius: 20rpx;
  border: 2px dashed #10b981;
  margin-bottom: 20rpx;
}

.input-field {
  flex: 1;
  padding: 16rpx;
  border: 1px solid #d1d5db;
  border-radius: 12rpx;
  font-size: 24rpx;
  margin-right: 16rpx;
  background: white;
}

.add-btn {
  width: 64rpx;
  height: 64rpx;
  background: #10b981;
  color: white;
  border-radius: 12rpx;
  font-size: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* 小计 */
.subtotal {
  padding: 24rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 600;
  color: #10b981;
  background: #f0fdf4;
  border-radius: 20rpx;
}

.subtotal.negative {
  color: #ef4444;
  background: #fef2f2;
}

/* 规则说明 */
.rules {
  background: white;
  border-radius: 32rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.rules-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.rules-list {
  padding: 0;
}

.rule-item {
  padding: 12rpx 0;
  color: #666;
  font-size: 26rpx;
  line-height: 1.6;
}

/* 保存按钮 */
.save-btn {
  width: 100%;
  padding: 32rpx;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 20rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 24rpx rgba(16, 185, 129, 0.3);
}

.save-btn::after {
  border: none;
}
</style>
