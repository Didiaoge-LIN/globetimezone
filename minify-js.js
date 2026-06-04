const fs = require('fs');
const path = require('path');

/**
 * Simple JS minifier - removes comments and collapses whitespace
 * Not as good as Terser but works without dependencies
 */
function minifyJS(code) {
  // Remove multi-line comments /* ... */
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove single-line comments // ...
  code = code.replace(/\/\/.*$/gm, '');
  // Remove leading/trailing whitespace per line
  code = code.replace(/^\s+|\s+$/gm, '');
  // Collapse multiple whitespace to single space (preserve newlines for debugging)
  code = code.replace(/[ \t]+/g, ' ');
  // Remove spaces around operators and punctuation (carefully)
  code = code.replace(/\s*([{}\(\)\[\];,:><=!&|?+\-*/%^~])\s*/g, '$1');
  // Restore spaces that are needed (after keywords)
  code = code.replace(/\b(function|return|typeof|instanceof|new|delete|throw|case|in|of|void|var|let|const|if|else|for|while|do|switch|try|catch|finally|with|yield|async|await|class|extends|export|import|from|default|this|super)\(/g, '$1 (');
  code = code.replace(/\b(function|return|typeof|instanceof|new|delete|throw|case|in|of|void|var|let|const|if|else|for|while|do|switch|try|catch|finally|with|yield|async|await|class|extends|export|import|from|default|this|super)\[/g, '$1 [');
  // Remove empty lines
  code = code.replace(/\n\s*\n/g, '\n');
  return code.trim();
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node minify-js.js file1.js file2.js ...');
  process.exit(1);
}

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error(`SKIP: ${file} (not found)`);
    continue;
  }

  const code = fs.readFileSync(file, 'utf8');
  const minified = minifyJS(code);

  const origSize = Buffer.byteLength(code, 'utf8');
  const minSize = Buffer.byteLength(minified, 'utf8');
  const saved = origSize - minSize;
  const pct = origSize > 0 ? (saved / origSize * 100).toFixed(1) : 0;

  // Write .min.js
  const minFile = file.replace(/\.js$/, '.min.js');
  fs.writeFileSync(minFile, minified, 'utf8');

  console.log(`OK: ${path.basename(file)} -> ${path.basename(minFile)}  (${origSize}B -> ${minSize}B, -${pct}%)`);
}

console.log('\nDone. Remember to update HTML references to .min.js');
