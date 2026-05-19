import json

with open('output.json', 'r') as f:
    data = json.load(f)

for row in data:
    if '2026-05-06' in row['fechaValor'] or '2026-05-06' in row['fecha']:
        print(row)
