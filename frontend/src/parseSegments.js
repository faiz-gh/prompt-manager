// parseSegments.js
export function parseSegments(rawText) {
  // We'll split on `{{{` and then look for the corresponding `}}}`.
  // If you want to handle four-backticks instead, adjust accordingly.

  const segments = [];
  let currentIndex = 0;

  while (currentIndex < rawText.length) {
    // Find the next code block start
    const startIdx = rawText.indexOf("{{{", currentIndex);
    if (startIdx === -1) {
      // No more code blocks
      // The rest is just text
      segments.push({
        type: "text",
        content: rawText.slice(currentIndex)
      });
      break;
    }

    // There's a code block start
    // Everything before startIdx is a text segment
    if (startIdx > currentIndex) {
      segments.push({
        type: "text",
        content: rawText.slice(currentIndex, startIdx)
      });
    }

    // Find the end of the code block
    const endIdx = rawText.indexOf("}}}", startIdx + 3);
    if (endIdx === -1) {
      // No matching }}} - treat everything to the end as code
      const codeContent = rawText.slice(startIdx + 3);
      segments.push({
        type: "code",
        language: "", // optional parse
        content: codeContent
      });
      break;
    }

    // Extract code content between '{{{' and '}}}'
    const codeBlock = rawText.slice(startIdx + 3, endIdx);
    // Optionally parse out a language from the first line
    let language = "";
    let content = codeBlock;
    const firstLineBreak = codeBlock.indexOf("\n");
    if (firstLineBreak !== -1) {
      // The first line might be something like "python"
      language = codeBlock.slice(0, firstLineBreak).trim();
      content = codeBlock.slice(firstLineBreak + 1);
    }

    segments.push({
      type: "code",
      language,
      content
    });

    currentIndex = endIdx + 3; // skip past '}}}'
  }

  return segments;
}

// Reconstruct raw text from segments
export function buildRawText(segments) {
  return segments
    .map((seg) => {
      if (seg.type === "text") {
        return seg.content;
      } else {
        // code block
        // Insert language on the first line, then content, then closing
        return `{{{${seg.language ? seg.language + "\n" : "\n"}${seg.content}}}}`;
      }
    })
    .join("");
}
