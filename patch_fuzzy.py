import re

with open('src/components/common/SearchableProductSelect.tsx', 'r') as f:
    content = f.read()

# Replace the simple filter with a fuzzy one
new_filter = """
  // Fuzzy search implementation
  const fuzzyMatch = (str: string, pattern: string) => {
    pattern = pattern.toLowerCase().replace(/\s/g, '');
    str = str.toLowerCase();
    
    // Direct inclusion is a strong match
    if (str.includes(pattern)) return true;
    
    // Check if all characters of pattern appear in str in order (classic fuzzy)
    let patternIdx = 0;
    let strIdx = 0;
    while (patternIdx < pattern.length && strIdx < str.length) {
      if (pattern[patternIdx] === str[strIdx]) {
        patternIdx++;
      }
      strIdx++;
    }
    return patternIdx === pattern.length;
  };

  const filteredProducts = products.filter(p => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.trim();
    
    return (
      fuzzyMatch(p.nameBangla, searchLower) ||
      fuzzyMatch(p.nameEnglish, searchLower) ||
      fuzzyMatch(p.id, searchLower) ||
      (p.sku && fuzzyMatch(p.sku, searchLower))
    );
  });
"""

# We need to find the old filteredProducts and replace it.
old_filter = r"""  const filteredProducts = products\.filter\(p => \{\s*const searchLower = searchTerm\.toLowerCase\(\);\s*return \(\s*p\.nameBangla\.toLowerCase\(\)\.includes\(searchLower\) \|\|\s*p\.nameEnglish\.toLowerCase\(\)\.includes\(searchLower\) \|\|\s*p\.id\.toLowerCase\(\)\.includes\(searchLower\)\s*\);\s*\}\);"""

content = re.sub(old_filter, new_filter, content)

with open('src/components/common/SearchableProductSelect.tsx', 'w') as f:
    f.write(content)
