with open(r'c:\Users\Lenovo\Desktop\EG\evergreen-ai-os\scratch\all_capture.txt', 'r', encoding='utf-8') as f:
    content = f.read().split('-'*20)
    
with open(r'c:\Users\Lenovo\Desktop\EG\evergreen-ai-os\scratch\lote3_ideas.txt', 'w', encoding='utf-8') as out:
    for block in content:
        if 'CATEGORY: Infra' not in block and 'CATEGORY: Squad' not in block and block.strip():
            out.write(block.strip() + '\n---\n')
