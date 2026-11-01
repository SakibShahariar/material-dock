/**
 * Append eligible entries from one enumerator batch while respecting a raw
 * entry scan limit. The caller can distinguish a complete scan from a
 * truncated one without retaining every file in a large directory.
 */
export function collectFolderBatch(target, batch, remainingEntries, isEligible) {
    let scanned = 0;

    for (const entry of batch) {
        if (scanned >= remainingEntries) return {scanned, truncated: true};

        scanned++;
        if (isEligible(entry)) target.push(entry);
    }

    return {scanned, truncated: false};
}
