const DEFAULT_COLLATOR = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
});

export function sortFolderEntries(entries, mode, accessors = {}) {
    const getName = accessors.getName ?? (entry => entry.name);
    const getModified = accessors.getModified ?? (entry => entry.modified);
    const getType = accessors.getType ?? (entry => entry.type);

    // Read file metadata once per entry; folder enumeration can return thousands of files.
    const sorted = entries.map((entry, index) => ({
        entry,
        index,
        name: String(getName(entry) ?? ''),
        modified: Number(getModified(entry)),
        type: String(getType(entry) ?? ''),
    }));

    sorted.sort((a, b) => {
        if (mode === 'modified') {
            const difference = b.modified - a.modified;
            if (Number.isFinite(difference) && difference !== 0) return difference;
        } else if (mode === 'type') {
            const typeOrder = DEFAULT_COLLATOR.compare(a.type, b.type);
            if (typeOrder !== 0) return typeOrder;
        }

        return (
            DEFAULT_COLLATOR.compare(a.name, b.name) ||
            a.name.localeCompare(b.name) ||
            a.index - b.index
        );
    });

    return sorted.map(item => item.entry);
}
