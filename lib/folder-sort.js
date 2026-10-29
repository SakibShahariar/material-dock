const DEFAULT_COLLATOR = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
});

export function sortFolderEntries(entries, mode, accessors = {}) {
    const getName = accessors.getName ?? (entry => entry.name);
    const getModified = accessors.getModified ?? (entry => entry.modified);
    const getType = accessors.getType ?? (entry => entry.type);

    const compareNames = (a, b) => {
        const nameA = String(getName(a) ?? '');
        const nameB = String(getName(b) ?? '');
        return DEFAULT_COLLATOR.compare(nameA, nameB) || nameA.localeCompare(nameB);
    };

    return [...entries].sort((a, b) => {
        if (mode === 'modified') {
            const difference = Number(getModified(b)) - Number(getModified(a));
            if (Number.isFinite(difference) && difference !== 0) return difference;
        } else if (mode === 'type') {
            const typeOrder = DEFAULT_COLLATOR.compare(
                String(getType(a) ?? ''),
                String(getType(b) ?? ''),
            );
            if (typeOrder !== 0) return typeOrder;
        }

        return compareNames(a, b);
    });
}
