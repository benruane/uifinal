import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

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
    { id: 'uslf_t:AMZN', label: 'AMZN (Trade, Overnight)' },
    { id: 'uslf_t:COIN', label: 'COIN (Trade, Overnight)' },
    { id: 'uslf_t:CRCL', label: 'CRCL (Trade, Overnight)' }
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

// Helper function to split assets into chunks of 4
const chunkAssets = (assets: string[], chunkSize: number = 4): string[][] => {
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
    
    // Calculate expected number of data requests (4 assets per request)
    const expectedDrCount = Math.ceil(selectedAssets.length / 4);
    
    // Initialize loading info
    setLoadingInfo({
      stage: 'preparing',
      message: `Preparing to submit ${selectedAssets.length} assets...`,
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
      const response = await fetch('/api/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets: selectedAssets })
      });

      if (!response.ok) {
        throw new Error(`Failed to submit request: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`Server response:`, data);
      
      if (data.status === 'completed' || data.status === 'processing') {
        console.log(`Successfully processed ${data.requestCount} data requests`);
        console.log(`Found ${data.totalResults} price results so far`);
        
        // Set the results immediately
        setCurrentResults(data.results || []);
        storageHelpers.setCurrentResults(data.results || []);
        
        // Initialize DR statuses
        setDrStatuses(data.drIds.map((drId: string, index: number) => ({ 
          drId, 
          status: data.status === 'completed' ? 'finalized' : 'polling',
          blockHeight: data.drBlockHeights[index]
        })));

        // Update loading info with actual server counts
        setLoadingInfo(prev => ({
          ...prev,
          stage: data.status === 'completed' ? 'completed' : 'polling',
          drCount: data.requestCount, // Use actual server count
          message: data.status === 'completed' 
            ? `✅ Data Request completed! Pulled ${data.totalResults} total prices.`
            : `⏱️ Processed ${data.requestCount} data requests in ${data.processingTime}ms. Found ${data.totalResults} results so far. Some DRs may still be processing...`,
          completedCount: data.status === 'completed' ? data.requestCount : 0
        }));

        // If some DRs are still processing, start polling for additional results
        if (data.status === 'processing' && data.drIds && data.drIds.length > 0) {
          console.log(`Starting to poll for additional results from ${data.drIds.length} DRs...`);
          
          // Start polling for additional results
          pollForAdditionalResults(data.drIds, data.drBlockHeights, data.totalResults);
        } else {
          // All done, add to history
          setTimeout(() => {
            setRequestHistory(prev => [{
              id: data.drIds[0] || 'unknown',
              timestamp: new Date().toISOString(),
              assets: selectedAssets,
              results: data.results || [],
              explorerLink: data.drBlockHeights[0] ? 
                `https://testnet.explorer.seda.xyz/data-requests/${data.drIds[0]}/${data.drBlockHeights[0]}` : '',
              requestCount: data.requestCount,
              allExplorerLinks: data.drIds.map((drId: string, index: number) => 
                `https://testnet.explorer.seda.xyz/data-requests/${drId}/${data.drBlockHeights[index]}`
              )
            }, ...prev]);
          }, 100);
        }

      } else {
        throw new Error(`Server error: ${data.error || 'Unknown server error'}`);
      }

    } catch (error) {
      console.error('Error:', error);
      setError((error as Error).message);
      // Don't dismiss the popup on error, let user see the error message
      setLoadingInfo(prev => ({
        ...prev,
        stage: 'error',
        message: `⚠️ Data Request completed with some errors. Pulled ${data.totalResults} total prices.`,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const pollForAdditionalResults = async (drIds: string[], drBlockHeights: string[], initialResultCount: number) => {
    const maxPollingAttempts = 60; // Poll for up to 2 minutes
    let attempts = 0;
    let totalResults = initialResultCount;

    // Wait 15 seconds before starting polling
    setLoadingInfo(prev => ({
      ...prev,
      message: `⏳ Waiting for SEDA Network to finalize results...`,
    }));
    await new Promise(res => setTimeout(res, 15000));
    
    const pollInterval = setInterval(async () => {
      attempts++;
      try {
        console.log(`Polling attempt ${attempts}/${maxPollingAttempts} for additional results...`);
        setLoadingInfo(prev => ({
          ...prev,
          message: `🔍 Polling for additional results... (Attempt ${attempts}/${maxPollingAttempts})`
        }));
        const response = await fetch('/api/check-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ drIds, blockHeights: drBlockHeights })
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.newResults && data.newResults.length > 0) {
          console.log(`Found ${data.newResults.length} new results!`);
          setCurrentResults(prev => {
            const newResults = [...prev];
            for (const result of data.newResults) {
              // If the result is an object with price and symbol, merge it
              if (result && typeof result === 'object' && 'symbol' in result && 'price' in result) {
                const existingIndex = newResults.findIndex(r => r.symbol === result.symbol);
                if (existingIndex >= 0) {
                  newResults[existingIndex] = result;
                } else {
                  newResults.push(result);
                }
              } else if (typeof result === 'string') {
                // If the result is a string (raw), show it as a generic result
                newResults.push({ symbol: 'RAW', price: result });
              }
            }
            console.log('Updated currentResults:', newResults);
            return newResults;
          });
          storageHelpers.setCurrentResults(currentResults);
          totalResults += data.newResults.length;
          setLoadingInfo(prev => ({
            ...prev,
            message: `✅ Found ${data.newResults.length} new results! Total: ${totalResults} results.`
          }));
        }
        if (totalResults >= selectedAssets.length || attempts >= maxPollingAttempts) {
          clearInterval(pollInterval);
          setLoadingInfo(prev => ({
            ...prev,
            stage: 'completed',
            message: `✅ Data Request completed! Pulled ${totalResults} total prices.`,
            completedCount: drIds.length
          }));
          setDrStatuses(prev => prev.map(dr => ({ ...dr, status: 'finalized' })));
          setTimeout(() => {
            setRequestHistory(prev => [{
              id: drIds[0] || 'unknown',
              timestamp: new Date().toISOString(),
              assets: selectedAssets,
              results: currentResults,
              explorerLink: drBlockHeights[0] ? 
                `https://testnet.explorer.seda.xyz/data-requests/${drIds[0]}/${drBlockHeights[0]}` : '',
              requestCount: drIds.length,
              allExplorerLinks: drIds.map((drId: string, index: number) => 
                `https://testnet.explorer.seda.xyz/data-requests/${drId}/${drBlockHeights[index]}`
              )
            }, ...prev]);
          }, 100);
        }
      } catch (error) {
        console.error(`Polling attempt ${attempts} failed:`, error);
        if (attempts >= maxPollingAttempts) {
          clearInterval(pollInterval);
          setLoadingInfo(prev => ({
            ...prev,
            stage: 'completed',
            message: `⚠️ Polling completed with some errors. Found ${totalResults} results.`,
            completedCount: drIds.length
          }));
        }
      }
    }, 2000); // Poll every 2 seconds
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
                <div key={`${result.symbol || 'unknown'}-${index}`} className="result-card">
                  <div className="result-symbol">{result.symbol}</div>
                  <div className="result-price">${typeof result.price === 'number' ? result.price.toFixed(2) : '--'}</div>
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
              {requestHistory.slice(0, 5).map((history, idx) => (
                <div key={`${history.id || 'unknown'}-${history.timestamp || idx}`} className="history-item">
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
                      <span key={`${result.symbol || 'unknown'}-${index}`} className="history-result">
                        {result.symbol}: ${typeof result.price === 'number' ? result.price.toFixed(2) : '--'}
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
              {loadingInfo.stage === 'completed' ? (
                <div className="checkmark-large" style={{ margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
              ) : (
                <div className="loading-spinner-large" style={{ margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
              )}
              <h3 style={{ textAlign: 'center' }}>
                {loadingInfo.stage === 'completed' ? 'Data Request Complete' : 'Processing Data Request'}
              </h3>
            </div>
            
            <div className="loading-content">
              <div className="loading-message">
                {/* Replace polling completed message with new text */}
                {loadingInfo.message && loadingInfo.message.includes('✅ Polling completed! Found')
                  ? loadingInfo.message.replace(/✅ Polling completed! Found (\d+) total results\./, '✅ Data Request completed! Pulled $1 total prices.')
                  : loadingInfo.message}
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
              {/* Hide 'What's happening:' section after all results are returned */}
              {loadingInfo.stage !== 'completed' && (
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
                        <li>🔐 Reading chain data</li>
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
                  </ul>
                </div>
              )}
              
              {/* Price Results Table - Replace tips section */}
              {currentResults.length > 0 && (
                <div className="price-results-table">
                  <h4>📊 Price Results:</h4>
                  <div className="price-table">
                    {currentResults.map((result, index) => (
                      <div key={`${result.symbol || 'unknown'}-${index}`} className="price-row">
                        <span className="price-symbol">{result.symbol}</span>
                        <span className="price-value">${typeof result.price === 'number' ? result.price.toFixed(2) : '--'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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