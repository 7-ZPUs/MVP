const fs = require('fs');
let content = fs.readFileSync('/workspaces/MVP/renderer/src/app/features/document/components/subject-list/subject-list.component.ts', 'utf8');

content = content.replace(/\.metadata-card \{\s+background: #f8fafc;\s+border: 1px solid #e2e8f0;\s+border-radius: 8px;\s+padding: 1\.25rem;\s+margin-bottom: 1rem;\s+\}/,
`:host {
        display: block;
        width: 100%;
        margin-bottom: 1rem;
      }
      .metadata-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1.25rem;
      }`
);

content = content.replace(/\.card-header \{\s+background: #f1f5f9;\s+padding: 0\.75rem 1rem;\s+border-bottom: 1px solid #cbd5e1;\s+display: flex;\s+justify-content: space-between;\s+align-items: center;\s+\}/,
`.card-header {
          background: #f1f5f9;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #cbd5e1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }`
);

content = content.replace(/\.role \{\s+font-weight: 600;\s+color: #0f172a;\s+font-size: 0\.95rem;\s+\}/,
`.role {
          font-weight: 600;
          color: #0f172a;
          font-size: 0.95rem;
          word-break: break-all;
          overflow-wrap: break-word;
        }`
);

content = content.replace(/\.data-row \{\s+display: flex;\s+margin-bottom: 0\.5rem;\s+font-size: 0\.85rem;\s+\}/,
`.data-row {
          display: flex;
          margin-bottom: 0.5rem;
          font-size: 0.85rem;
          flex-wrap: wrap;
          gap: 0.25rem;
        }`
);

content = content.replace(/\.label \{\s+font-weight: 600;\s+color: #64748b;\s+width: 120px;\s+flex-shrink: 0;\s+\}/,
`.label {
          font-weight: 600;
          color: #64748b;
          min-width: 120px;
          flex-shrink: 0;
        }`
);

fs.writeFileSync('/workspaces/MVP/renderer/src/app/features/document/components/subject-list/subject-list.component.ts', content);
