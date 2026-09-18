import json

with open('metadata.json', 'r') as f:
    data = json.load(f)

data['name'] = 'Asif Inventory Software'
data['description'] = 'সম্পূর্ণ অটোমেটেড ইনভেন্টরি ও সেলস ম্যানেজমেন্ট সিস্টেম - সেলস, পারচেজ, স্টক, প্রডাকশন, লেজার ও লাভ-ক্ষতি রিপোর্ট'

with open('metadata.json', 'w') as f:
    json.dump(data, f, indent=2)

