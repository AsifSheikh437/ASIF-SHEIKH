import re

with open('src/data/initialData.ts', 'r') as f:
    content = f.read()

# Replace Sonali Foods with Asif Inventory Software
content = content.replace("companyNameBangla: 'সোনালী ফুডস অ্যান্ড বেকারি লিঃ',", "companyNameBangla: 'আসিফ ইনভেন্টরি সফটওয়্যার',")
content = content.replace("companyNameEnglish: 'Sonali Foods & Agro Industries Ltd.',", "companyNameEnglish: 'Asif Inventory Software',")
content = content.replace("tagline: 'সম্পূর্ণ স্বাস্থ্যসম্মত ও পুষ্টিকর খাদ্যপণ্য প্রস্তুতকারক',", "tagline: 'সেরা ইনভেন্টরি ম্যানেজমেন্ট সিস্টেম',")
content = content.replace("website: 'https://sonalifoods-bd.com',", "website: '',")
content = content.replace("email: 'info@sonalifoods-bd.com',", "email: 'info@asifinventory.com',")
content = content.replace("address: 'প্লট নং ৪২, রোড ৭, তেজগাঁও শিল্প এলাকা, ঢাকা-১২০৮',", "address: 'ঢাকা, বাংলাদেশ',")
content = content.replace("factoryAddress: 'বিসিক শিল্পনগরী, টঙ্গী, গাজীপুর',", "factoryAddress: 'ঢাকা, বাংলাদেশ',")

with open('src/data/initialData.ts', 'w') as f:
    f.write(content)

