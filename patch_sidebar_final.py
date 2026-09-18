with open('src/components/Sidebar.tsx', 'r') as f:
    content = f.read()

content = content.replace("ফুড ইআরপি মেনুবার", "{t('sidebar.title')}")
content = content.replace("সিস্টেম একটিভ", "{t('sidebar.status')}")

with open('src/components/Sidebar.tsx', 'w') as f:
    f.write(content)
