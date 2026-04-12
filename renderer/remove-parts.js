const fs = require('fs');
let file = '/workspaces/MVP/renderer/src/app/features/item-detail/ui/smart/item-detail-page/item-detail-page.component.ts';
let content = fs.readFileSync(file, 'utf8');

const parentAggMatch = /  parentAggregateId = computed\(\(\) => \{[\s\S]*?\}\);\n/g;
content = content.replace(parentAggMatch, '');

const navBackMatch = /  onNavigateBack\(aggregateId: string\) \{[\s\S]*?\}\n/g;
content = content.replace(navBackMatch, '');

fs.writeFileSync(file, content);
