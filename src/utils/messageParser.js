export function parseMessage(text) {
  
  const codeBlockRegex = /```(\w+)?[ \t]*\n?([\s\S]*?)```/g;
  let parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Text before the code block
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }
    // Code block with language
    parts.push({
      type: 'code',
      content: match[2].trim(),
      language: match[1] ? match[1].toLowerCase() : 'js'
    });
    lastIndex = match.index + match[0].length;
  }

  // Rest of the text after the last code block
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}