#!/usr/bin/env node
'use strict';

// Dependency-free checks for this repository's Markdown links. This checker is
// deliberately offline: it verifies local targets and fragments, not network
// availability or the content of external sites.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');

function withoutCode(markdown, stripInline = true) {
  let fence = null;
  return markdown.split(/\r?\n/).map(line => {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (fence === marker[1][0]) fence = null;
      return '';
    }
    return fence ? '' : (stripInline ? line.replace(/`+[^`]*`+/g, '') : line);
  }).join('\n');
}

function slug(text) {
  return text.replace(/<[^>]*>/g, '').replace(/&(?:amp|lt|gt|quot|apos);/g, '')
    .replace(/!?\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '').toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}_\-\s]/gu, '').replace(/\s/g, '-');
}

function anchors(markdown) {
  const ids = new Set();
  const occurrences = new Map();
  const clean = withoutCode(markdown, false);
  for (const match of clean.matchAll(/^\s{0,3}#{1,6}\s+(.+?)(?:\s+#+)?\s*$/gm)) {
    const base = slug(match[1]);
    const count = occurrences.get(base) || 0;
    occurrences.set(base, count + 1);
    ids.add(count ? `${base}-${count}` : base);
  }
  for (const match of clean.matchAll(/<(?:a|[hH][1-6])\b[^>]*\b(?:id|name)=["']([^"']+)["']/g)) ids.add(match[1]);
  return ids;
}

function links(markdown) {
  const clean = withoutCode(markdown);
  const found = [];
  // Inline and image links. Parentheses in a destination must be balanced.
  for (let i = 0; i < clean.length - 1; i++) {
    if (clean.slice(i, i + 2) !== '](') continue;
    let end = i + 2, depth = 1;
    for (; end < clean.length && depth; end++) {
      if (clean[end] === '\\') { end++; continue; }
      if (clean[end] === '(') depth++;
      if (clean[end] === ')') depth--;
    }
    if (depth) continue;
    const raw = clean.slice(i + 2, end - 1).trim();
    const target = raw.startsWith('<') ? raw.match(/^<([^>]+)>/)?.[1] : raw.match(/^\S+/)?.[0];
    if (target) found.push(target);
    i = end - 1;
  }
  // Reference definitions are checked even when presently unused.
  for (const match of clean.matchAll(/^\s{0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?/gm)) found.push(match[1]);
  return found;
}

function markdownFiles(root) {
  const found = [];
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      if (['.git', 'node_modules', 'dist', 'release-output'].includes(entry.name)) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && /\.md$/i.test(entry.name)) found.push(file);
    }
  }
  visit(root);
  return found.sort();
}

function checkDocumentation(root = ROOT) {
  const errors = [];
  let localLinks = 0;
  const files = markdownFiles(root);
  for (const file of files) {
    const display = path.relative(root, file);
    for (const target of links(fs.readFileSync(file, 'utf8'))) {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(target)) continue;
      localLinks++;
      const [rawPath, rawFragment] = target.split('#', 2);
      let decoded, fragment;
      try {
        decoded = decodeURIComponent(rawPath.split('?', 1)[0]);
        fragment = rawFragment ? decodeURIComponent(rawFragment) : '';
      } catch {
        errors.push(`${display}: invalid URL encoding in ${target}`);
        continue;
      }
      const resolved = decoded ? path.resolve(path.dirname(file), decoded) : file;
      const relative = path.relative(root, resolved);
      if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        errors.push(`${display}: target leaves repository: ${target}`);
        continue;
      }
      if (!fs.existsSync(resolved)) {
        errors.push(`${display}: missing local target ${target}`);
        continue;
      }
      if (!fragment) continue;
      let document = resolved;
      if (fs.statSync(document).isDirectory()) document = path.join(document, 'README.md');
      if (!fs.existsSync(document)) {
        errors.push(`${display}: no README for directory fragment ${target}`);
        continue;
      }
      const text = fs.readFileSync(document, 'utf8');
      const available = /\.md$/i.test(document) ? anchors(text) :
        new Set([...text.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]));
      if (!available.has(fragment)) errors.push(`${display}: missing fragment ${target}`);
    }
  }
  return {files: files.length, localLinks, errors};
}

if (require.main === module) {
  const result = checkDocumentation();
  if (result.errors.length) {
    process.stderr.write(`${result.errors.join('\n')}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`PASS: ${result.files} Markdown files, ${result.localLinks} local links and fragments checked offline.\n`);
  }
}

module.exports = {withoutCode, slug, anchors, links, markdownFiles, checkDocumentation};
