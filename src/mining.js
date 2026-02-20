// mining.js
const BASE_SESSION = 2 * 60 * 60; // 2 часа
const BASE_BLOCK_REWARD = 100; // Базовая награда за блок
const BLOCK_TIME = 60; // Время на добычу блока в секундах

// Глобальное состояние блоков (начинаем с блока #1)
let currentBlock = {
  height: 1, // Изменено с 1000001 на 1
  difficulty: 23.2,
  startTime: Date.now() / 1000,
  miners: {},
  totalHashRate: 0,
  status: 'mining', // 'mining', 'mined'
  minedBy: null,
  reward: 0
};

// Функция для обновления сложности
function updateDifficulty() {
  const onlineMiners = Object.keys(currentBlock.miners).length;
  // Сложность растет с количеством майнеров
  currentBlock.difficulty = Number((23.2 + (onlineMiners * 0.1)).toFixed(1));
  return currentBlock.difficulty;
}

// Функция для расчета награды
function calculateReward() {
  const baseReward = 100;
  const minerCount = Object.keys(currentBlock.miners).length;
  // Награда уменьшается с увеличением майнеров, но увеличивается со сложностью
  const reward = Math.floor(baseReward * (currentBlock.difficulty / 23.2) / (minerCount || 1));
  return Math.max(10, reward); // Минимальная награда 10
}

// Функция для старта майнинга пользователем
export function startMining(durationBonus = 0, userId = 'anonymous') {
  const start = Math.floor(Date.now() / 1000);
  const sessionDuration = BASE_SESSION + durationBonus;
  
  localStorage.setItem("miningStart", start);
  localStorage.setItem("miningDuration", sessionDuration);
  localStorage.setItem("userId", userId);
  
  // Регистрируем майнера в текущем блоке
  if (!currentBlock.miners[userId]) {
    currentBlock.miners[userId] = {
      hashRate: 1,
      startTime: start,
      shares: 0
    };
    updateDifficulty();
  }
  
  return { start, duration: sessionDuration };
}

// Функция для остановки майнинга
export function stopMining() {
  localStorage.removeItem("miningStart");
  localStorage.removeItem("miningDuration");
}

// Функция для обновления хешрейта майнера
export function updateMinerHashRate(userId, newHashRate) {
  if (currentBlock.miners[userId]) {
    currentBlock.miners[userId].hashRate = newHashRate;
    currentBlock.totalHashRate = Object.values(currentBlock.miners).reduce(
      (sum, miner) => sum + miner.hashRate, 0
    );
  }
}

// Функция для проверки добычи блока
function checkBlockMining() {
  const now = Date.now() / 1000;
  const timeElapsed = now - currentBlock.startTime;
  
  // Шанс найти блок зависит от общего хешрейта и времени
  const findChance = (currentBlock.totalHashRate * timeElapsed) / (currentBlock.difficulty * 100);
  
  if (Math.random() < findChance / 1000) { // Случайный шанс найти блок
    // Определяем кто нашел блок (случайным образом, но с учетом хешрейта)
    const miners = Object.entries(currentBlock.miners);
    const totalWeight = miners.reduce((sum, [_, data]) => sum + data.hashRate, 0);
    let random = Math.random() * totalWeight;
    
    for (const [userId, data] of miners) {
      random -= data.hashRate;
      if (random <= 0) {
        currentBlock.minedBy = userId;
        break;
      }
    }
    
    currentBlock.status = 'mined';
    currentBlock.reward = calculateReward();
    
    // Создаем новый блок через 5 секунд
    setTimeout(() => {
      currentBlock = {
        height: currentBlock.height + 1, // Увеличиваем номер блока
        difficulty: 23.2,
        startTime: Date.now() / 1000,
        miners: {},
        totalHashRate: 0,
        status: 'mining',
        minedBy: null,
        reward: 0
      };
    }, 5000); // 5 секунд паузы перед новым блоком
    
    return true;
  }
  
  return false;
}

// Функция для получения состояния майнинга
export function getMiningState(hashRate, userId = 'anonymous') {
  // Обновляем информацию о майнере в блоке
  if (currentBlock.miners[userId]) {
    currentBlock.miners[userId].hashRate = hashRate;
    currentBlock.totalHashRate = Object.values(currentBlock.miners).reduce(
      (sum, miner) => sum + miner.hashRate, 0
    );
  }
  
  // Проверяем добычу блока
  if (currentBlock.status === 'mining') {
    checkBlockMining();
  }
  
  const start = localStorage.getItem("miningStart");
  const duration = localStorage.getItem("miningDuration");

  if (!start || !duration) {
    return { 
      active: false, 
      earned: 0, 
      timeLeft: 0,
      block: getBlockState(),
      userBlockReward: 0
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const end = parseInt(start) + parseInt(duration);

  if (now >= end) {
    localStorage.removeItem("miningStart");
    localStorage.removeItem("miningDuration");
    
    return {
      active: false,
      earned: hashRate * parseInt(duration),
      timeLeft: 0,
      block: getBlockState(),
      userBlockReward: 0
    };
  }

  // Добавляем shares за майнинг
  if (currentBlock.miners[userId] && currentBlock.status === 'mining') {
    currentBlock.miners[userId].shares += hashRate;
  }

  return {
    active: true,
    earned: hashRate * (now - start),
    timeLeft: end - now,
    block: getBlockState(),
    userBlockReward: currentBlock.minedBy === userId ? currentBlock.reward : 0
  };
}

// Функция для получения состояния блока
export function getBlockState() {
  const onlineMiners = Object.keys(currentBlock.miners).length;
  
  return {
    height: currentBlock.height,
    difficulty: currentBlock.difficulty,
    reward: currentBlock.reward,
    online: onlineMiners,
    status: currentBlock.status,
    minedBy: currentBlock.minedBy,
    timeLeft: Math.max(0, BLOCK_TIME - ((Date.now() / 1000) - currentBlock.startTime)),
    totalHashRate: currentBlock.totalHashRate
  };
}

// Функция для получения награды за блок
export function claimBlockReward(userId) {
  if (currentBlock.minedBy === userId && currentBlock.status === 'mined') {
    const reward = currentBlock.reward;
    currentBlock.reward = 0;
    return reward;
  }
  return 0;
}

// Функция для получения статистики майнера
export function getMinerStats(userId) {
  return currentBlock.miners[userId] || { hashRate: 1, shares: 0 };
}

// Функция для сброса всех данных (для тестирования)
export function resetAllData() {
  localStorage.removeItem("miningStart");
  localStorage.removeItem("miningDuration");
  localStorage.removeItem("userId");
  localStorage.removeItem("intervals");
  localStorage.removeItem("currentInterval");
  localStorage.removeItem("lastMiningTime");
  localStorage.removeItem("energy");
  localStorage.removeItem("maxEnergy");
  
  currentBlock = {
    height: 1, // Начинаем с блока #1
    difficulty: 23.2,
    startTime: Date.now() / 1000,
    miners: {},
    totalHashRate: 0,
    status: 'mining',
    minedBy: null,
    reward: 0
  };
}

// Функция для получения времени до следующего майнинга
export function getTimeUntilNextMining(currentInterval, lastMiningTime) {
  if (!lastMiningTime) return 0;
  
  const now = Date.now();
  const nextMiningTime = lastMiningTime + (currentInterval * 60 * 60 * 1000);
  return Math.max(0, nextMiningTime - now);
}

// Функция для проверки можно ли майнить
export function canStartMining(currentInterval, lastMiningTime) {
  if (!lastMiningTime) return true;
  
  const now = Date.now();
  const nextMiningTime = lastMiningTime + (currentInterval * 60 * 60 * 1000);
  return now >= nextMiningTime;
}

// Функция для форматирования времени до следующего майнинга
export function formatTimeUntilNext(ms) {
  if (ms <= 0) return "Available";
  
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

// Функция для получения статистики текущей сессии
export function getSessionStats() {
  const start = localStorage.getItem("miningStart");
  const duration = localStorage.getItem("miningDuration");
  
  if (!start || !duration) {
    return {
      active: false,
      progress: 0,
      timeLeft: 0,
      totalTime: 0
    };
  }
  
  const now = Math.floor(Date.now() / 1000);
  const end = parseInt(start) + parseInt(duration);
  const timeLeft = Math.max(0, end - now);
  const totalTime = parseInt(duration);
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  
  return {
    active: timeLeft > 0,
    progress: Math.min(100, progress),
    timeLeft,
    totalTime
  };
}