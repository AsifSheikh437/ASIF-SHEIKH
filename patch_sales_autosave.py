import re

with open('src/components/views/SalesInvoiceView.tsx', 'r') as f:
    content = f.read()

# We need to add a useEffect to auto-restore. 
# Also remove the DraftAutoSaveBanner since it's automatic.

# 1. Add auto-restore logic
import_str = "import React, { useState, useMemo, useEffect, useRef } from 'react';\n"
content = content.replace("import React, { useState, useMemo } from 'react';", import_str)

# Find where salesDraft is defined
draft_anchor = "  const handleDiscardSalesDraft = () => {"
draft_effect = """  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (salesDraft.hasSavedDraft && !hasRestoredRef.current) {
      salesDraft.restoreDraft();
      setShowCreateModal(true);
      hasRestoredRef.current = true;
    }
  }, [salesDraft.hasSavedDraft, salesDraft]);

  const handleDiscardSalesDraft = () => {"""
content = content.replace(draft_anchor, draft_effect)

# 2. Remove the first banner
banner_find = """      {/* Unfinished Draft Resume Alert (When returning after refresh or navigating away) */}
      {salesDraft.hasSavedDraft && !showCreateModal && (
        <DraftAutoSaveBanner
          hasSavedDraft={salesDraft.hasSavedDraft}
          savedTimeFormatted={salesDraft.savedTimeFormatted}
          onRestore={() => {
            handleRestoreSalesDraft();
            setShowCreateModal(true);
          }}
          onDiscard={handleDiscardSalesDraft}
          onDismiss={salesDraft.dismissDraftNotification}
        />
      )}"""
content = content.replace(banner_find, "")

# 3. Remove the second banner inside modal
banner_modal_find = """              {/* Draft Banner inside modal */}
              {salesDraft.hasSavedDraft && (
                <DraftAutoSaveBanner
                  hasSavedDraft={salesDraft.hasSavedDraft}
                  savedTimeFormatted={salesDraft.savedTimeFormatted}
                  onRestore={handleRestoreSalesDraft}
                  onDiscard={handleDiscardSalesDraft}
                  onDismiss={salesDraft.dismissDraftNotification}
                />
              )}"""
content = content.replace(banner_modal_find, "")

with open('src/components/views/SalesInvoiceView.tsx', 'w') as f:
    f.write(content)
