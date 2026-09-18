import re

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

content = content.replace("const [showProfileMenu,\n  Globe, setShowProfileMenu]", "const [showProfileMenu, setShowProfileMenu]")

with open('src/components/Navbar.tsx', 'w') as f:
    f.write(content)
