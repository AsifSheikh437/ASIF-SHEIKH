with open('src/components/views/DailySummaryWidget.tsx', 'r') as f:
    content = f.read()

content = content.replace("s.status !== 'CANCELLED' && s.deliveryStatus !== 'CANCELLED'", "s.deliveryStatus !== 'CANCELLED'")
content = content.replace("p.status !== 'CANCELLED'", "true")

with open('src/components/views/DailySummaryWidget.tsx', 'w') as f:
    f.write(content)
