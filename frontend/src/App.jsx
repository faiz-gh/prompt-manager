import React, { useState, useEffect } from "react";
import Editor from "./Editor";
import "./App.css";

// Import react-toastify for non-blocking notifications
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editorMode, setEditorMode] = useState("raw"); // "raw" or "enhanced"

  // Fetch list of templates on mount
  useEffect(() => {
    fetch("https://api.prompts.faizghanchi.com/templates")
      .then((res) => res.json())
      .then((data) => setTemplates(data))
      .catch((err) => {
        console.error(err);
        toast.error("Failed to fetch templates.");
      });
  }, []);

  // When a template is clicked, fetch its full details (including content)
  const handleSelectTemplate = (tmpl) => {
    if (tmpl.id) {
      fetch(`https://api.prompts.faizghanchi.com/templates/${tmpl.id}`)
        .then((res) => res.json())
        .then((data) => {
          setSelectedTemplate(data);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Failed to fetch template details.");
        });
    } else {
      // For a new template (id === null)
      setSelectedTemplate(tmpl);
    }
  };

  // When "New Template" is clicked, prompt for a name immediately.
  const handleNewTemplate = () => {
    const name = prompt("Enter a name for the new template:");
    if (!name) return;
    setSelectedTemplate({ id: null, name, content: "" });
  };

  const toggleEditorMode = () => {
    setEditorMode((prev) => (prev === "raw" ? "enhanced" : "raw"));
  };

  // Save the current template
  const handleSaveTemplate = (finalRawText) => {
    if (!selectedTemplate) return;

    if (!selectedTemplate.id) {
      // New template: create it.
      fetch("https://api.prompts.faizghanchi.com/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedTemplate.name, content: finalRawText }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Error creating template");
          }
          return res.json();
        })
        .then((created) => {
          setTemplates((prev) => [...prev, created]);
          setSelectedTemplate(created);
          toast.success("Template created!");
        })
        .catch((err) => {
          console.error("Error creating template:", err);
          toast.error("Error creating template.");
        });
    } else {
      // Update existing template
      fetch(`https://api.prompts.faizghanchi.com/templates/${selectedTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedTemplate.name, content: finalRawText }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Error updating template");
          }
          toast.success("Template updated!");
        })
        .catch((err) => {
          console.error("Error updating template:", err);
          toast.error("Error updating template.");
        });
    }
  };

  // Delete the selected template
  const handleDeleteTemplate = () => {
    if (!selectedTemplate || !selectedTemplate.id) return;
    if (!window.confirm("Are you sure you want to delete this template?")) return;

    fetch(`https://api.prompts.faizghanchi.com/templates/${selectedTemplate.id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Error deleting template");
        }
        setTemplates((prev) => prev.filter((t) => t.id !== selectedTemplate.id));
        setSelectedTemplate(null);
        toast.success("Template deleted!");
      })
      .catch((err) => {
        console.error("Error deleting template:", err);
        toast.error("Error deleting template.");
      });
  };

  // Copy raw text from the Editor
  const handleCopyRawText = () => {
    if (!selectedTemplate) return;
    const finalRaw = window._editorRef?.getRawText?.();
    if (finalRaw === undefined || finalRaw === null) return;

    // Remove [readonly] markers and replace {{{ and }}} with four backticks
    const stripped = finalRaw
      .replace(/\[readonly\]/g, "")
      .replace(/{{{/g, "````")
      .replace(/}}}/g, "````");

    navigator.clipboard.writeText(stripped).then(
      () => toast.info("Raw text copied to clipboard!"),
      () => toast.error("Failed to copy text.")
    );
  };


  // Save button: get final content from Editor and then save
  const handleSaveClick = () => {
    const finalRaw = window._editorRef?.getRawText?.();
    if (finalRaw !== undefined && finalRaw !== null) {
      handleSaveTemplate(finalRaw);
    } else {
      toast.error("Editor content is undefined.");
    }
  };

  return (
    <div className="app-container">
      {/* Toast notifications */}
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Sidebar */}
      <aside className="sidebar">
        <h2>Templates</h2>
        <button className="new-template-btn" onClick={handleNewTemplate}>
          + New Template
        </button>
        <ul className="template-list">
          {templates.map((tmpl) => (
            <li
              key={tmpl.id}
              className={selectedTemplate && selectedTemplate.id === tmpl.id ? "selected" : ""}
              onClick={() => handleSelectTemplate(tmpl)}
            >
              {tmpl.name}
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Toolbar */}
        <div className="toolbar">
          <button onClick={toggleEditorMode}>
            Switch to {editorMode === "raw" ? "Enhanced" : "Raw"} Editor
          </button>
          <button onClick={handleSaveClick}>Save Template</button>
          <button onClick={handleDeleteTemplate}>Delete Template</button>
          <button onClick={handleCopyRawText}>Copy Raw Text</button>
        </div>

        {/* Editor Area */}
        <div className="editor-area">
          {selectedTemplate ? (
            <Editor
              initialContent={selectedTemplate.content || ""}
              mode={editorMode}
            />
          ) : (
            <p style={{ padding: "10px" }}>Select a template or create a new one.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
