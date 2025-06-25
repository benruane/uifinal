use anyhow::Result;
use seda_sdk_rs::{elog, get_reveals, log, Process};
use serde_json::Value;

/**
 * Tally phase for multi-asset JSON array results.
 * Returns the first valid result without requiring strict consensus.
 * This allows all returned values to pass through, avoiding consensus errors
 * when dealing with multiple assets in a single DR.
 */
pub fn tally_phase() -> Result<()> {
    let reveals = get_reveals()?;
    let mut arrays = Vec::new();

    for reveal in reveals {
        let arr: Value = match serde_json::from_slice(&reveal.body.reveal) {
            Ok(val) => val,
            Err(_) => {
                elog!("Reveal body could not be parsed as JSON array");
                continue;
            }
        };
        arrays.push(arr);
    }

    if arrays.is_empty() {
        Process::error("No valid reveals".as_bytes());
        return Ok(());
    }

    // Return the first valid result without requiring strict consensus
    // This allows all returned values to pass through, avoiding consensus errors
    let first = &arrays[0];
    let output = serde_json::to_vec(first)?;
    log!("Returning first valid result: {}", String::from_utf8_lossy(&output));
    Process::success(&output);

    Ok(())
}
