import os
import sys

import httpx

sys.stdout.reconfigure(encoding='utf-8')

token = os.environ.get("CLICKUP_API_TOKEN")
if not token:
    raise SystemExit("CLICKUP_API_TOKEN is required to run this live diagnostic.")
headers = {"Authorization": token}

with httpx.Client(timeout=20) as client:
    # Get space EverGreen | Operação
    space_id = "90174075681"
    f_r = client.get(f"https://api.clickup.com/api/v2/space/{space_id}/folder", headers=headers)
    folders = f_r.json().get("folders", [])
    for f in folders:
        print(f"\nFolder: {f['name']} (ID: {f['id']})")
        l_r = client.get(f"https://api.clickup.com/api/v2/folder/{f['id']}/list", headers=headers)
        lists = l_r.json().get("lists", [])
        for l in lists:
            t_r = client.get(f"https://api.clickup.com/api/v2/list/{l['id']}/task?include_subtasks=true", headers=headers)
            tasks = t_r.json().get("tasks", [])
            print(f"  List: {l['name']} (ID: {l['id']}) -> {len(tasks)} tasks")
            for t in tasks[:3]: # sample first 3
                print(f"    - [{t['status']['status']}] {t['name']}")
