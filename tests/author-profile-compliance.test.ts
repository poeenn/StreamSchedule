import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { APP_LINKS } from '../src/constants/links';

describe('Author Profile & Governance Compliance Test', () => {
  it('strictly adheres to author links specifications', () => {
    expect(APP_LINKS.AUTHOR_NAME).toBe('poeenn');
    expect(APP_LINKS.X_HANDLE).toBe('@poeenn');
    expect(APP_LINKS.X_ACCOUNT).toBe('https://x.com/poeenn');
    expect(APP_LINKS.DONERU_URL).toBe('https://doneru.jp/poeenn');
    expect(APP_LINKS.FEEDBACK_FORM_URL).toContain('docs.google.com/forms');
    expect(APP_LINKS.STREAM_TRANS_URL).toBe('https://streamtrans.pages.dev');
    expect(APP_LINKS.TAX_APP_WEB_URL).toBe('https://tax-app.pages.dev');
  });

  it('guarantees personal email address is NEVER exposed in src/ or index.html', () => {
    const srcDir = path.resolve(__dirname, '../src');
    const indexHtmlPath = path.resolve(__dirname, '../index.html');

    function checkFileForEmail(filePath: string) {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('poeen.dosei@gmail.com');
      expect(content).not.toContain('dosei');
    }

    function checkDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx|css|html|json)$/.test(entry.name)) {
          checkFileForEmail(fullPath);
        }
      }
    }

    checkDir(srcDir);
    checkFileForEmail(indexHtmlPath);
  });
});
