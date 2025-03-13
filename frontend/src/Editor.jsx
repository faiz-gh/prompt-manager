import React, { useState, useEffect, useRef } from "react";

// Helper: parse segments and code blocks using {{{ ... }}} delimiters
function parseSegments(rawText) {
    const segments = [];
    let index = 0;
    while (index < rawText.length) {
        const start = rawText.indexOf("{{{", index);
        if (start === -1) {
            segments.push({ type: "text", content: rawText.slice(index) });
            break;
        }
        if (start > index) {
            segments.push({ type: "text", content: rawText.slice(index, start) });
        }
        const end = rawText.indexOf("}}}", start + 3);
        if (end === -1) {
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

function parseCodeBlock(blockText) {
    const lines = blockText.split("\n");
    let firstLine = lines.shift() || "";
    let content = lines.join("\n");
    let readOnly = false;
    let language = "";
    if (firstLine.includes("[readonly]")) {
        readOnly = true;
        firstLine = firstLine.replace("[readonly]", "").trim();
    }
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
                const roMarker = seg.readOnly ? " [readonly]" : "";
                return `{{{${seg.language}${roMarker}\n${seg.content}}}}`;
            }
        })
        .join("");
}

function Editor({ initialContent, mode }) {
    const [rawText, setRawText] = useState(initialContent);
    const [segments, setSegments] = useState([]);
    const editorRef = useRef(null);

    // Whenever initialContent changes (e.g. when a new template is selected), update rawText
    useEffect(() => {
        setRawText(initialContent);
    }, [initialContent]);

    // Update segments when in enhanced mode
    useEffect(() => {
        if (mode === "enhanced") {
            setSegments(parseSegments(rawText));
        }
    }, [mode, rawText]);

    // Expose a method to get the final raw text to the parent
    useEffect(() => {
        window._editorRef = {
            getRawText: () => {
                if (mode === "raw") {
                    return rawText;
                } else {
                    return buildRawText(segments);
                }
            },
        };
        return () => {
            window._editorRef = null;
        };
    }, [mode, rawText, segments]);

    // Handle changes in code block segments in enhanced mode
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
                        return (
                            <div key={idx} style={{ whiteSpace: "pre-wrap", marginBottom: "1rem" }}>
                                {seg.content}
                            </div>
                        );
                    } else {
                        const { language, readOnly, content } = seg;
                        return (
                            <div key={idx} style={{ marginBottom: "1rem" }}>
                                <p style={{ fontStyle: "italic", marginBottom: "5px" }}>
                                    Language: {language || "none"} {readOnly ? "(read-only)" : ""}
                                </p>
                                {readOnly ? (
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
