import re

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

hook = """
  const [showAlerts, setShowAlerts] = useState(false);
  const { t, language, toggleLanguage } = useLanguage();
"""

content = content.replace("  const [showAlerts, setShowAlerts] = useState(false);", hook)

with open('src/components/Navbar.tsx', 'w') as f:
    f.write(content)
