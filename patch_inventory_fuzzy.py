with open('src/components/views/InventoryStockView.tsx', 'r') as f:
    content = f.read()

old_filter = """  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === 'ALL' ? true : p.category === activeCategory;
    const matchSearch =
      p.nameBangla.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLowStock = filterLowStockOnly ? p.currentStock <= p.minStockAlert : true;
    return matchCat && matchSearch && matchLowStock;
  });"""

new_filter = """  // Fuzzy search implementation
  const fuzzyMatch = (str: string | undefined | null, pattern: string) => {
    if (!str) return false;
    const cleanPattern = pattern.toLowerCase().replace(/\\s/g, '');
    const cleanStr = str.toLowerCase();
    
    if (cleanStr.includes(cleanPattern)) return true;
    
    let patternIdx = 0;
    let strIdx = 0;
    while (patternIdx < cleanPattern.length && strIdx < cleanStr.length) {
      if (cleanPattern[patternIdx] === cleanStr[strIdx]) {
        patternIdx++;
      }
      strIdx++;
    }
    return patternIdx === cleanPattern.length;
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === 'ALL' ? true : p.category === activeCategory;
    
    let matchSearch = true;
    if (searchTerm.trim()) {
        const term = searchTerm.trim();
        matchSearch = fuzzyMatch(p.nameBangla, term) || 
                      fuzzyMatch(p.nameEnglish, term) || 
                      fuzzyMatch(p.sku, term) ||
                      fuzzyMatch(p.id, term);
    }

    const matchLowStock = filterLowStockOnly ? p.currentStock <= p.minStockAlert : true;
    return matchCat && matchSearch && matchLowStock;
  });"""

if old_filter in content:
    content = content.replace(old_filter, new_filter)
    with open('src/components/views/InventoryStockView.tsx', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Could not find the old filter block")
