import React, { useState, useEffect, useRef } from "react";

/* 
  1) parseSegments: 
     - Splits text on '{{{' and '}}}'
     - Extracts language and readOnly marker from the first line
     - Remainder of block is code content

  2) buildRawText:
     - Reconstructs the original text, 
       putting language and optional [readonly] back into the first line
*/
function parseSegments(rawText) {
    const segments = [];
    let index = 0;

    while (index < rawText.length) {
        const start = rawText.indexOf("{{{", index);
        if (start === -1) {
            // No more code blocks
            segments.push({ type: "text", content: rawText.slice(index) });
            break;
        }

        // Add preceding text
        if (start > index) {
            segments.push({ type: "text", content: rawText.slice(index, start) });
        }

        // Find closing delimiter
        const end = rawText.indexOf("}}}", start + 3);
        if (end === -1) {
            // No closing, treat everything else as code
            const codeBlock = rawText.slice(start + 3);
            segments.push(parseCodeBlock(codeBlock));
            break;
        } else {
            const codeBlock = rawText.slice(start + 3, end);
            segments.push(parseCodeBlock(codeBlock));
            index = end + 3;
        }
    }

    return segments;
}

// Helper to parse a single code block: extract language, readOnly, content
function parseCodeBlock(blockText) {
    // The first line might contain language and an optional [readonly]
    // e.g. "python [readonly]" or just "python" or "[readonly]"
    const lines = blockText.split("\n");
    let firstLine = lines.shift() || "";
    let content = lines.join("\n");

    let readOnly = false;
    let language = "";

    // Check if [readonly] is in the first line
    if (firstLine.includes("[readonly]")) {
        readOnly = true;
        firstLine = firstLine.replace("[readonly]", "").trim();
    }

    // Whatever remains is the language
    language = firstLine.trim();

    return {
        type: "code",
        language,
        readOnly,
        content,
    };
}

function buildRawText(segments) {
    return segments
        .map((seg) => {
            if (seg.type === "text") {
                return seg.content;
            } else {
                // Code block
                const roMarker = seg.readOnly ? " [readonly]" : "";
                // Put language + [readonly] marker on first line, then code
                return `{{{${seg.language}${roMarker}\n${seg.content}}}}`;
            }
        })
        .join("");
}

function Editor({ initialContent, mode }) {
    const [rawText, setRawText] = useState(initialContent);
    const [segments, setSegments] = useState([]);
    const editorRef = useRef(null);

    // Expose a method to get final raw text
    useEffect(() => {
        window._editorRef = editorRef.current;
        return () => {
            if (window._editorRef === editorRef.current) {
                window._editorRef = null;
            }
        };
    }, []);

    useEffect(() => {
        setRawText(initialContent);
    }, [initialContent]);

    useEffect(() => {
        if (mode === "enhanced") {
            // Parse the raw text into segments
            setSegments(parseSegments(rawText));
        }
    }, [mode, rawText]);

    // This function can be called by the parent to get the final raw text
    const getRawText = () => {
        if (mode === "raw") {
            return rawText;
        }
        // Rebuild from segments
        return buildRawText(segments);
    };

    // Expose the getRawText method via a ref
    editorRef.current = { getRawText };

    // Enhanced mode: handle changes in code blocks
    const handleSegmentChange = (idx, newValue) => {
        const updated = [...segments];
        updated[idx].content = newValue;
        setSegments(updated);
    };

    if (mode === "raw") {
        return (
            <textarea
                style={{ width: "100%", height: "400px" }}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
            />
        );
    } else {
        // Enhanced mode
        return (
            <div>
                {segments.map((seg, idx) => {
                    if (seg.type === "text") {
                        // Just show as normal text
                        return (
                            <div
                                key={idx}
                                style={{ whiteSpace: "pre-wrap", marginBottom: "1rem" }}
                            >
                                {seg.content}
                            </div>
                        );
                    } else {
                        // Code block
                        const { language, readOnly, content } = seg;
                        return (
                            <div key={idx} style={{ marginBottom: "1rem" }}>
                                <p style={{ fontStyle: "italic", marginBottom: "5px" }}>
                                    Language: {language || "none"}
                                    {readOnly && " (read-only)"}
                                </p>
                                {readOnly ? (
                                    // If readOnly is true, show content in a non-editable <pre>
                                    <pre
                                        style={{
                                            width: "100%",
                                            minHeight: "100px",
                                            background: "#f8f8f8",
                                            border: "1px solid #ddd",
                                            padding: "5px",
                                            overflow: "auto",
                                        }}
                                    >
                                        {content}
                                    </pre>
                                ) : (
                                    // Otherwise, show an editable textarea
                                    <textarea
                                        style={{
                                            width: "100%",
                                            height: "200px",
                                            background: "#f8f8f8",
                                            border: "1px solid #ddd",
                                            padding: "5px",
                                            overflow: "auto",
                                        }}
                                        value={content}
                                        onChange={(e) => handleSegmentChange(idx, e.target.value)}
                                    />
                                )}
                            </div>
                        );
                    }
                })}
            </div>
        );
    }
}

export default Editor;
