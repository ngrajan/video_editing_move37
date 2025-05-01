function escapeText(text) {
  return text
    .replace(/([\\:])/g, '\\$1')
    .replace(/,/g, '\\,')
    .replace(/'/g, "\\'");
}

module.exports = { escapeText };
