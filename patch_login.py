import re

with open('src/components/LoginModal.tsx', 'r') as f:
    content = f.read()

pattern = r'\{\s*/\*\s*Quick Demo Role Selector \(1-Click Test Access\)\s*\*/\s*\}.*?</div>\s*</div>\s*</div>\s*</div>\s*</div>\s*\{\s*/\*\s*Password Recovery Modal'
# Actually, wait, let's just use simpler regex or string matching.
