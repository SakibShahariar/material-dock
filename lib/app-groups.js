export function normalizeAppGroup(label, ids, availableIds) {
    const normalizedLabel = String(label ?? '').trim();
    const appIds = (Array.isArray(ids) ? ids : String(ids ?? '').split(','))
        .map(id => String(id).trim())
        .filter(Boolean);
    const available = new Set(availableIds);

    if (
        !normalizedLabel ||
        normalizedLabel.includes('|') ||
        appIds.length === 0 ||
        appIds.some(id => id.includes('|') || id.includes(',')) ||
        appIds.some(id => !available.has(id))
    )
        return null;

    return `${normalizedLabel}|${[...new Set(appIds)].join(',')}`;
}

export function replaceAppGroup(groups, original, replacement) {
    const index = groups.indexOf(original);
    if (index < 0 || groups.some((group, i) => i !== index && group === replacement))
        return null;

    const next = [...groups];
    next[index] = replacement;
    return next;
}

export function moveAppGroup(groups, entry, offset) {
    const index = groups.indexOf(entry);
    const target = index + offset;
    if (index < 0 || !Number.isInteger(offset) || target < 0 || target >= groups.length)
        return groups;

    const next = [...groups];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
}
