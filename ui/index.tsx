import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Asset categories and their available symbols - only those supported by the proxy
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
    { id: 'cfd:WTI:USD', label: 'Oil - US Crude (WTI/USD)' },
    { id: 'cfd:BRN:USD', label: 'Oil - Brent Crude (BRN/USD)' }
  ],
  'US Listed Funds - Quote (Overnight Session)': [
    { id: 'uslf_q:NVDA', label: 'NVDA Quote (USLF)' },
    { id: 'uslf_q:TSLA', label: 'TSLA Quote (USLF)' },
    { id: 'uslf_q:GOOG', label: 'GOOG Quote (USLF)' },
    { id: 'uslf_q:AAPL', label: 'AAPL Quote (USLF)' },
    { id: 'uslf_q:UNH', label: 'UNH Quote (USLF)' },
    { id: 'uslf_q:META', label: 'META Quote (USLF)' },
    { id: 'uslf_q:MSFT', label: 'MSFT Quote (USLF)' },
    { id: 'uslf_q:SPY', label: 'SPY Quote (USLF)' },
    { id: 'uslf_q:AMZN', label: 'AMZN Quote (USLF)' }
  ],
  'US Listed Funds - Trade (Overnight Session)': [
    { id: 'uslf_t:NVDA', label: 'NVDA Trade (USLF)' },
    { id: 'uslf_t:TSLA', label: 'TSLA Trade (USLF)' },
    { id: 'uslf_t:GOOG', label: 'GOOG Trade (USLF)' },
    { id: 'uslf_t:AAPL', label: 'AAPL Trade (USLF)' },
    { id: 'uslf_t:UNH', label: 'UNH Trade (USLF)' },
    { id: 'uslf_t:META', label: 'META Trade (USLF)' },
    { id: 'uslf_t:MSFT', label: 'MSFT Trade (USLF)' },
    { id: 'uslf_t:SPY', label: 'SPY Trade (USLF)' },
    { id: 'uslf_t:AMZN', label: 'AMZN Trade (USLF)' }
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
  console.log('Mapping backend symbol:', backendSymbol);
  
  // First, try exact match with asset IDs
  for (const [category, assets] of Object.entries(ASSET_CATEGORIES)) {
    for (const asset of assets) {
      if (asset.id === backendSymbol) {
        console.log('Found exact match:', asset.id);
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
  
  console.log('Extracted base symbol:', baseSymbol, 'symbol type:', symbolType);
  
  // Find the asset ID that matches this base symbol and type
  for (const [category, assets] of Object.entries(ASSET_CATEGORIES)) {
    for (const asset of assets) {
      const assetParts = asset.id.split(':');
      const assetType = assetParts[0];
      const assetBaseSymbol = assetParts.slice(1).join(':'); // Handle multiple colons like "cfd:XAU:USD"
      
      console.log('Checking asset:', asset.id, 'type:', assetType, 'base symbol:', assetBaseSymbol);
      
      // Handle forex pairs (e.g., "GBP/USD" should match "fx:GBP")
      if (baseSymbol.includes('/')) {
        const [from, to] = baseSymbol.split('/');
        if (to === 'USD' && assetType === 'fx' && assetBaseSymbol === from) {
          console.log('Found forex match:', asset.id);
          return asset.id;
        }
        if (from === 'USD' && assetType === 'fx_r' && assetBaseSymbol === to) {
          console.log('Found reverse forex match:', asset.id);
          return asset.id;
        }
        if (assetType === 'cfd' && assetBaseSymbol === baseSymbol) {
          console.log('Found commodity match:', asset.id);
          return asset.id;
        }
      }
      
      // Handle USLF symbols
      if (symbolType === 'uslf' && assetType.startsWith('uslf_') && assetBaseSymbol === baseSymbol) {
        console.log('Found USLF match:', asset.id);
        return asset.id;
      }
      
      // Handle simple symbol matches
      if (assetBaseSymbol === baseSymbol) {
        console.log('Found simple match:', asset.id);
        return asset.id;
      }
    }
  }
  
  console.log('No match found for:', backendSymbol);
  return null;
};

// Helper function to check if a result matches a selected asset
const resultMatchesAsset = (result: PriceResult, assetId: string): boolean => {
  console.log('=== RESULT MATCHING DEBUG ===');
  console.log('Checking if result matches asset:', result.symbol, 'vs', assetId);
  
  // First try exact match
  if (result.symbol === assetId) {
    console.log('✅ Exact match found');
    return true;
  }
  
  // Parse the target asset ID to understand what we're looking for
  const assetParts = assetId.split(':');
  const assetType = assetParts[0];
  let assetSymbol = assetParts.slice(1).join(':'); // Handle multiple colons like "cfd:XAU:USD"
  
  // Special handling for CFD assets: convert colon to slash to match backend format
  if (assetType === 'cfd') {
    // For CFD assets, the backend uses slash format (e.g., "XAU/USD:BFX")
    // So we need to ensure our asset symbol uses slashes
    if (assetSymbol.includes(':')) {
      assetSymbol = assetSymbol.replace(':', '/');
    }
    // If no colon, the asset symbol should already be in the correct format
  }
  
  console.log('Target asset type:', assetType, 'symbol:', assetSymbol);
  console.log('Backend symbol:', result.symbol);
  
  // Handle different backend symbol formats and map to the target asset
  let matches = false;
  
  // Handle USLF symbols (e.g., "NVDA:USLF24" -> "uslf_q:NVDA" or "uslf_t:NVDA")
  if (result.symbol.includes(':USLF24')) {
    const baseSymbol = result.symbol.split(':USLF24')[0];
    console.log('USLF symbol detected, base symbol:', baseSymbol);
    if (assetType.startsWith('uslf_') && assetSymbol === baseSymbol) {
      console.log(`✅ USLF match: ${result.symbol} -> ${assetId}`);
      matches = true;
    } else {
      console.log(`❌ USLF no match: ${result.symbol} (${baseSymbol}) vs ${assetId} (${assetType}:${assetSymbol})`);
    }
  }
  // Handle BFX symbols (e.g., "XAU/USD:BFX" -> "cfd:XAU:USD")
  else if (result.symbol.includes(':BFX')) {
    const baseSymbol = result.symbol.split(':BFX')[0];
    console.log('BFX symbol detected, base symbol:', baseSymbol);
    if (assetType === 'cfd' && assetSymbol === baseSymbol) {
      console.log(`✅ BFX match: ${result.symbol} -> ${assetId}`);
      matches = true;
    } else {
      console.log(`❌ BFX no match: ${result.symbol} (${baseSymbol}) vs ${assetId} (${assetType}:${assetSymbol})`);
    }
  }
  // Handle forex pairs
  else if (result.symbol.includes('/')) {
    const [from, to] = result.symbol.split('/');
    console.log('Forex/commodity pair detected:', from, '/', to);
    
    // Forward forex (e.g., "EUR/USD" -> "fx:EUR")
    if (to === 'USD' && assetType === 'fx' && assetSymbol === from) {
      console.log(`✅ Forward forex match: ${result.symbol} -> ${assetId}`);
      matches = true;
    }
    // Reverse forex (e.g., "USD/JPY" -> "fx_r:JPY")
    else if (from === 'USD' && assetType === 'fx_r' && assetSymbol === to) {
      console.log(`✅ Reverse forex match: ${result.symbol} -> ${assetId}`);
      matches = true;
    }
    // Commodity pairs (e.g., "XAU/USD" -> "cfd:XAU:USD")
    else if (assetType === 'cfd' && assetSymbol === result.symbol) {
      console.log(`✅ Commodity match: ${result.symbol} -> ${assetId}`);
      matches = true;
    } else {
      console.log(`❌ Forex/commodity no match: ${result.symbol} vs ${assetId} (${assetType}:${assetSymbol})`);
    }
  }
  // Handle simple symbols (e.g., "AAPL" -> "equity:AAPL")
  else {
    console.log('Simple symbol detected:', result.symbol);
    if (assetType === 'equity' && assetSymbol === result.symbol) {
      console.log(`✅ Equity match: ${result.symbol} -> ${assetId}`);
      matches = true;
    } else {
      console.log(`❌ Equity no match: ${result.symbol} vs ${assetId} (${assetType}:${assetSymbol})`);
    }
  }
  
  console.log(`Final result: ${result.symbol} matches ${assetId}: ${matches}`);
  console.log('=== END RESULT MATCHING DEBUG ===');
  return matches;
};

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
  splitRequests?: boolean;
  allExplorerLinks?: string[];
  requestCount?: number;
  gasOptimization?: {
    totalEstimatedCost: string;
    chunks: Array<{
      assets: string[];
      estimatedGas: string;
      estimatedCost: string;
    }>;
  };
}

interface StepStatus {
  label: string;
  status: 'pending' | 'active' | 'done';
}

interface DRStatus {
  drId: string;
  status: 'pending' | 'polling' | 'finalized' | 'error' | 'no_data';
  blockHeight?: string;
  results?: PriceResult[];
  error?: string;
}

function App() {
  // Initialize state from localStorage
  const [selectedAssets, setSelectedAssets] = useState<string[]>(() => storageHelpers.getSelectedAssets());
  const [results, setResults] = useState<PriceResult[]>(() => storageHelpers.getCurrentResults());
  const [requestHistory, setRequestHistory] = useState<DataRequestHistory[]>(() => storageHelpers.getRequestHistory());
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLoadingPopup, setShowLoadingPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [drStatuses, setDrStatuses] = useState<DRStatus[]>([]);
  const [currentSplitRequests, setCurrentSplitRequests] = useState(false);
  const [currentRequestCount, setCurrentRequestCount] = useState(1);
  const [currentExplorerLink, setCurrentExplorerLink] = useState('');
  const [currentAllExplorerLinks, setCurrentAllExplorerLinks] = useState<string[]>([]);

  // Save selected assets to localStorage whenever they change
  useEffect(() => {
    storageHelpers.setSelectedAssets(selectedAssets);
  }, [selectedAssets]);

  // Save results to localStorage whenever they change
  useEffect(() => {
    storageHelpers.setCurrentResults(results);
  }, [results]);

  // Save request history to localStorage whenever it changes
  useEffect(() => {
    storageHelpers.setRequestHistory(requestHistory);
  }, [requestHistory]);

  const handleAssetToggle = (assetId: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  // Function to select all assets
  const handleSelectAllAssets = () => {
    const allAssets = Object.values(ASSET_CATEGORIES).flat().map(asset => asset.id);
    setSelectedAssets(allAssets);
  };

  const handlePullPrices = async () => {
    if (selectedAssets.length === 0) {
      setError('Please select at least one asset');
      return;
    }

    setIsLoading(true);
    setError('');
    
    // Clear previous results from localStorage and state
    storageHelpers.clearCurrentResults();
    setResults([]);
    
    setShowLoadingPopup(true);
    setShowSuccessPopup(false);
    setDrStatuses([]);

    try {
      // Submit the request to get DR IDs immediately
      const response = await fetch('/api/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets: selectedAssets })
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      const data = await response.json();
      if (data.status === 'submitted') {
        // Initialize DR statuses
        setDrStatuses(data.drIds.map((drId: string) => ({ drId, status: 'pending' })));
        // Start polling for results with live updates
        await startPollingForResultsLive(data.drIds, data.requestCount, data.gasOptimization);
      } else {
        // Fallback to old behavior if needed
        setResults(data.results || []);
        setCurrentSplitRequests(data.isSplit || false);
        setCurrentRequestCount(data.requestCount || 1);
        setCurrentExplorerLink(data.drIds?.[0] ? 
          `https://testnet.explorer.seda.xyz/data-requests/${data.drIds[0]}/${data.drBlockHeights?.[0] || 'unknown'}` : '');
        setCurrentAllExplorerLinks((data.drIds || []).map((drId: string, index: number) => 
          `https://testnet.explorer.seda.xyz/data-requests/${drId}/${data.drBlockHeights?.[index] || 'unknown'}`
        ));
      }

      setShowLoadingPopup(false);
      setShowSuccessPopup(true);

    } catch (error) {
      console.error('Error:', error);
      setError((error as Error).message);
      setShowLoadingPopup(false);
    } finally {
      setIsLoading(false);
    }
  };

  // New polling function for live, per-DR updates
  const startPollingForResultsLive = async (drIds: string[], requestCount: number, gasOptimization?: {
    totalEstimatedCost: string;
    chunks: Array<{
      assets: string[];
      estimatedGas: string;
      estimatedCost: string;
    }>;
  }) => {
    setCurrentSplitRequests(requestCount > 1);
    setCurrentRequestCount(requestCount);
    
    // For each DR, poll in parallel and update status/results live
    await Promise.all(drIds.map(async (drId: string, idx: number) => {
      setDrStatuses(prev => prev.map((dr, i) => i === idx ? { ...dr, status: 'polling' } : dr));
      const maxAttempts = 30;
      let attempts = 0;
      let finalized = false;
      
      while (attempts < maxAttempts && !finalized) {
        try {
          // Use the new chain-based polling endpoint
          const response = await fetch('/api/poll-dr-chain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              drId, 
              blockHeight: 'latest'
            })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          
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
            
            // Add new results to the main results array and localStorage
            setResults(prev => {
              const newResults = [...prev];
              console.log(`🔄 Adding results from DR ${idx + 1}:`, parsedResults);
              for (const result of parsedResults) {
                // Check if this result already exists (by symbol)
                const existingIndex = newResults.findIndex(r => r.symbol === result.symbol);
                if (existingIndex >= 0) {
                  // Update existing result
                  console.log(`📝 Updating existing result for ${result.symbol}: ${newResults[existingIndex].price} → ${result.price}`);
                  newResults[existingIndex] = result;
                } else {
                  // Add new result
                  console.log(`➕ Adding new result for ${result.symbol}: ${result.price}`);
                  newResults.push(result);
                }
              }
              console.log(`📊 Total results after DR ${idx + 1}:`, newResults);
              
              // Store in localStorage immediately
              storageHelpers.setCurrentResults(newResults);
              
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
          }
        }
        attempts++;
        if (!finalized) await new Promise(res => setTimeout(res, 1000));
      }
      
      if (!finalized) {
        setDrStatuses(prev => prev.map((dr, i) =>
          i === idx ? { ...dr, status: 'error', error: 'Timeout or unknown error' } : dr
        ));
      }
    }));
    
    // Wait a moment for all state updates to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get the final state and update explorer links and history
    setDrStatuses(prev => {
      const updatedDrStatuses = prev.filter(dr => dr.blockHeight);
      
      // Update explorer links with correct block heights
      if (updatedDrStatuses.length > 0) {
        setCurrentExplorerLink(updatedDrStatuses[0] ? 
          `https://testnet.explorer.seda.xyz/data-requests/${updatedDrStatuses[0].drId}/${updatedDrStatuses[0].blockHeight}` : '');
        setCurrentAllExplorerLinks(updatedDrStatuses.map(dr => 
          `https://testnet.explorer.seda.xyz/data-requests/${dr.drId}/${dr.blockHeight}`
        ));
      }
      
      return prev;
    });
    
    // Add to history with the final results (using a separate effect to ensure we get the latest results)
    setTimeout(() => {
      setRequestHistory(prev => [{
        id: drIds[0] || 'unknown',
        timestamp: new Date().toISOString(),
        assets: selectedAssets,
        results: results, // This should now be the final results from all DRs
        explorerLink: currentExplorerLink,
        splitRequests: requestCount > 1,
        allExplorerLinks: currentAllExplorerLinks,
        requestCount: requestCount,
        gasOptimization: gasOptimization
      }, ...prev]);
    }, 100);
  };

  // Add handler for closing popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const popup = document.querySelector('.modern-modal');
      if (showSuccessPopup && popup && !popup.contains(event.target as Node)) {
        setShowSuccessPopup(false);
      }
    }
    if (showSuccessPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuccessPopup]);

  // Clear results if no assets are selected (e.g., on page load or after deselecting all)
  useEffect(() => {
    if (selectedAssets.length === 0 && results.length > 0) {
      setResults([]);
    }
  }, [selectedAssets]);

  // Always clear results on initial mount
  useEffect(() => {
    setResults([]);
  }, []);

  // Debug: Monitor results changes
  useEffect(() => {
    if (results.length > 0) {
      console.log(`🎯 Results state updated:`, results);
    }
  }, [results]);

  // Function to clear all localStorage data
  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This will remove all results and history.')) {
      storageHelpers.clearCurrentResults();
      storageHelpers.setRequestHistory([]);
      storageHelpers.setSelectedAssets([]);
      setResults([]);
      setRequestHistory([]);
      setSelectedAssets([]);
      console.log('🧹 All localStorage data cleared');
    }
  };

  return (
    <div className="app">
      <div className="header">
        <div className="logo">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 140 36" className="seda-logo">
            <title>SEDA logo</title>
            <path fill="currentColor" d="m65.588 15.81-2.191-.367c-3.588-.602-4.05-1.632-4.05-2.46 0-1.55 1.727-2.512 4.503-2.512 2.51 0 4.418 1.001 5.107 2.683l.1.245h3.82l-.131-.487c-.986-3.653-4.339-5.924-8.752-5.924-2.963 0-5.419.818-6.913 2.303-1.009 1.001-1.53 2.271-1.506 3.672.064 3.101 2.476 5.096 7.162 5.924l2.183.394c3.54.705 4.265 1.584 4.265 2.686 0 1.53-1.983 2.593-4.818 2.593-3.092 0-4.791-1.044-5.68-3.485l-.097-.261h-3.641l.08.46c.733 4.175 4.278 6.773 9.249 6.773 2.995 0 5.506-.85 7.07-2.39 1.06-1.047 1.617-2.361 1.606-3.805-.032-3.253-2.443-5.231-7.37-6.042h.008-.004ZM106.22 7.272h-7.321v20.492h7.321c6.537 0 10.925-4.117 10.925-10.247 0-6.131-4.388-10.246-10.925-10.246v.001Zm7.097 10.246c0 4.169-2.719 6.761-7.097 6.761h-3.637V10.755h3.637c4.378 0 7.097 2.59 7.097 6.761v.002ZM136.404 7.273v3.015c-1.842-2.037-4.282-3.187-6.839-3.187-6.048 0-10.438 4.38-10.438 10.414s4.39 10.414 10.438 10.414c2.556 0 4.995-1.15 6.839-3.186v3.018H140V7.273h-3.596Zm0 10.244c0 4.082-2.828 7.042-6.726 7.042s-6.726-2.96-6.726-7.042 2.828-7.042 6.726-7.042 6.726 2.96 6.726 7.042ZM93.171 10.077c-1.899-1.959-4.666-3.082-7.594-3.082-6.032 0-10.58 4.525-10.58 10.529 0 6.003 4.662 10.528 10.61 10.528 4.194 0 7.958-2.451 9.558-6.159h-4.082c-1.29 1.768-3.2 2.731-5.472 2.731-3.304 0-6.007-2.19-6.73-5.385h17.114l.02-.368c.209-3.617-.777-6.66-2.84-8.79h-.004v-.004Zm-14.33 5.728c.665-3.289 3.227-5.385 6.649-5.385 2.895 0 6.167 2.045 6.675 5.385H78.84ZM18.985.39a9.16 9.16 0 0 0-.416 1.465c-.297 1.56-.016 2.688.839 3.347.804.62 3.137 1.625 5.605 2.688.806.348 1.631.702 2.47 1.072C26.524 5.8 21.766 2.18 18.986.39Z"></path>
            <path fill="currentColor" d="M14.08 3.316c-3.075 2.587-4.7 4.912-4.7 6.723 0 3.603 6.778 6.083 9.388 6.736.402.1 8.996 2.293 10.656 7.063a68.796 68.796 0 0 0 3.282-2.13c4.19-2.91 4.326-3.924 4.33-3.967 0-.554-.529-1.796-4.062-3.843-2.591-1.5-5.882-2.918-8.784-4.168-2.813-1.212-5.035-2.17-6.04-2.946-1.849-1.428-1.927-3.612-1.572-5.388a38.154 38.154 0 0 0-2.497 1.92ZM17.625 30.3c-.804-.621-3.135-1.626-5.604-2.689-.806-.348-1.63-.702-2.47-1.073.96 3.162 5.719 6.783 8.499 8.572.154-.413.313-.922.416-1.464.297-1.56.016-2.687-.84-3.346h-.001Z"></path>
            <path fill="currentColor" d="M22.954 32.184c3.076-2.588 4.702-4.912 4.702-6.725 0-3.603-6.777-6.083-9.39-6.735-.401-.1-8.994-2.294-10.655-7.064a68.787 68.787 0 0 0-3.282 2.13C.139 16.7.003 17.714 0 17.755c0 .554.528 1.796 4.061 3.843 2.592 1.5 5.882 2.918 8.784 4.169 2.813 1.21 5.036 2.17 6.043 2.945 1.848 1.428 1.926 3.613 1.571 5.388a38.121 38.121 0 0 0 2.497-1.92l-.002.004Z"></path>
          </svg>
        </div>
        <h1>🚀 SEDA Asset Price Oracle</h1>
        <div className="header-actions">
          <button 
            onClick={clearAllData}
            className="clear-button"
            title="Clear all data and history"
          >
            🗑️ Clear Data
          </button>
        </div>
        <p>Select assets and pull real-time prices from the SEDA network</p>
      </div>
      
      <div className="content">
        {/* Asset selection - always visible */}
        <div className="asset-grid">
          {Object.entries(ASSET_CATEGORIES).map(([category, assets]) => (
            <div key={category} className="asset-category">
              <div className="category-title">{category}</div>
              {assets.map(asset => (
                <div key={asset.id} className="asset-item">
                  <input
                    type="checkbox"
                    id={asset.id}
                    checked={selectedAssets.includes(asset.id)}
                    onChange={() => handleAssetToggle(asset.id)}
                  />
                  <label htmlFor={asset.id}>{asset.label}</label>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Buttons - always visible */}
        <div className="button-container">
          <button
            className="select-all-btn"
            onClick={handleSelectAllAssets}
            disabled={isLoading}
          >
            🎯 Select All Assets ({Object.values(ASSET_CATEGORIES).flat().length})
          </button>
          <button
            className="pull-prices-btn"
            onClick={handlePullPrices}
            disabled={isLoading || selectedAssets.length === 0}
          >
            {isLoading ? 'Fetching Prices...' : `Pull ${selectedAssets.length} Price${selectedAssets.length !== 1 ? 's' : ''}`}
          </button>
        </div>

        {error && (
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Current Results Section - Show results from localStorage */}
        {results.length > 0 && (
          <div className="current-results">
            <h3>💰 Current Price Data</h3>
            <p className="results-note">
              📊 Latest prices from your most recent data request (stored locally)
            </p>
            <div className="results-grid">
              {results.map((result, index) => (
                <div key={index} className="result-item">
                  <span className="result-symbol">{result.symbol}</span>
                  <span className="result-price">${result.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {requestHistory.length > 0 && (
          <div className="history">
            <h3>📚 Request History (Persisted in Browser)</h3>
            <p className="history-note">
              💾 Data is automatically saved to your browser's local storage and will persist across sessions.
            </p>
            {requestHistory.map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-header">
                  <span className="history-time">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                  <div className="history-links">
                    <a href={item.explorerLink} target="_blank" rel="noopener noreferrer" className="history-link">
                      🔗 Explorer
                    </a>
                    {item.splitRequests && item.allExplorerLinks && item.allExplorerLinks.length > 1 && (
                      <span className="split-indicator">🔄 Split ({item.requestCount} requests)</span>
                    )}
                  </div>
                </div>
                <div className="history-assets">
                  <strong>Assets:</strong> {item.assets.join(', ')}
                </div>
                <div className="history-results">
                  {item.results.map((result, idx) => (
                    <span key={idx} className="history-price">
                      {result.symbol}: ${result.price.toFixed(2)}
                    </span>
                  ))}
                </div>
                {item.splitRequests && item.allExplorerLinks && item.allExplorerLinks.length > 1 && (
                  <div className="history-split-links">
                    <strong>All DR Links:</strong>
                    {item.allExplorerLinks.map((link, idx) => (
                      <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="history-split-link">
                        DR #{idx + 1}
                      </a>
                    ))}
                  </div>
                )}
                {item.gasOptimization && (
                  <div className="history-gas-info">
                    <div className="gas-detail">
                      <span className="gas-label">Total Estimated Cost:</span>
                      <span className="gas-value">{item.gasOptimization.totalEstimatedCost} SEDA</span>
                    </div>
                    <div className="gas-detail">
                      <span className="gas-label">Optimized Chunks:</span>
                      <span className="gas-value">{item.gasOptimization.chunks.length} DRs</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modern Modal Popup for DR Progress & Results */}
        {(showLoadingPopup || showSuccessPopup) && (
          <div className="modern-modal-overlay" style={{ pointerEvents: 'none' }}>
            <div className="modern-modal white-card" style={{ pointerEvents: 'auto' }}>
              <div className={`modal-header${showLoadingPopup ? '' : ' no-stepper'}`}>
                <span className="modal-title">
                  {showLoadingPopup ? 'Fetching Prices...' : 'Data Request Successful!'}
                </span>
                <button className="close-btn" onClick={() => { setShowLoadingPopup(false); setShowSuccessPopup(false); }}>&times;</button>
              </div>
              {showLoadingPopup && (
                <>
                  <div className="stepper animated-stepper">
                    {drStatuses.map((dr, idx) => (
                      <div key={dr.drId} className={`step ${dr.status}`}>
                        <div className="step-icon">
                          {dr.status === 'finalized' ? (
                            <span className="checkmark">✔</span>
                          ) : dr.status === 'error' ? (
                            <span className="error-mark">!</span>
                          ) : (
                            <span className="spinner"></span>
                          )}
                        </div>
                        <div className="step-label">DR #{idx + 1}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {!showLoadingPopup && showSuccessPopup && (
                <>
                  <div className="success-check">✔</div>
                  {currentSplitRequests && (
                    <div className="gas-optimization-info">
                      <div className="gas-optimization-header">
                        <span className="gas-icon">⛽</span>
                        <span>Dynamic Gas Optimization</span>
                      </div>
                      <div className="gas-optimization-details">
                        <div className="gas-detail">
                          <span className="gas-label">Total Requests:</span>
                          <span className="gas-value">{currentRequestCount}</span>
                        </div>
                        <div className="gas-detail">
                          <span className="gas-label">Assets per DR:</span>
                          <span className="gas-value">10 (testing new gas)</span>
                        </div>
                        <div className="gas-detail">
                          <span className="gas-label">Network Status:</span>
                          <span className="gas-value">✅ Stable</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="results-list">
                    {selectedAssets.map(assetId => {
                      // Search all DR results for a match
                      let foundResult = null;
                      for (const dr of drStatuses) {
                        if (dr.results && dr.results.length > 0) {
                          for (const result of dr.results) {
                            if (resultMatchesAsset(result, assetId)) {
                              foundResult = result;
                              break;
                            }
                          }
                        }
                        if (foundResult) break;
                      }
                      const assetLabel = (() => {
                        for (const assets of Object.values(ASSET_CATEGORIES)) {
                          const found = assets.find(a => a.id === assetId);
                          if (found) return found.label;
                        }
                        return assetId;
                      })();
                      return (
                        <div key={assetId} className="result-row">
                          <span className="result-asset"><b>{assetId}</b></span>
                          {foundResult ? (
                            <span className="result-price" style={{ color: '#22b14c', fontWeight: 600 }}>
                              ${foundResult.price.toFixed(2)}
                            </span>
                          ) : (
                            <span className="result-price no-data">No Data</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Latest Results Section (always visible at the bottom) */}
        {results.length > 0 && !showLoadingPopup && !showSuccessPopup && (
          <div className="results latest-results">
            <h3>Latest Price Results</h3>
            <table className="results-table">
              <thead><tr><th>Symbol</th><th>Price</th></tr></thead>
              <tbody>
                {selectedAssets.map((assetId, idx) => {
                  const found = results.find(r => resultMatchesAsset(r, assetId));
                  return (
                    <tr key={assetId}>
                      <td>{assetId}</td>
                      <td className={found && !isNaN(found.price) ? 'price-green' : 'no-data'}>
                        {found && !isNaN(found.price) ? `$${found.price.toFixed(2)}` : <span className="no-data">No Data</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Render the app
const root = createRoot(document.getElementById('root')!);
root.render(<App />); 