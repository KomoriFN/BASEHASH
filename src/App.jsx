import { useEffect, useState, useRef } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { injected } from "wagmi/connectors";
import { 
  startMining, 
  getMiningState, 
  getBlockState,
  updateMinerHashRate,
  getMinerStats,
  stopMining 
} from "./mining";
import MatrixBackground from "./MatrixBackground";
import "./styles.css";
import bellIcon from './assets/bell.png';

// Constants for Daily Check-in
const CHECKIN_COST_USD = 0.01; // $0.01
const CHECKIN_REWARD_BH = 500; // Reward in BH
const CHECKIN_COOLDOWN_HOURS = 24; // 24 hours

export default function App() {
  const [hashRate, setHashRate] = useState(1);
  const [balance, setBalance] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [active, setActive] = useState(false);
  const [durationBonus, setDurationBonus] = useState(0);
  const [shares, setShares] = useState(0);
  const [totalHashes, setTotalHashes] = useState(0);
  
  // Energy
  const [maxEnergy, setMaxEnergy] = useState(2000);
  const [energy, setEnergy] = useState(2000);
  const [energyConsumptionRate, setEnergyConsumptionRate] = useState(1);
  
  // Block state
  const [blockHeight, setBlockHeight] = useState(1);
  const [difficulty, setDifficulty] = useState(23.2);
  const [blockReward, setBlockReward] = useState(0);
  const [online, setOnline] = useState(0);
  const [blockStatus, setBlockStatus] = useState('mining');
  const [blockMinedBy, setBlockMinedBy] = useState(null);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);
  
  // Active tab
  const [activeTab, setActiveTab] = useState('mine');
  
  // Entry intervals
  const [intervals, setIntervals] = useState([
    { id: 1, hours: 2, cost: 0, purchased: true },
    { id: 2, hours: 4, cost: 500, purchased: false },
    { id: 3, hours: 6, cost: 1500, purchased: false },
    { id: 4, hours: 8, cost: 3000, purchased: false },
    { id: 5, hours: 10, cost: 5000, purchased: false },
    { id: 6, hours: 12, cost: 8000, purchased: false }
  ]);
  
  const [currentInterval, setCurrentInterval] = useState(2);
  const [lastMiningTime, setLastMiningTime] = useState(null);
  const [timeUntilNextMining, setTimeUntilNextMining] = useState(0);
  const [canMine, setCanMine] = useState(true);
  
  // Daily Check-in
  const [lastCheckin, setLastCheckin] = useState(null);
  const [timeUntilNextCheckin, setTimeUntilNextCheckin] = useState(0);
  const [canCheckin, setCanCheckin] = useState(true);
  const [ethPrice, setEthPrice] = useState(null);
  const [checkinCostEth, setCheckinCostEth] = useState(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Refs
  const notificationRef = useRef(null);
  const bellRef = useRef(null);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: injected(),
  });
  const { disconnect } = useDisconnect();
  const { data: ethBalance } = useBalance({
    address: address,
  });

  const userId = address || 'anonymous';

  // Fetch ETH price
  useEffect(() => {
    fetchEthPrice();
    const interval = setInterval(fetchEthPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchEthPrice() {
    setIsLoadingPrice(true);
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await response.json();
      const price = data.ethereum.usd;
      setEthPrice(price);
      const costInEth = CHECKIN_COST_USD / price;
      setCheckinCostEth(costInEth);
    } catch (error) {
      console.error('Error fetching ETH price:', error);
      const fallbackPrice = 2000;
      setEthPrice(fallbackPrice);
      setCheckinCostEth(CHECKIN_COST_USD / fallbackPrice);
    } finally {
      setIsLoadingPrice(false);
    }
  }

  // Load saved data - ВКЛЮЧАЯ БАЛАНС
  useEffect(() => {
    const savedIntervals = localStorage.getItem('intervals');
    const savedCurrentInterval = localStorage.getItem('currentInterval');
    const savedLastMiningTime = localStorage.getItem('lastMiningTime');
    const savedEnergy = localStorage.getItem('energy');
    const savedMaxEnergy = localStorage.getItem('maxEnergy');
    const savedLastCheckin = localStorage.getItem('lastCheckin');
    const savedBalance = localStorage.getItem('balance');
    const savedHashRate = localStorage.getItem('hashRate');
    const savedDurationBonus = localStorage.getItem('durationBonus');
    
    if (savedIntervals) {
      setIntervals(JSON.parse(savedIntervals));
    }
    if (savedCurrentInterval) {
      setCurrentInterval(parseInt(savedCurrentInterval));
    }
    if (savedLastMiningTime) {
      setLastMiningTime(parseInt(savedLastMiningTime));
    }
    if (savedEnergy) {
      setEnergy(parseInt(savedEnergy));
    }
    if (savedMaxEnergy) {
      setMaxEnergy(parseInt(savedMaxEnergy));
    }
    if (savedLastCheckin) {
      setLastCheckin(parseInt(savedLastCheckin));
    }
    if (savedBalance) {
      setBalance(parseInt(savedBalance));
    }
    if (savedHashRate) {
      setHashRate(parseInt(savedHashRate));
    }
    if (savedDurationBonus) {
      setDurationBonus(parseInt(savedDurationBonus));
    }
  }, []);

  // Save data - ВКЛЮЧАЯ БАЛАНС
  useEffect(() => {
    localStorage.setItem('intervals', JSON.stringify(intervals));
    localStorage.setItem('currentInterval', currentInterval.toString());
    if (lastMiningTime) {
      localStorage.setItem('lastMiningTime', lastMiningTime.toString());
    }
    localStorage.setItem('energy', energy.toString());
    localStorage.setItem('maxEnergy', maxEnergy.toString());
    if (lastCheckin) {
      localStorage.setItem('lastCheckin', lastCheckin.toString());
    }
    localStorage.setItem('balance', balance.toString());
    localStorage.setItem('hashRate', hashRate.toString());
    localStorage.setItem('durationBonus', durationBonus.toString());
  }, [intervals, currentInterval, lastMiningTime, energy, maxEnergy, lastCheckin, balance, hashRate, durationBonus]);

  // Update mining timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastMiningTime) {
        const now = Date.now();
        const nextMiningTime = lastMiningTime + (currentInterval * 60 * 60 * 1000);
        const timeLeft = Math.max(0, nextMiningTime - now);
        
        setTimeUntilNextMining(timeLeft);
        setCanMine(timeLeft <= 0);
        
        if (timeLeft <= 0 && timeLeft > -1000) {
          addNotification('system', '⏰ You can start new mining!');
        }
      } else {
        setCanMine(true);
        setTimeUntilNextMining(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastMiningTime, currentInterval]);

  // Update check-in timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastCheckin) {
        const now = Date.now();
        const nextCheckinTime = lastCheckin + (CHECKIN_COOLDOWN_HOURS * 60 * 60 * 1000);
        const timeLeft = Math.max(0, nextCheckinTime - now);
        
        setTimeUntilNextCheckin(timeLeft);
        setCanCheckin(timeLeft <= 0);
        
        if (timeLeft <= 0 && timeLeft > -1000) {
          addNotification('system', '🎁 Daily Check-in is available!');
        }
      } else {
        setCanCheckin(true);
        setTimeUntilNextCheckin(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastCheckin]);

  // Energy consumption during mining
  useEffect(() => {
    let energyInterval;
    
    if (active && energy > 0) {
      energyInterval = setInterval(() => {
        setEnergy(prev => {
          const newEnergy = prev - energyConsumptionRate;
          
          if (newEnergy <= 0) {
            setActive(false);
            setTimeLeft(0);
            stopMining();
            addNotification('system', '⚠️ Energy ran out! Mining stopped');
            return 0;
          }
          
          return newEnergy;
        });
      }, 1000);
    }

    return () => {
      if (energyInterval) {
        clearInterval(energyInterval);
      }
    };
  }, [active, energyConsumptionRate]);

  // Check mining session end
  useEffect(() => {
    if (active && timeLeft <= 0 && timeLeft > -1000) {
      setActive(false);
      addNotification('system', '✅ Mining session completed');
    }
  }, [timeLeft, active]);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target) &&
          bellRef.current && !bellRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add notification
  function addNotification(type, message, reward = 0) {
    const newNotification = {
      id: Date.now() + Math.random(),
      type,
      message,
      reward,
      timestamp: new Date().toLocaleTimeString(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
    
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(n => n.id === newNotification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }, 5000);
  }

  function markAllAsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  function clearNotifications() {
    setNotifications([]);
    setUnreadCount(0);
  }

  function closeNotifications() {
    setShowNotifications(false);
  }

  // Purchase interval upgrade
  function purchaseInterval(intervalId) {
    const interval = intervals.find(i => i.id === intervalId);
    
    if (!interval || interval.purchased) {
      addNotification('error', '❌ This upgrade is already purchased');
      return;
    }
    
    if (balance < interval.cost) {
      addNotification('error', `❌ Not enough BH (need ${interval.cost} BH)`);
      return;
    }
    
    setIntervals(prev => prev.map(i => 
      i.id === intervalId ? { ...i, purchased: true } : i
    ));
    
    setCurrentInterval(interval.hours);
    setBalance(prev => prev - interval.cost);
    addNotification('upgrade', `🎉 Interval increased to ${interval.hours} hours!`);
  }

  // Start mining
  function handleStart() {
    if (!isConnected) {
      addNotification('error', '❌ Connect wallet first');
      return;
    }
    
    if (!canMine) {
      const hours = Math.floor(timeUntilNextMining / (60 * 60 * 1000));
      const minutes = Math.floor((timeUntilNextMining % (60 * 60 * 1000)) / (60 * 1000));
      addNotification('error', `⏳ Wait ${hours}h ${minutes}m`);
      return;
    }
    
    if (energy <= 0) {
      addNotification('error', '❌ No energy for mining! Buy energy');
      return;
    }

    if (active) {
      addNotification('error', '❌ Mining already active');
      return;
    }
    
    // Clear any existing mining data before starting new session
    stopMining();
    
    // Start new mining session
    startMining(durationBonus, userId);
    setLastMiningTime(Date.now());
    setActive(true);
    setTotalHashes(0);
    setTimeLeft(7200 + durationBonus); // 2 hours + bonus in seconds
    
    addNotification('system', `🚀 Mining started! Energy consumption: ${energyConsumptionRate}/sec`);
  }

  // Daily Check-in
  function handleCheckin() {
    if (!isConnected) {
      addNotification('error', '❌ Connect wallet for Daily Check-in');
      return;
    }
    
    if (!canCheckin) {
      const hours = Math.floor(timeUntilNextCheckin / (60 * 60 * 1000));
      const minutes = Math.floor((timeUntilNextCheckin % (60 * 60 * 1000)) / (60 * 1000));
      addNotification('error', `⏳ Daily Check-in available in ${hours}h ${minutes}m`);
      return;
    }
    
    if (isLoadingPrice) {
      addNotification('system', '⏳ Fetching ETH price...');
      return;
    }
    
    if (!checkinCostEth) {
      addNotification('error', '❌ Failed to get ETH price');
      return;
    }
    
    if (!ethBalance || parseFloat(ethBalance.formatted) < checkinCostEth) {
      addNotification('error', `❌ Not enough ETH. Need ~${checkinCostEth.toFixed(8)} ETH ($${CHECKIN_COST_USD})`);
      return;
    }
    
    setBalance(prev => prev + CHECKIN_REWARD_BH);
    setLastCheckin(Date.now());
    addNotification('success', `🎉 Daily Check-in successful! +${CHECKIN_REWARD_BH} BH`, CHECKIN_REWARD_BH);
  }

  // Upgrades
  function upgradeDuration() {
    if (balance >= 2000) {
      setDurationBonus(durationBonus + 7200);
      setBalance(balance - 2000);
      addNotification('upgrade', '⏱️ Mining duration +2 hours');
    } else {
      addNotification('error', '❌ Not enough BH');
    }
  }

  function upgradeHashRate() {
    if (balance >= 1000) {
      const newHashRate = hashRate + 1;
      setHashRate(newHashRate);
      setBalance(balance - 1000);
      if (isConnected && active) {
        updateMinerHashRate(userId, newHashRate);
      }
      addNotification('upgrade', `⚡ Hashrate ${newHashRate} BH/sec`);
    } else {
      addNotification('error', '❌ Not enough BH');
    }
  }

  function buyEnergy() {
    if (balance >= 500) {
      setEnergy(prev => Math.min(prev + 1000, maxEnergy));
      setBalance(balance - 500);
      addNotification('upgrade', '🔋 Energy +1000');
    } else {
      addNotification('error', '❌ Not enough BH');
    }
  }

  // Time formatting
  function formatTime(seconds) {
    if (seconds <= 0) return "00:00:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function formatTimeUntilNext(ms) {
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

  function shortenAddress(str) {
    if (!str) return "";
    return str.slice(0, 6) + "..." + str.slice(-4);
  }

  function formatEthAmount(amount) {
    if (!amount) return "0 ETH";
    if (amount < 0.00001) {
      return amount.toFixed(8) + " ETH";
    }
    return amount.toFixed(6) + " ETH";
  }

  // Main mining loop
  useEffect(() => {
    let lastBlockHeight = blockHeight;

    const interval = setInterval(() => {
      const data = getMiningState(hashRate, userId);
      const blockData = getBlockState();
      
      // Update mining state
      setActive(data.active);
      setTimeLeft(data.timeLeft);
      
      // Update balance from mining
      if (data.active) {
        setBalance(data.earned);
        setShares(Math.floor(data.earned / 10));
        setTotalHashes(prev => prev + hashRate);
      } else if (data.earned > 0 && !data.active) {
        // Keep the earned balance when session ends
        setBalance(data.earned);
      }

      // Update block state
      setBlockHeight(blockData.height);
      setDifficulty(blockData.difficulty);
      setBlockReward(blockData.reward);
      setOnline(blockData.online);
      setBlockStatus(blockData.status);
      setBlockMinedBy(blockData.minedBy);
      setBlockTimeLeft(Math.floor(blockData.timeLeft));
      
      // Check for new block
      if (blockData.height > lastBlockHeight) {
        if (blockData.minedBy === userId) {
          addNotification('success', `🎉 You found block #${blockData.height}!`, blockData.reward);
          setBalance(prev => prev + blockData.reward);
        }
        lastBlockHeight = blockData.height;
      }
      
      // Update miner hash rate in block system
      if (isConnected && active) {
        updateMinerHashRate(userId, hashRate);
      }
      
    }, 1000);

    return () => clearInterval(interval);
  }, [hashRate, userId, isConnected, active]);

  return (
    <>
      <MatrixBackground />
      <div className="app-container">
        <div className="content">
          {/* Header */}
          <div className="header">
            <h1>BASEHASH</h1>
            <div className="header-actions">
              <div className="notification-bell-container" ref={bellRef}>
                <button 
                  className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <img src={bellIcon} alt="Notifications" className="bell-icon" />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="notifications-dropdown" ref={notificationRef}>
                    <div className="notifications-header">
                      <span>Notifications</span>
                      <div className="notifications-actions">
                        <button onClick={markAllAsRead}>✓</button>
                        <button onClick={clearNotifications}>🗑️</button>
                        <button onClick={closeNotifications}>✕</button>
                      </div>
                    </div>
                    <div className="notifications-list">
                      {notifications.length === 0 ? (
                        <div className="notification-empty">No notifications</div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif.id} className={`notification-item ${notif.read ? 'read' : 'unread'} ${notif.type}`}>
                            <div className="notification-message">
                              {notif.message}
                              {notif.reward > 0 && (
                                <span className="notification-reward"> +{notif.reward} BH</span>
                              )}
                            </div>
                            <div className="notification-time">{notif.timestamp}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!isConnected ? (
                <button className="connect-button" onClick={() => connect()}>
                  Connect
                </button>
              ) : (
                <div className="wallet-info">
                  <span className="wallet-address">{shortenAddress(address)}</span>
                  <span className="wallet-balance">{ethBalance ? `${parseFloat(ethBalance.formatted).toFixed(4)} ETH` : '0 ETH'}</span>
                  <button className="disconnect-button" onClick={disconnect}>✕</button>
                </div>
              )}
            </div>
          </div>

          {/* Balance and Energy */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Balance</span>
              <span className="stat-value">{Math.floor(balance)} BH</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Energy</span>
              <span className="stat-value">{Math.floor(energy)} / {maxEnergy}</span>
            </div>
          </div>

          {/* Daily Check-in */}
          <div className="checkin-container">
            <div className="checkin-header">
              <span className="checkin-title">📅 Daily Check-in</span>
              <span className="checkin-reward">+{CHECKIN_REWARD_BH} BH</span>
            </div>
            <div className="checkin-info">
              <span className="checkin-cost">
                {isLoadingPrice ? '⏳ Loading price...' : 
                 checkinCostEth ? `≈ ${formatEthAmount(checkinCostEth)} ($${CHECKIN_COST_USD})` : '⏳ Getting price...'}
              </span>
              <span className={`checkin-status ${canCheckin ? 'available' : 'waiting'}`}>
                {canCheckin ? '✅ Available' : `⏳ ${formatTimeUntilNext(timeUntilNextCheckin)}`}
              </span>
            </div>
            <button 
              className={`checkin-button ${canCheckin && isConnected && !isLoadingPrice ? 'available' : 'disabled'}`}
              onClick={handleCheckin}
              disabled={!canCheckin || !isConnected || isLoadingPrice}
            >
              🎁 Get Reward
            </button>
            {ethPrice && (
              <div className="eth-price-info">
                ETH: ${ethPrice.toFixed(2)}
              </div>
            )}
          </div>

          {/* Entry Interval */}
          <div className="interval-info">
            <span className="interval-text">Entry every {currentInterval} hours</span>
            <span className={`next-visit ${canMine ? 'available' : 'waiting'}`}>
              {canMine ? '✅ Can mine' : `⏳ Next in: ${formatTimeUntilNext(timeUntilNextMining)}`}
            </span>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button 
              className={`tab-button ${activeTab === 'mine' ? 'active' : ''}`}
              onClick={() => setActiveTab('mine')}
            >
              MINING
            </button>
            <button 
              className={`tab-button ${activeTab === 'upgrade' ? 'active' : ''}`}
              onClick={() => setActiveTab('upgrade')}
            >
              INTERVALS
            </button>
          </div>

          {/* Mining Tab */}
          {activeTab === 'mine' && (
            <>
              {/* Block Info */}
              <div className="block-info-grid">
                <div className="block-card">
                  <span className="block-label">BLOCK</span>
                  <span className="block-value">#{blockHeight.toLocaleString()}</span>
                </div>
                <div className="block-card">
                  <span className="block-label">DIFFICULTY</span>
                  <span className="block-value">{difficulty}K</span>
                </div>
                <div className="block-card">
                  <span className="block-label">REWARD</span>
                  <span className="block-value">{blockReward || '?'} BH</span>
                </div>
                <div className="block-card">
                  <span className="block-label">ONLINE</span>
                  <span className="block-value">{online}</span>
                </div>
              </div>

              {/* Mining Status */}
              <div className={`mining-status ${active ? 'active' : ''}`}>
                <div className="status-indicator"></div>
                <span>{active ? 'MINING ACTIVE' : 'WAITING'}</span>
                {active && (
                  <span className="energy-consumption">⚡ -{energyConsumptionRate}/sec</span>
                )}
              </div>

              {/* Timer */}
              <div className="timer-section">
                <div className="timer-display">
                  {active ? (
                    <>
                      <span className="timer-value">{formatTime(timeLeft)}</span>
                      <span className="timer-label">SESSION LEFT</span>
                    </>
                  ) : (
                    <>
                      <span className="timer-value">00:00:00</span>
                      <span className="timer-label">SESSION ENDED</span>
                    </>
                  )}
                </div>
              </div>

              {/* Mining Stats */}
              <div className="mining-stats">
                <div className="stat-row">
                  <span>Hash Rate</span>
                  <span className="stat-highlight">{hashRate} BH/sec</span>
                </div>
                <div className="stat-row">
                  <span>Shares</span>
                  <span>{shares}</span>
                </div>
                <div className="stat-row">
                  <span>Income</span>
                  <span className="stat-positive">+{Math.floor(balance)} BH</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="actions">
                {!isConnected ? (
                  <button className="connect-prompt" onClick={() => connect()}>
                    → CONNECT WALLET ←
                  </button>
                ) : !active ? (
                  <button 
                    className={`start-button ${!canMine || energy <= 0 ? 'disabled' : ''}`}
                    onClick={handleStart}
                    disabled={!canMine || energy <= 0}
                  >
                    {!canMine ? '⏳ WAITING' : energy <= 0 ? '🔋 NO ENERGY' : '→ START MINING ←'}
                  </button>
                ) : (
                  <button className="mining-button" disabled>
                    ⚡ MINING ⚡
                  </button>
                )}

                {isConnected && (
                  <div className="upgrade-grid">
                    <button 
                      className={`upgrade-button ${balance < 1000 ? 'disabled' : ''}`}
                      onClick={upgradeHashRate}
                      disabled={balance < 1000}
                    >
                      <span className="upgrade-icon">⚡</span>
                      <span className="upgrade-text">+1 HashRate</span>
                      <span className="upgrade-cost">1000 BH</span>
                    </button>

                    <button 
                      className={`upgrade-button ${balance < 2000 ? 'disabled' : ''}`}
                      onClick={upgradeDuration}
                      disabled={balance < 2000}
                    >
                      <span className="upgrade-icon">⏱️</span>
                      <span className="upgrade-text">+2 hours</span>
                      <span className="upgrade-cost">2000 BH</span>
                    </button>

                    <button 
                      className={`upgrade-button energy ${balance < 500 ? 'disabled' : ''}`}
                      onClick={buyEnergy}
                      disabled={balance < 500}
                    >
                      <span className="upgrade-icon">🔋</span>
                      <span className="upgrade-text">+1000 Energy</span>
                      <span className="upgrade-cost">500 BH</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Intervals Tab */}
          {activeTab === 'upgrade' && (
            <div className="upgrade-tab">
              <h2 className="upgrade-title">Entry Intervals</h2>
              <p className="upgrade-description">
                Current interval: {currentInterval} hours
              </p>
              
              <div className="interval-upgrades">
                {intervals.filter(i => i.hours > 2).map(interval => (
                  <div key={interval.id} className={`interval-card ${interval.purchased ? 'purchased' : ''}`}>
                    <div className="interval-header">
                      <span className="interval-hours">{interval.hours} hours</span>
                      {interval.purchased && interval.hours === currentInterval && (
                        <span className="current-badge">CURRENT</span>
                      )}
                    </div>
                    
                    {!interval.purchased ? (
                      <>
                        <div className="interval-cost">
                          <span>Price:</span>
                          <span className={balance >= interval.cost ? 'can-afford' : 'cannot-afford'}>
                            {interval.cost} BH
                          </span>
                        </div>
                        
                        <button 
                          className={`purchase-button ${balance >= interval.cost ? 'available' : 'unavailable'}`}
                          onClick={() => purchaseInterval(interval.id)}
                          disabled={balance < interval.cost}
                        >
                          {balance >= interval.cost ? 'Buy' : 'Not enough BH'}
                        </button>
                      </>
                    ) : (
                      <div className="purchased-interval">
                        <span className="purchased-badge">✅ PURCHASED</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="interval-info-bottom">
                <p>💡 Maximum interval: 12 hours</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}