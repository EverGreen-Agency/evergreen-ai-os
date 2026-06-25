import json

file_path = r'c:\Users\Lenovo\Desktop\EG\evergreen-ai-os\_opensquad\_memory\banco_ideias\ideas.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

with open(r'c:\Users\Lenovo\Desktop\EG\evergreen-ai-os\scratch\all_capture.txt', 'w', encoding='utf-8') as out:
    for i in data['ideas']:
        if i.get('stage') == 'capture' and not i.get('archived'):
            out.write(f"ID: {i['id']}\n")
            out.write(f"TITLE: {i['title']}\n")
            out.write(f"CATEGORY: {i['category']}\n")
            out.write(f"DESC: {i['desc']}\n")
            out.write('-'*20 + '\n')
