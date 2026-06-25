with open(r'c:\Users\Lenovo\Desktop\EG\evergreen-ai-os\scratch\all_capture.txt', 'r', encoding='utf-8') as f:
    content = f.read().split('-'*20)
    
with open(r'c:\Users\Lenovo\Desktop\EG\evergreen-ai-os\scratch\infra_squad.txt', 'w', encoding='utf-8') as out:
    for block in content:
        if 'CATEGORY: Infra' in block or 'CATEGORY: Squad' in block:
            out.write(block.strip() + '\n---\n')
