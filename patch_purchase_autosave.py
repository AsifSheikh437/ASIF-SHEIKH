import re

with open('src/components/views/PurchaseSupplyView.tsx', 'r') as f:
    content = f.read()

# 1. Add auto-restore logic
import_str = "import React, { useState, useMemo, useEffect, useRef } from 'react';\n"
content = content.replace("import React, { useState, useMemo } from 'react';", import_str)

# Find where purchaseDraft is defined
draft_anchor = "  const handleDiscardPurchaseDraft = () => {"
draft_effect = """  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (purchaseDraft.hasSavedDraft && !hasRestoredRef.current) {
      purchaseDraft.restoreDraft();
      setShowCreateModal(true);
      hasRestoredRef.current = true;
    }
  }, [purchaseDraft.hasSavedDraft, purchaseDraft]);

  const handleDiscardPurchaseDraft = () => {"""
content = content.replace(draft_anchor, draft_effect)

# 2. Remove the first banner
banner_find = """      {/* Unfinished Draft Resume Alert (When returning after refresh or navigating away) */}
      {purchaseDraft.hasSavedDraft && !showCreateModal && (
        <DraftAutoSaveBanner
          hasSavedDraft={purchaseDraft.hasSavedDraft}
          savedTimeFormatted={purchaseDraft.savedTimeFormatted}
          onRestore={() => {
            handleRestorePurchaseDraft();
            setShowCreateModal(true);
          }}
          onDiscard={handleDiscardPurchaseDraft}
          onDismiss={purchaseDraft.dismissDraftNotification}
        />
      )}"""
content = content.replace(banner_find, "")

# 3. Remove the second banner inside modal
banner_modal_find = """              {/* Draft Banner inside modal */}
              {purchaseDraft.hasSavedDraft && (
                <DraftAutoSaveBanner
                  hasSavedDraft={purchaseDraft.hasSavedDraft}
                  savedTimeFormatted={purchaseDraft.savedTimeFormatted}
                  onRestore={handleRestorePurchaseDraft}
                  onDiscard={handleDiscardPurchaseDraft}
                  onDismiss={purchaseDraft.dismissDraftNotification}
                />
              )}"""
content = content.replace(banner_modal_find, "")

with open('src/components/views/PurchaseSupplyView.tsx', 'w') as f:
    f.write(content)
