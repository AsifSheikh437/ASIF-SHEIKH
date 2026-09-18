with open('src/components/views/DashboardView.tsx', 'r') as f:
    content = f.read()

content = content.replace("    addPurchase,\n    currentUser,\n  } = useERP();", "    addPurchase,\n    currentUser,\n    toggleTransactionVisualStatus,\n  } = useERP();")

with open('src/components/views/DashboardView.tsx', 'w') as f:
    f.write(content)
