with open('/app/applet/src/components/views/DashboardView.tsx', 'r') as f:
    content = f.read()

content = content.replace("const [trendDays, setTrendDays] = useState<7 | 14 | 30>(30);", "const [trendDays, setTrendDays] = useState<7 | 14 | 30>(7);")

with open('/app/applet/src/components/views/DashboardView.tsx', 'w') as f:
    f.write(content)
