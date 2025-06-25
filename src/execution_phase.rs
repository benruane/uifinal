use anyhow::Result;
use seda_sdk_rs::{elog, http_fetch, log, Process};
use serde_json::{json, Value};

/**
 * Executes the data request phase within the SEDA network.
 * Supports multiple assets from any category in a single DR.
 * Input: comma-separated list (e.g., equity:AAPL,fx:EUR,cfd:XAU:USD)
 * Output: JSON array of {symbol, price} objects as bytes, rounded and sorted for consensus
 */
pub fn execution_phase() -> Result<()> {
    let dr_inputs_raw = String::from_utf8(Process::get_inputs())?;
    log!("Fetching data for: {}", dr_inputs_raw);

    let queries: Vec<&str> = dr_inputs_raw.split(',').map(|s| s.trim()).filter(|s| !s.is_empty()).collect();
    if queries.is_empty() {
        Process::error("No asset queries provided".as_bytes());
        return Ok(());
    }

    let mut results = Vec::new();
    for query in queries {
        let parts: Vec<&str> = query.split(':').collect();
        if parts.len() < 2 {
            elog!("Invalid input format for query: {}", query);
            continue;
        }
        let data_type = parts[0];
        let symbol = parts[1];
        let quote_currency = parts.get(2);

        let proxy_base_url = "https://api.binance.com/api/v3/ticker/price";
        let url = match data_type {
            "equity" => format!("{}?symbol={}USD", proxy_base_url, symbol),
            "uslf_q" => format!("{}?symbol={}USD", proxy_base_url, symbol),
            "uslf_t" => format!("{}?symbol={}USD", proxy_base_url, symbol),
            "fx" => format!("{}?symbol={}USD", proxy_base_url, symbol),
            "fx_r" => format!("{}?symbol=USD{}", proxy_base_url, symbol),
            "cfd" => {
                if let Some(quote) = quote_currency {
                    format!("{}?symbol={}{}", proxy_base_url, symbol, quote)
                } else {
                    elog!("CFD requires both asset and quote currency: cfd:ASSET:QUOTE");
                    continue;
                }
            }
            _ => {
                elog!("Invalid data type: {}", data_type);
                continue;
            }
        };

        log!("Fetching from URL: {}", url);
        
        // Try using http_fetch instead of proxy_http_fetch
        // Maybe the proxy URLs work without the special header
        let response = http_fetch(&url, None);
        
        if !response.is_ok() {
            elog!(
                "HTTP Response was rejected: {} - {}",
                response.status,
                String::from_utf8(response.bytes)?
            );
            continue;
        }
        let raw_response = String::from_utf8_lossy(&response.bytes);
        log!("Raw response bytes: {}", raw_response);

        let v: Value = match serde_json::from_slice(&response.bytes) {
            Ok(val) => val,
            Err(e) => {
                elog!("Failed to parse JSON for {}: {}", query, e);
                continue;
            }
        };

        // Determine the correct symbol key for Quote responses
        let symbol_key = match data_type {
            "fx" => format!("{}/USD", symbol),
            "fx_r" => format!("USD/{}", symbol),
            "cfd" => {
                if let Some(quote) = quote_currency {
                    format!("{}/{}:BFX", symbol, quote)
                } else {
                    symbol.to_string()
                }
            }
            "uslf_q" => format!("{}:USLF24", symbol),
            _ => symbol.to_string(),
        };

        // Try Trade first, then Quote
        let price = if v.get("Trade").is_some() {
            v["Trade"][&symbol_key]["price"].as_f64()
        } else if v.get("Quote").is_some() {
            let bid = v["Quote"][&symbol_key]["bidPrice"].as_f64();
            let ask = v["Quote"][&symbol_key]["askPrice"].as_f64();
            match (bid, ask) {
                (Some(b), Some(a)) => Some((b + a) / 2.0),
                (Some(b), None) => Some(b),
                (None, Some(a)) => Some(a),
                _ => None,
            }
        } else {
            None
        };

        if let Some(price) = price {
            // Round to 2 decimal places for consensus
            let rounded_price = (price * 100.0).round() / 100.0;
            let result = json!({
                "symbol": symbol_key,
                "price": rounded_price
            });
            results.push(result);
        } else {
            elog!("No price found for {} (key: {})", query, symbol_key);
            continue;
        }
    }

    // Sort results by symbol for deterministic output
    results.sort_by(|a, b| a["symbol"].as_str().cmp(&b["symbol"].as_str()));

    let output = serde_json::to_vec(&results)?;
    log!("Reporting: {}", String::from_utf8_lossy(&output));
    Process::success(&output);
    Ok(())
}
