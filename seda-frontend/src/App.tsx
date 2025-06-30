import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { submitDataRequest, pollDataRequest } from './api';

// Asset categories and their available symbols
const ASSET_CATEGORIES = {
  'US Equities & ETFs': [
    { id: 'equity:AAPL', label: 'Apple Inc. (AAPL)' },
    { id: 'equity:MSFT', label: 'Microsoft Corp. (MSFT)' },
    { id: 'equity:TSLA', label: 'Tesla Inc. (TSLA)' },
    { id: 'equity:AMZN', label: 'Amazon.com Inc. (AMZN)' },
    { id: 'equity:NVDA', label: 'NVIDIA Corp. (NVDA)' },
    { id: 'equity:GOOG', label: 'Alphabet Inc. (GOOG)' },
    { id: 'equity:META', label: 'Meta Platforms Inc. (META)' },
    { id: 'equity:UNH', label: 'UnitedHealth Group Inc. (UNH)' },
    { id: 'equity:SPY', label: 'SPDR S&P 500 ETF (SPY)' }
  ],
  'Forex (*/USD)': [
    { id: 'fx:EUR', label: 'EUR/USD' },
    { id: 'fx:GBP', label: 'GBP/USD' }
  ],
  'Forex Reverse (USD/*)': [
    { id: 'fx_r:JPY', label: 'USD/JPY' }
  ],
  'Commodities (CFD)': [
    { id: 'cfd:XAU:USD', label: 'Gold (XAU/USD)' },
    { id: 'cfd:WTI:USD', label: 'WTI Crude Oil (WTI/USD)' },
    { id: 'cfd:BRN:USD', label: 'Brent Crude Oil (BRN/USD)' }
  ],
  'US Listed Funds - Trade (Overnight Session)': [
    { id: 'uslf_t:NVDA', label: 'NVDA (Trade, Overnight)' },
    { id: 'uslf_t:TSLA', label: 'TSLA (Trade, Overnight)' },
    { id: 'uslf_t:GOOG', label: 'GOOG (Trade, Overnight)' },
    { id: 'uslf_t:AAPL', label: 'AAPL (Trade, Overnight)' },
    { id: 'uslf_t:UNH', label: 'UNH (Trade, Overnight)' },
    { id: 'uslf_t:META', label: 'META (Trade, Overnight)' },
    { id: 'uslf_t:MSFT', label: 'MSFT (Trade, Overnight)' },
    { id: 'uslf_t:SPY', label: 'SPY (Trade, Overnight)' },
    { id: 'uslf_t:AMZN', label: 'AMZN (Trade, Overnight)' }
  ]
};

// LocalStorage keys
const STORAGE_KEYS = {
  CURRENT_RESULTS: 'seda_current_results',
  REQUEST_HISTORY: 'seda_request_history',
  SELECTED_ASSETS: 'seda_selected_assets'
};

// Helper functions for localStorage
const storageHelpers = {
  getCurrentResults: (): PriceResult[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_RESULTS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load current results from localStorage:', error);
      return [];
    }
  },

  setCurrentResults: (results: PriceResult[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_RESULTS, JSON.stringify(results));
    } catch (error) {
      console.warn('Failed to save current results to localStorage:', error);
    }
  },

  getRequestHistory: (): DataRequestHistory[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REQUEST_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load request history from localStorage:', error);
      return [];
    }
  },

  setRequestHistory: (history: DataRequestHistory[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.REQUEST_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save request history to localStorage:', error);
    }
  },

  getSelectedAssets: (): string[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_ASSETS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load selected assets from localStorage:', error);
      return [];
    }
  },

  setSelectedAssets: (assets: string[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_ASSETS, JSON.stringify(assets));
    } catch (error) {
      console.warn('Failed to save selected assets to localStorage:', error);
    }
  },

  clearCurrentResults: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_RESULTS);
    } catch (error) {
      console.warn('Failed to clear current results from localStorage:', error);
    }
  }
};

// Helper function to map backend symbols to frontend asset IDs
const mapBackendSymbolToAssetId = (backendSymbol: string): string | null => {
  // First, try exact match with asset IDs
  for (const [category, assets] of Object.entries(ASSET_CATEGORIES)) {
    for (const asset of assets) {
      if (asset.id === backendSymbol) {
        return asset.id;
      }
    }
  }
  
  // Handle different symbol formats
  let baseSymbol = backendSymbol;
  let symbolType = '';
  
  // Remove common suffixes and determine symbol type
  if (backendSymbol.includes(':USLF24')) {
    baseSymbol = backendSymbol.split(':USLF24')[0];
    symbolType = 'uslf';
  } else if (backendSymbol.includes(':BFX')) {
    baseSymbol = backendSymbol.split(':BFX')[0];
    symbolType = 'cfd';
  } else if (backendSymbol.includes('/')) {
    // Handle forex and commodity pairs
    if (backendSymbol.includes('USD/')) {
      symbolType = 'fx_r'; // Reverse forex
    } else if (backendSymbol.endsWith('/USD')) {
      symbolType = 'fx'; // Forward forex
    } else {
      symbolType = 'cfd'; // Commodities
    }
  } else if (backendSymbol.includes(':')) {
    // For other formats like "fx:EUR", "cfd:XAU:USD", etc.
    const parts = backendSymbol.split(':');
    if (parts.length >= 2) {
      baseSymbol = parts[1]; // Take the second part (e.g., "EUR" from "fx:EUR")
      symbolType = parts[0]; // Take the first part as type
    }
  }
  
  // Find the asset ID that matches this base symbol and type
  for (const [category, assets] of Object.entries(ASSET_CATEGORIES)) {
    for (const asset of assets) {
      const assetParts = asset.id.split(':');
      const assetType = assetParts[0];
      const assetBaseSymbol = assetParts.slice(1).join(':'); // Handle multiple colons like "cfd:XAU:USD"
      
      // Handle forex pairs (e.g., "GBP/USD" should match "fx:GBP")
      if (baseSymbol.includes('/')) {
        const [from, to] = baseSymbol.split('/');
        if (to === 'USD' && assetType === 'fx' && assetBaseSymbol === from) {
          return asset.id;
        }
        if (from === 'USD' && assetType === 'fx_r' && assetBaseSymbol === to) {
          return asset.id;
        }
        if (assetType === 'cfd' && assetBaseSymbol === baseSymbol) {
          return asset.id;
        }
      }
      
      // Handle USLF symbols
      if (symbolType === 'uslf' && assetType.startsWith('uslf_') && assetBaseSymbol === baseSymbol) {
        return asset.id;
      }
      
      // Handle equity symbols
      if (symbolType === 'equity' && assetType === 'equity' && assetBaseSymbol === baseSymbol) {
        return asset.id;
      }
      
      // Handle simple symbol matches
      if (assetBaseSymbol === baseSymbol) {
        return asset.id;
      }
    }
  }
  
  return null;
};

// Helper function to check if a result matches an asset
const resultMatchesAsset = (result: PriceResult, assetId: string): boolean => {
  const mappedAssetId = mapBackendSymbolToAssetId(result.symbol);
  return mappedAssetId === assetId;
};

// Helper function to get asset label by ID
const getAssetLabel = (assetId: string): string => {
  for (const [category, assets] of Object.entries(ASSET_CATEGORIES)) {
    for (const asset of assets) {
      if (asset.id === assetId) {
        return asset.label;
      }
    }
  }
  return assetId;
};

// Helper function to get all asset IDs from a category
const getCategoryAssetIds = (categoryName: string): string[] => {
  const category = ASSET_CATEGORIES[categoryName as keyof typeof ASSET_CATEGORIES];
  return category ? category.map(asset => asset.id) : [];
};

// Helper function to split assets into chunks of 8
const chunkAssets = (assets: string[], chunkSize: number = 8): string[][] => {
  const chunks: string[][] = [];
  for (let i = 0; i < assets.length; i += chunkSize) {
    chunks.push(assets.slice(i, i + chunkSize));
  }
  return chunks;
};

// Types
interface PriceResult {
  symbol: string;
  price: number;
}

interface DataRequestHistory {
  id: string;
  timestamp: string;
  assets: string[];
  results: PriceResult[];
  explorerLink: string;
  requestCount: number;
  allExplorerLinks: string[];
}

interface DRStatus {
  drId: string;
  status: 'pending' | 'polling' | 'finalized' | 'error' | 'no_data';
  blockHeight?: string;
  results?: PriceResult[];
  error?: string;
}

function App() {
  const [selectedAssets, setSelectedAssets] = useState<string[]>(storageHelpers.getSelectedAssets());
  const [currentResults, setCurrentResults] = useState<PriceResult[]>(storageHelpers.getCurrentResults());
  const [requestHistory, setRequestHistory] = useState<DataRequestHistory[]>(storageHelpers.getRequestHistory());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [drStatuses, setDrStatuses] = useState<DRStatus[]>([]);
  const [showLoadingPopup, setShowLoadingPopup] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState({
    stage: '',
    message: '',
    drCount: 0,
    completedCount: 0,
    totalAssets: 0
  });

  // Save selected assets to localStorage whenever they change
  useEffect(() => {
    storageHelpers.setSelectedAssets(selectedAssets);
  }, [selectedAssets]);

  // Save request history to localStorage whenever it changes
  useEffect(() => {
    storageHelpers.setRequestHistory(requestHistory);
  }, [requestHistory]);

  // Save current results to localStorage whenever they change
  useEffect(() => {
    storageHelpers.setCurrentResults(currentResults);
  }, [currentResults]);

  const handleAssetToggle = (assetId: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleSelectAllAssets = () => {
    const allAssetIds = Object.values(ASSET_CATEGORIES).flat().map(asset => asset.id);
    setSelectedAssets(allAssetIds);
  };

  const handleSelectCategory = (categoryName: string) => {
    const categoryAssetIds = getCategoryAssetIds(categoryName);
    setSelectedAssets(prev => {
      const newSelection = [...prev];
      for (const assetId of categoryAssetIds) {
        if (!newSelection.includes(assetId)) {
          newSelection.push(assetId);
        }
      }
      return newSelection;
    });
  };

  const handleClearSelection = () => {
    setSelectedAssets([]);
  };

  const handlePullPrices = async () => {
    if (selectedAssets.length === 0) {
      setError('Please select at least one asset');
      return;
    }

    setIsLoading(true);
    setError('');
    setShowLoadingPopup(true);
    
    // Calculate expected number of data requests (3 assets per request)
    const expectedDrCount = Math.ceil(selectedAssets.length / 3);
    
    // Initialize loading info
    setLoadingInfo({
      stage: 'preparing',
      message: `Preparing to submit ${selectedAssets.length} assets in ${expectedDrCount} data request${expectedDrCount > 1 ? 's' : ''}...`,
      drCount: expectedDrCount,
      completedCount: 0,
      totalAssets: selectedAssets.length
    });
    
    // Clear previous results
    storageHelpers.clearCurrentResults();
    setCurrentResults([]);
    setDrStatuses([]);

    try {
      console.log(`Submitting ${selectedAssets.length} assets in ${expectedDrCount} requests`);

      // Update loading stage
      setLoadingInfo(prev => ({
        ...prev,
        stage: 'submitting',
        message: `Submitting data requests to SEDA Network...`
      }));

      // Submit all assets
      const data = await submitDataRequest(selectedAssets);
      
      if (data.status === 'completed' && data.results) {
        console.log(`Successfully completed ${data.requestCount} data requests`);
        console.log(`Found ${data.totalResults} price results`);
        
        // Update loading info
        setLoadingInfo(prev => ({
          ...prev,
          stage: 'completed',
          message: `✅ Successfully completed ${data.requestCount} data request${data.requestCount > 1 ? 's' : ''}! Found ${data.totalResults} price results.`,
          completedCount: data.requestCount
        }));
        
        // Set the results immediately
        setCurrentResults(data.results);
        storageHelpers.setCurrentResults(data.results);
        
        // Initialize DR statuses as completed
        setDrStatuses(data.drIds.map((drId: string, index: number) => ({ 
          drId, 
          status: 'finalized',
          blockHeight: data.drBlockHeights[index]
        })));

        // Add to history
        setTimeout(() => {
          setRequestHistory(prev => [{
            id: data.drIds[0] || 'unknown',
            timestamp: new Date().toISOString(),
            assets: selectedAssets,
            results: data.results,
            explorerLink: data.drBlockHeights[0] ? 
              `https://testnet.explorer.seda.xyz/data-requests/${data.drIds[0]}/${data.drBlockHeights[0]}` : '',
            requestCount: data.requestCount,
            allExplorerLinks: data.drIds.map((drId: string, index: number) => 
              `https://testnet.explorer.seda.xyz/data-requests/${drId}/${data.drBlockHeights[index]}`
            )
          }, ...prev]);
        }, 100);

      } else {
        throw new Error(`Invalid response from server: ${data.error || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Error:', error);
      setError((error as Error).message);
      setShowLoadingPopup(false);
    } finally {
      setIsLoading(false);
    }
  };

  const startPollingForResults = async (drIds: string[], drBlockHeights: string[]) => {
    // Update loading info for polling stage
    setLoadingInfo(prev => ({
      ...prev,
      stage: 'polling',
      message: `🔍 Polling SEDA Network for results... This may take 30-60 seconds as we wait for consensus.`
    }));

    // Poll all DRs in parallel
    await Promise.all(drIds.map(async (drId: string, idx: number) => {
      setDrStatuses(prev => prev.map((dr, i) => i === idx ? { ...dr, status: 'polling' } : dr));
      
      const maxAttempts = 30;
      let attempts = 0;
      let finalized = false;
      
      while (attempts < maxAttempts && !finalized) {
        try {
          // Update loading info with attempt count
          setLoadingInfo(prev => ({
            ...prev,
            message: `🔍 Polling SEDA Network for results... (Attempt ${attempts + 1}/${maxAttempts})`
          }));

          const data = await pollDataRequest(drId, 'latest');
          
          if (data.status === 'ok' && data.result) {
            // Successfully got results
            const parsedResults: PriceResult[] = Array.isArray(data.result) ? data.result : [];
            
            setDrStatuses(prev => prev.map((dr, i) =>
              i === idx
                ? {
                    ...dr,
                    status: parsedResults.length > 0 ? 'finalized' : 'no_data',
                    blockHeight: data.blockHeight,
                    results: parsedResults,
                  }
                : dr
            ));
            
            // Update loading info with success
            setLoadingInfo(prev => ({
              ...prev,
              completedCount: prev.completedCount + 1,
              message: `✅ Data Request ${idx + 1} completed! (${prev.completedCount + 1}/${prev.drCount})`
            }));
            
            // Add new results to the main results array
            setCurrentResults(prev => {
              const newResults = [...prev];
              for (const result of parsedResults) {
                const existingIndex = newResults.findIndex(r => r.symbol === result.symbol);
                if (existingIndex >= 0) {
                  newResults[existingIndex] = result;
                } else {
                  newResults.push(result);
                }
              }
              return newResults;
            });
            
            finalized = true;
          } else if (data.status === 'no_result') {
            // DR found but no result data
            setDrStatuses(prev => prev.map((dr, i) =>
              i === idx
                ? {
                    ...dr,
                    status: 'no_data',
                    blockHeight: data.blockHeight,
                    results: [],
                  }
                : dr
            ));
            
            setLoadingInfo(prev => ({
              ...prev,
              completedCount: prev.completedCount + 1,
              message: `⚠️ Data Request ${idx + 1} completed but no data available (${prev.completedCount + 1}/${prev.drCount})`
            }));
            
            finalized = true;
          } else if (data.status === 'not_found' || data.status === 'batch_not_found') {
            // DR not found yet, continue polling
            console.log(`DR ${drId} not found yet (attempt ${attempts + 1})`);
          }
        } catch (error) {
          if (attempts === maxAttempts - 1) {
            setDrStatuses(prev => prev.map((dr, i) =>
              i === idx ? { ...dr, status: 'error', error: (error as Error).message } : dr
            ));
            
            setLoadingInfo(prev => ({
              ...prev,
              completedCount: prev.completedCount + 1,
              message: `❌ Data Request ${idx + 1} failed: ${(error as Error).message} (${prev.completedCount + 1}/${prev.drCount})`
            }));
          }
        }
        attempts++;
        if (!finalized) await new Promise(res => setTimeout(res, 2000));
      }
      
      if (!finalized) {
        setDrStatuses(prev => prev.map((dr, i) =>
          i === idx ? { ...dr, status: 'error', error: 'Timeout or unknown error' } : dr
        ));
        
        setLoadingInfo(prev => ({
          ...prev,
          completedCount: prev.completedCount + 1,
          message: `❌ Data Request ${idx + 1} timed out (${prev.completedCount + 1}/${prev.drCount})`
        }));
      }
    }));
    
    // All polling completed
    setLoadingInfo(prev => ({
      ...prev,
      stage: 'completed',
      message: `🎉 All data requests completed! ${prev.completedCount}/${prev.drCount} requests processed.`
    }));
    
    // Close loading popup after a short delay
    setTimeout(() => {
      setShowLoadingPopup(false);
    }, 3000);
    
    // Update explorer links
    setDrStatuses(prev => {
      const updatedDrStatuses = prev.filter(dr => dr.blockHeight);
      
      if (updatedDrStatuses.length > 0) {
        setCurrentResults(prev => {
          const newResults = [...prev];
          for (const result of updatedDrStatuses) {
            if (result.results) {
              for (const priceResult of result.results) {
                const existingIndex = newResults.findIndex(r => r.symbol === priceResult.symbol);
                if (existingIndex >= 0) {
                  newResults[existingIndex] = priceResult;
                } else {
                  newResults.push(priceResult);
                }
              }
            }
          }
          return newResults;
        });
      }
      
      return prev;
    });
    
    // Add to history
    setTimeout(() => {
      setRequestHistory(prev => [{
        id: drIds[0] || 'unknown',
        timestamp: new Date().toISOString(),
        assets: selectedAssets,
        results: currentResults,
        explorerLink: drStatuses[0] && drStatuses[0].blockHeight ? 
          `https://testnet.explorer.seda.xyz/data-requests/${drStatuses[0].drId}/${drStatuses[0].blockHeight}` : '',
        requestCount: drIds.length,
        allExplorerLinks: drStatuses.filter(dr => dr.blockHeight).map(dr => 
          `https://testnet.explorer.seda.xyz/data-requests/${dr.drId}/${dr.blockHeight}`
        )
      }, ...prev]);
    }, 100);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This will remove all results and history.')) {
      storageHelpers.clearCurrentResults();
      storageHelpers.setRequestHistory([]);
      storageHelpers.setSelectedAssets([]);
      setCurrentResults([]);
      setRequestHistory([]);
      setSelectedAssets([]);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-top">
            <div className="logo-section">
              <div className="seda-logo-container">
                <img 
                  src="https://cdn.prod.website-files.com/672ce6bb6218cb69510f13e8/675b12e267dc6bc37ce28c83_SEDA%20Logo%20White%20(1).svg" 
                  alt="SEDA" 
                  className="seda-logo"
                />
              </div>
              <div className="seda-title">
                <h1>Asset Price Oracle</h1>
                <p>Real-time market data powered by SEDA Network</p>
              </div>
              <div className="data-provider">
                <span className="data-by">Data by</span>
                <div className="dxfeeds-logo">
                  <img 
                    src="https://dxfeed.com/wp-content/themes/dxfeed_new/dist/images/logo-dxFeed-white.a620287d.svg" 
                    alt="DxFeeds" 
                    className="dxfeeds-logo-img"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="main-content">
        {/* Asset selection */}
        <section className="asset-selection">
          <div className="selection-controls">
            <h2>Select Assets</h2>
            <div className="control-buttons">
              <button className="btn btn-secondary btn-small" onClick={handleSelectAllAssets}>
                Select All
              </button>
              <button className="btn btn-secondary btn-small" onClick={handleClearSelection}>
                Clear
              </button>
            </div>
          </div>

          {Object.entries(ASSET_CATEGORIES).map(([categoryName, assets]) => (
            <div key={categoryName} className="asset-category">
              <div className="category-header">
                <h3>{categoryName}</h3>
                <button 
                  className="btn btn-secondary btn-small" 
                  onClick={() => handleSelectCategory(categoryName)}
                >
                  Select Category
                </button>
              </div>
              <div className="asset-grid">
                {assets.map((asset) => (
                  <label key={asset.id} className="asset-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedAssets.includes(asset.id)}
                      onChange={() => handleAssetToggle(asset.id)}
                    />
                    <span>{asset.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Action section */}
        <section className="action-section">
          <div className="selection-summary">
            <p>
              <strong>{selectedAssets.length}</strong> assets selected
            </p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handlePullPrices}
            disabled={selectedAssets.length === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Processing...
              </>
            ) : (
              'Pull Prices'
            )}
          </button>
        </section>

        {/* Results section */}
        {currentResults.length > 0 && (
          <section className="results-section">
            <div className="results-header">
              <h2>Current Results</h2>
              <div className="results-controls">
                <div className="dropdown">
                  <button className="btn btn-secondary btn-small">Actions</button>
                  <div className="dropdown-content">
                    <a href="#" onClick={clearAllData}>Clear All Data</a>
                    <a href="#" onClick={() => setShowModal(true)}>View History</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="results-grid">
              {currentResults.map((result, index) => (
                <div key={index} className="result-card">
                  <div className="result-symbol">{result.symbol}</div>
                  <div className="result-price">${result.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* History section */}
        {requestHistory.length > 0 && (
          <section className="history-section">
            <div className="history-header">
              <h2>Request History</h2>
            </div>
            <div className="history-list">
              {requestHistory.slice(0, 5).map((history) => (
                <div key={history.id} className="history-item">
                  <div className="history-info">
                    <div className="history-time">{history.timestamp}</div>
                    <a href={history.explorerLink} target="_blank" rel="noopener noreferrer" className="history-more">
                      View on Explorer
                    </a>
                  </div>
                  <div className="history-assets">
                    {history.assets.length} assets • {history.requestCount} requests
                  </div>
                  <div className="history-results">
                    {history.results.slice(0, 3).map((result, index) => (
                      <span key={index} className="history-result">
                        {result.symbol}: ${result.price.toFixed(2)}
                      </span>
                    ))}
                    {history.results.length > 3 && (
                      <span className="history-result">+{history.results.length - 3} more</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Loading Popup */}
      {showLoadingPopup && (
        <div className="loading-popup-overlay">
          <div className="loading-popup">
            <div className="loading-header">
              <div className="loading-spinner-large"></div>
              <h3>SEDA Network Processing</h3>
            </div>
            
            <div className="loading-content">
              <div className="loading-message">
                {loadingInfo.message}
              </div>
              
              <div className="loading-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(loadingInfo.completedCount / loadingInfo.drCount) * 100}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  {loadingInfo.completedCount} of {loadingInfo.drCount} data requests completed
                </div>
              </div>
              
              <div className="loading-info">
                <h4>What's happening:</h4>
                <ul>
                  {loadingInfo.stage === 'preparing' && (
                    <>
                      <li>📊 Preparing {loadingInfo.totalAssets} assets for submission</li>
                      <li>🔧 Splitting into {loadingInfo.drCount} data requests (8 assets per request)</li>
                      <li>⚡ Optimizing for SEDA Network efficiency</li>
                    </>
                  )}
                  {loadingInfo.stage === 'submitting' && (
                    <>
                      <li>🚀 Submitting data requests to SEDA Network</li>
                      <li>💰 Calculating gas requirements</li>
                      <li>🔐 Signing transactions with your wallet</li>
                    </>
                  )}
                  {loadingInfo.stage === 'submitted' && (
                    <>
                      <li>✅ Data requests successfully submitted!</li>
                      <li>🌐 Waiting for SEDA Network consensus</li>
                      <li>⏱️ This typically takes 30-60 seconds</li>
                    </>
                  )}
                  {loadingInfo.stage === 'polling' && (
                    <>
                      <li>🔍 Polling SEDA Network for results</li>
                      <li>🤝 Waiting for validator consensus</li>
                      <li>📈 Fetching real-time market data</li>
                    </>
                  )}
                  {loadingInfo.stage === 'completed' && (
                    <>
                      <li>🎉 All data requests completed!</li>
                      <li>💾 Results stored in browser cache</li>
                      <li>📊 Ready to view your price data</li>
                    </>
                  )}
                </ul>
              </div>
              
              <div className="loading-tips">
                <h4>💡 Tips:</h4>
                <ul>
                  <li>Don't close this window - results will appear automatically</li>
                  <li>You can view your data requests on the SEDA Explorer</li>
                  <li>Results are cached locally for quick access</li>
                </ul>
              </div>
            </div>
            
            <div className="loading-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowLoadingPopup(false)}
                disabled={loadingInfo.stage !== 'completed'}
              >
                {loadingInfo.stage === 'completed' ? 'Close' : 'Processing...'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Data Request Status</h3>
            <p>Monitoring data request progress...</p>
            <div className="dr-status">
              {drStatuses.map((status, index) => (
                <div key={index} className={`dr-item ${status.status}`}>
                  <div>
                    <strong>DR {index + 1}:</strong> {status.status}
                    {status.blockHeight && <span> • Block: {status.blockHeight}</span>}
                    {status.error && <div className="error">{status.error}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
}

// Render the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} 