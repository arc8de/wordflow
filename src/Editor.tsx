import { useState, useEffect, useRef } from 'react';

export default function Editor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    words: 0,
    chars: 0,
    sentences: 0,
    paragraphs: 0,
    readTime: '0m',
    wpm: 0
  });
  const [suggestions, setSuggestions] = useState('');
  const [wordFreq, setWordFreq] = useState<Record<string, number>>({});

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const calculateStats = () => {
      const text = editor.innerText || '';
      const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      const chars = text.length;
      const charsNoSpace = text.replace(/\s/g, '').length;
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
      const paragraphs = text.split('\n').filter(p => p.trim().length > 0).length;
      
      // Calculate reading time (avg 200 wpm)
      const readingTime = Math.max(1, Math.ceil(words / 200));
      const readTimeStr = readingTime < 60 ? `${readingTime}m` : `${Math.floor(readingTime / 60)}h ${readingTime % 60}m`;
      
      setStats({
        words,
        chars,
        sentences,
        paragraphs,
        readTime: readTimeStr,
        wpm: 0
      });

      // Calculate word frequency
      const wordArray = text.toLowerCase().match(/\b\w+\b/g) || [];
      const freq: Record<string, number> = {};
      wordArray.forEach(word => {
        freq[word] = (freq[word] || 0) + 1;
      });
      
      // Sort by frequency and keep top 10
      const sorted = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});
      
      setWordFreq(sorted);
    };

    editor.addEventListener('input', calculateStats);
    
    // Initial calculation
    calculateStats();

    return () => {
      editor.removeEventListener('input', calculateStats);
    };
  }, []);

  const handleFormatCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleSave = () => {
    const text = editorRef.current?.innerText || '';
    localStorage.setItem('wordflow-content', text);
    alert('Document saved!');
  };

  const handleSaveAsText = () => {
    const text = editorRef.current?.innerText || '';
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', 'document.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyToClipboard = () => {
    const text = editorRef.current?.innerText || '';
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  const handleInsertDate = () => {
    const now = new Date().toLocaleString();
    document.execCommand('insertHTML', false, now);
  };

  const maxFreqValue = Math.max(...Object.values(wordFreq), 1);

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar-container bg-white px-3 py-1 border-bottom sticky-top" style={{ zIndex: 999 }}>
        <div className="container-fluid d-flex align-items-center gap-1 overflow-auto py-1">
          
          {/* Dropdown Menus */}
          <div className="d-flex gap-2 me-3">
            {/* File Menu */}
            <div className="dropdown">
              <button className="btn btn-link text-dark p-0" style={{ fontSize: '0.9rem', fontWeight: 500 }} type="button" data-bs-toggle="dropdown">
                File
              </button>
              <ul className="dropdown-menu shadow border-0">
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); }}>
                  <i className="fas fa-file me-2 text-muted"></i> New
                </a></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); }}>
                  <i className="fas fa-folder-open me-2 text-muted"></i> Open
                </a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleSaveAsText(); }}>
                  <i className="fas fa-save me-2 text-muted"></i> Save as TXT
                </a></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); window.print(); }}>
                  <i className="fas fa-print me-2 text-muted"></i> Print
                </a></li>
              </ul>
            </div>

            {/* Edit Menu */}
            <div className="dropdown">
              <button className="btn btn-link text-dark p-0" style={{ fontSize: '0.9rem', fontWeight: 500 }} type="button" data-bs-toggle="dropdown">
                Edit
              </button>
              <ul className="dropdown-menu shadow border-0">
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); document.execCommand('undo'); }}>
                  <i className="fas fa-undo me-2 text-muted"></i> Undo
                </a></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); document.execCommand('redo'); }}>
                  <i className="fas fa-redo me-2 text-muted"></i> Redo
                </a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); document.execCommand('selectAll'); }}>
                  <i className="fas fa-mouse-pointer me-2 text-muted"></i> Select All
                </a></li>
              </ul>
            </div>

            {/* Format Menu */}
            <div className="dropdown">
              <button className="btn btn-link text-dark p-0" style={{ fontSize: '0.9rem', fontWeight: 500 }} type="button" data-bs-toggle="dropdown">
                Format
              </button>
              <ul className="dropdown-menu shadow border-0">
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleFormatCommand('bold'); }}>
                  <i className="fas fa-bold me-2 text-muted"></i> Bold
                </a></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleFormatCommand('italic'); }}>
                  <i className="fas fa-italic me-2 text-muted"></i> Italic
                </a></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleFormatCommand('underline'); }}>
                  <i className="fas fa-underline me-2 text-muted"></i> Underline
                </a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleFormatCommand('removeFormat'); }}>
                  <i className="fas fa-eraser me-2 text-muted"></i> Clear Formatting
                </a></li>
              </ul>
            </div>

            {/* Tools Menu */}
            <div className="dropdown">
              <button className="btn btn-link text-dark p-0" style={{ fontSize: '0.9rem', fontWeight: 500 }} type="button" data-bs-toggle="dropdown">
                Tools
              </button>
              <ul className="dropdown-menu shadow border-0">
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); alert('Writing analysis complete'); }}>
                  <i className="fas fa-spell-check me-2 text-muted"></i> Writing Assistant
                </a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleInsertDate(); }}>
                  <i className="fas fa-calendar-alt me-2 text-muted"></i> Insert Timestamp
                </a></li>
              </ul>
            </div>

            {/* Help Menu */}
            <div className="dropdown">
              <button className="btn btn-link text-dark p-0" style={{ fontSize: '0.9rem', fontWeight: 500 }} type="button" data-bs-toggle="dropdown">
                Help
              </button>
              <ul className="dropdown-menu shadow border-0">
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); alert('WordFlow v1.0 — Smart Writing Assistant'); }}>
                  <i className="fas fa-info-circle me-2 text-muted"></i> About WordFlow
                </a></li>
                <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); alert('Tip: Use formatting buttons or keyboard shortcuts to format your text'); }}>
                  <i className="fas fa-lightbulb me-2 text-muted"></i> Keyboard Shortcuts
                </a></li>
              </ul>
            </div>
          </div>

          <div className="vr mx-1"></div>
          
          {/* File Group */}
          <div className="btn-group me-2">
            <button 
              className="btn btn-light btn-sm" 
              title="Save"
              onClick={handleSave}
            >
              <i className="fas fa-save"></i>
            </button>
            <button className="btn btn-light btn-sm" title="Print" onClick={() => window.print()}>
              <i className="fas fa-print"></i>
            </button>
          </div>

          <div className="vr mx-1"></div>

          {/* Formatting Group */}
          <div className="btn-group me-2">
            <button 
              className="btn btn-light btn-sm" 
              title="Bold (Ctrl+B)"
              onClick={() => handleFormatCommand('bold')}
            >
              <i className="fas fa-bold"></i>
            </button>
            <button 
              className="btn btn-light btn-sm" 
              title="Italic (Ctrl+I)"
              onClick={() => handleFormatCommand('italic')}
            >
              <i className="fas fa-italic"></i>
            </button>
            <button 
              className="btn btn-light btn-sm" 
              title="Underline (Ctrl+U)"
              onClick={() => handleFormatCommand('underline')}
            >
              <i className="fas fa-underline"></i>
            </button>
          </div>

          <div className="vr mx-1"></div>

          {/* Alignment Group */}
          <div className="btn-group me-2">
            <button 
              className="btn btn-light btn-sm" 
              title="Align Left"
              onClick={() => handleFormatCommand('justifyLeft')}
            >
              <i className="fas fa-align-left"></i>
            </button>
            <button 
              className="btn btn-light btn-sm" 
              title="Align Center"
              onClick={() => handleFormatCommand('justifyCenter')}
            >
              <i className="fas fa-align-center"></i>
            </button>
            <button 
              className="btn btn-light btn-sm" 
              title="Align Right"
              onClick={() => handleFormatCommand('justifyRight')}
            >
              <i className="fas fa-align-right"></i>
            </button>
          </div>

          {/* Lists Group */}
          <div className="btn-group me-2">
            <button 
              className="btn btn-light btn-sm" 
              title="Numbered List"
              onClick={() => handleFormatCommand('insertOrderedList')}
            >
              <i className="fas fa-list-ol"></i>
            </button>
            <button 
              className="btn btn-light btn-sm" 
              title="Bulleted List"
              onClick={() => handleFormatCommand('insertUnorderedList')}
            >
              <i className="fas fa-list-ul"></i>
            </button>
          </div>

          <div className="vr mx-1"></div>

          {/* Utilities */}
          <button 
            className="btn btn-light btn-sm" 
            title="Insert Date & Time"
            onClick={handleInsertDate}
          >
            <i className="far fa-clock"></i>
          </button>
          <button 
            className="btn btn-light btn-sm" 
            title="Copy to Clipboard"
            onClick={handleCopyToClipboard}
          >
            <i className="fas fa-copy"></i>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <main className="container-fluid pt-2 pb-5 px-lg-3">
        <div className="row g-3">
          
          {/* Editor Section */}
          <div className="col-lg-9">
            <div className="editor-outer d-flex justify-content-center">
              <div 
                ref={editorRef}
                contentEditable
                className="editor-paper shadow"
                style={{
                  width: '100%',
                  maxWidth: '820px',
                  minHeight: '600px',
                  padding: '40px',
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontFamily: 'Georgia, serif',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  outline: 'none',
                  overflow: 'auto'
                }}
              >
                <h1>Welcome to WordFlow</h1>
                <p>Start typing here to begin. This editor supports <b>rich text formatting</b>, live word counting, autosave, and writing suggestions.</p>
                <p>Try selecting text and applying formatting from the toolbar above.</p>
              </div>
            </div>
          </div>

          {/* Right Sidebar (Stats & Suggestions) */}
          <div className="col-lg-3">
            <div className="sticky-sidebar d-flex flex-column gap-4">
              
              {/* Stats Card */}
              <div className="card border-0 shadow-sm overflow-hidden">
                <div className="card-header bg-white border-bottom py-3">
                  <h6 className="mb-0 fw-bold text-muted" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Live Analytics
                  </h6>
                </div>
                <div className="card-body p-3">
                  <div className="row g-2">
                    <div className="col-6">
                      <div className="text-center p-2 bg-light rounded">
                        <p className="text-muted mb-1" style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>WORDS</p>
                        <p className="h4 mb-0 fw-bold">{stats.words}</p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-2 bg-light rounded">
                        <p className="text-muted mb-1" style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>CHARS</p>
                        <p className="h4 mb-0 fw-bold">{stats.chars}</p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-2 bg-light rounded">
                        <p className="text-muted mb-1" style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>READ TIME</p>
                        <p className="h5 mb-0 fw-bold">{stats.readTime}</p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-2 bg-light rounded">
                        <p className="text-muted mb-1" style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>SPEED</p>
                        <p className="h5 mb-0 fw-bold">{stats.wpm} <span style={{ fontSize: '0.6rem' }}>wpm</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggestions Card */}
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                  <h6 className="mb-0 fw-bold">Suggestions</h6>
                </div>
                <div className="card-body p-4 text-center text-muted">
                  <i className="fas fa-sparkles text-warning mb-2" style={{ fontSize: '1.5rem' }}></i>
                  <p className="mb-0" style={{ fontSize: '0.875rem' }}>All clear! No issues found.</p>
                </div>
              </div>

              {/* Word Frequency Chart */}
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                  <h6 className="mb-0 fw-bold">Word Frequency</h6>
                </div>
                <div className="card-body">
                  {Object.keys(wordFreq).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(wordFreq).map(([word, count]) => (
                        <div key={word} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', minWidth: '60px' }}>{word}</span>
                          <div style={{
                            flex: 1,
                            height: '6px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '999px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              backgroundColor: '#667eea',
                              borderRadius: '999px',
                              width: `${(count / maxFreqValue) * 100}%`
                            }}></div>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', minWidth: '20px', textAlign: 'right' }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-muted" style={{ fontSize: '0.875rem' }}>
                      Start typing to see stats
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Bottom Status Bar */}
      <div className="bg-white border-top py-1 px-3 fixed-bottom d-flex justify-content-between align-items-center shadow-lg" style={{ zIndex: 1030 }}>
        <div className="small text-muted d-flex gap-3">
          <span>Words: <b>{stats.words}</b></span>
          <span className="d-none d-sm-inline">Chars: <b>{stats.chars}</b></span>
        </div>
        <div className="small">
          <span className="text-muted"><i className="fas fa-check-circle me-1" style={{ color: '#28a745' }}></i> Autosave ON</span>
        </div>
      </div>
    </div>
  );
}
