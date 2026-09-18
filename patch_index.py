import re

with open('index.html', 'r') as f:
    content = f.read()

content = content.replace("সোনালী ফুডস", "আসিফ ইনভেন্টরি সফটওয়্যার")
content = content.replace("Sonali Foods", "Asif Inventory Software")

with open('index.html', 'w') as f:
    f.write(content)

