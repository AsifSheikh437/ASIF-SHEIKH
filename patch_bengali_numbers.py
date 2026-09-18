import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content
    # Look for {idx + 1} and similar
    content = re.sub(r'\{idx\s*\+\s*1\}', '{toBengaliNumber(idx + 1)}', content)
    # Look for {index + 1}
    content = re.sub(r'\{index\s*\+\s*1\}', '{toBengaliNumber(index + 1)}', content)
    
    # We might need to ensure toBengaliNumber is imported
    if content != original and 'toBengaliNumber' not in original:
        if 'import { formatCurrency' in content:
            content = content.replace('import { formatCurrency', 'import { formatCurrency, toBengaliNumber')
        elif 'import { ' in content and 'formatters' in content:
            content = re.sub(r'import \{ ([^\}]+) \} from ([\'"])(.*?)formatters\2;', r'import { \1, toBengaliNumber } from \2\3formatters\2;', content)
        
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src/components/views'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
