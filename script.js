/**
 * WordFlow — Smart Word Processor & Writing Assistant
 * Core Logic (Vanilla JavaScript)
 * 
 * Organized into modules for maintainability.
 */

import { 
    auth, 
    db, 
    googleProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged, 
    doc, 
    setDoc, 
    serverTimestamp 
} from './src/firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL STATE ---
    const state = {
        startTime: null,
        lastKeystrokeTime: null,
        wordCount: 0,
        isAutosaving: false,
        theme: localStorage.getItem('theme') || 'light',
        user: null
    };

    // --- DOM ELEMENTS ---
    const editor = document.getElementById('editor');
    const toolbarButtons = document.querySelectorAll('.toolbar-btn');
    const fontNameSelect = document.getElementById('fontName');
    const fontSizeSelect = document.getElementById('fontSize');
    const foreColorInput = document.getElementById('foreColor');
    const hiliteColorInput = document.getElementById('hiliteColor');
    
    // Stats elements
    const statWords = document.getElementById('stat-words');
    const statChars = document.getElementById('stat-chars');
    const statCharsNoSpace = document.getElementById('stat-chars-no-space');
    const statSentences = document.getElementById('stat-sentences');
    const statParagraphs = document.getElementById('stat-paragraphs');
    const statReading = document.getElementById('stat-reading');
    const statSpeaking = document.getElementById('stat-speaking');
    const statWpm = document.getElementById('stat-wpm');
    const barWords = document.getElementById('bar-words');
    const barLines = document.getElementById('bar-lines');

    // UI Helpers
    const showToast = (message, type = 'primary') => {
        const toastEl = document.getElementById('app-toast');
        const toastBody = document.getElementById('toast-message');
        toastEl.className = `toast align-items-center border-0 shadow bg-${type} text-white`;
        toastBody.innerText = message;
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    };

    // === EDITOR CORE ===
    const EditorCore = {
        init() {
            // Trigger initial calculation
            this.update();
            
            // Selection change listener for toolbar highlighting
            document.addEventListener('selectionchange', () => {
                this.updateToolbarState();
                this.updateDropdowns();
            });
            
            // Format buttons
            toolbarButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const command = btn.getAttribute('data-command');
                    this.execute(command);
                    btn.classList.toggle('active', document.queryCommandState(command));
                });
            });

            // Selects
            fontNameSelect.addEventListener('change', () => this.execute('fontName', fontNameSelect.value));
            fontSizeSelect.addEventListener('change', () => {
                const size = fontSizeSelect.value;
                this.executeFontSize(size);
            });
            foreColorInput.addEventListener('input', () => this.execute('foreColor', foreColorInput.value));
            hiliteColorInput.addEventListener('input', () => this.execute('hiliteColor', hiliteColorInput.value));

            // Input event for real-time updates
            editor.addEventListener('input', () => {
                this.update();
                StatsEngine.handleKeystroke();
                SuggestionsEngine.debouncedCheck();
            });

            // Date & Time
            document.getElementById('btn-date').addEventListener('click', () => {
                const now = new Date().toLocaleString();
                this.execute('insertHTML', now);
            });

            // Copy
            document.getElementById('btn-copy').addEventListener('click', () => {
                const text = editor.innerText;
                navigator.clipboard.writeText(text).then(() => {
                    showToast('Copied to clipboard!', 'success');
                });
            });
        },

        execute(command, value = null) {
            editor.focus();
            document.execCommand(command, false, value);
            this.updateToolbarState();
        },

        executeFontSize(size) {
            editor.focus();
            // Use standard fontSize first to get a <font> tag marker, then replace with style
            // We use 7 as it's the largest and unlikely to be used by default
            document.execCommand('fontSize', false, "7");
            const fontElements = Array.from(editor.getElementsByTagName("font"));
            fontElements.forEach(el => {
                if (el.getAttribute('size') === "7") {
                    el.removeAttribute("size");
                    el.style.fontSize = size;
                    // Change tag to span for cleaner HTML if possible
                    const span = document.createElement('span');
                    span.style.fontSize = size;
                    span.innerHTML = el.innerHTML;
                    el.parentNode.replaceChild(span, el);
                }
            });
            this.updateToolbarState();
            this.updateDropdowns();
        },
        
        rgbToHex(rgb) {
            if (!rgb) return null;
            if (rgb.startsWith('#')) return rgb;
            const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
            if (!match) return null;
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        },

        update() {
            const text = editor.innerText || '';
            const html = editor.innerHTML;
            
            StatsEngine.calculate(text);
            AutosaveEngine.markDirty();
        },

        updateToolbarState() {
            toolbarButtons.forEach(btn => {
                const command = btn.getAttribute('data-command');
                try {
                    if (document.queryCommandState(command)) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                } catch (e) {}
            });
        },

        updateDropdowns() {
            // Update Font Name
            const fontNameRaw = document.queryCommandValue('fontName');
            if (fontNameRaw) {
                const fontName = fontNameRaw.replace(/['"]/g, '').toLowerCase();
                const options = Array.from(fontNameSelect.options);
                const match = options.find(opt => {
                    const val = opt.value.toLowerCase();
                    return val === fontName || fontName.includes(val) || val.includes(fontName);
                });
                if (match) {
                    fontNameSelect.value = match.value;
                }
            }

            // Update Colors
            const currentForeColor = document.queryCommandValue('foreColor');
            if (currentForeColor) {
                // Convert to hex for input[type="color"]
                const hexColor = this.rgbToHex(currentForeColor);
                if (hexColor) foreColorInput.value = hexColor;
            }

            const currentHiliteColor = document.queryCommandValue('hiliteColor');
            // hiliteColor can return "transparent" or false in some browsers
            if (currentHiliteColor && currentHiliteColor !== 'transparent' && currentHiliteColor !== 'rgba(0, 0, 0, 0)') {
                const hexHilite = this.rgbToHex(currentHiliteColor);
                if (hexHilite) hiliteColorInput.value = hexHilite;
            }

            // Update Font Size
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                let node = selection.anchorNode;
                if (node.nodeType === 3) node = node.parentElement; 
                
                if (node) {
                    const style = window.getComputedStyle(node);
                    const computedSize = style.fontSize;
                    const numericComputed = Math.round(parseFloat(computedSize));
                    
                    const options = Array.from(fontSizeSelect.options);
                    const match = options.find(opt => {
                        const optNumeric = Math.round(parseFloat(opt.value));
                        return optNumeric === numericComputed;
                    });

                    if (match) {
                        fontSizeSelect.value = match.value;
                    }
                }
            }
        }
    };

    // === STATS ENGINE ===
    const StatsEngine = {
        calculate(text) {
            // Basic counts
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            const chars = text.length;
            const charsNoSpace = text.replace(/\s/g, '').length;
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
            const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0).length;
            
            // Update UI
            if (statWords) statWords.innerText = words;
            if (statChars) statChars.innerText = chars;
            if (statCharsNoSpace) statCharsNoSpace.innerText = charsNoSpace;
            if (statSentences) statSentences.innerText = sentences;
            if (statParagraphs) statParagraphs.innerText = paragraphs;
            if (barWords) barWords.innerText = words;
            if (barLines) barLines.innerText = paragraphs; 

            // Times
            const readingMin = words / 200;
            const speakingMin = words / 130;
            
            if (statReading) statReading.innerText = `${Math.ceil(readingMin)}m`;
            if (statSpeaking) statSpeaking.innerText = `${Math.ceil(speakingMin)}m`;

            state.wordCount = words;
            this.updateFrequency(text);
        },

        formatTime(minutes) {
            const m = Math.floor(minutes);
            const s = Math.floor((minutes - m) * 60);
            return `${m}m ${s}s`;
        },

        handleKeystroke() {
            const now = Date.now();
            if (!state.startTime) state.startTime = now;
            state.lastKeystrokeTime = now;
            
            this.calculateWPM();
        },

        calculateWPM() {
            if (!state.startTime) return;
            const elapsedMin = (Date.now() - state.startTime) / 60000;
            if (elapsedMin < 0.01) return;
            
            const wpm = Math.round(state.wordCount / elapsedMin);
            if (statWpm) statWpm.innerText = wpm;

            // Reset logic: idle for 5s
            clearTimeout(this.idleTimer);
            this.idleTimer = setTimeout(() => {
                state.startTime = null;
                if (statWpm) statWpm.innerText = `0`;
            }, 5000);
        },

        updateFrequency(text) {
            const stopwords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'it', 'this', 'that', 'i', 'you', 'he', 'she', 'they', 'we'];
            const tokens = text.toLowerCase().match(/\b\w+\b/g) || [];
            const freq = {};
            
            tokens.forEach(word => {
                if (word.length > 2 && !stopwords.includes(word)) {
                    freq[word] = (freq[word] || 0) + 1;
                }
            });

            const sorted = Object.entries(freq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            const container = document.getElementById('frequency-bars');
            container.innerHTML = '';
            
            if (sorted.length === 0) {
                container.innerHTML = '<div class="text-center py-2 text-muted small">No data yet</div>';
                return;
            }

            const max = sorted[0][1];
            sorted.forEach(([word, count]) => {
                const width = (count / max) * 100;
                const item = document.createElement('div');
                item.className = 'freq-item';
                item.innerHTML = `
                    <div class="d-flex justify-content-between small">
                        <span>${word}</span>
                        <span class="text-muted">${count}</span>
                    </div>
                    <div class="freq-bar-outer">
                        <div class="freq-bar-inner" style="width: ${width}%"></div>
                    </div>
                `;
                container.appendChild(item);
            });
        }
    };

    // === FILE OPERATIONS ===
    const FileOperations = {
        init() {
            document.getElementById('btn-new').addEventListener('click', () => {
                if (confirm('Create new document? Unsaved changes will be lost.')) {
                    editor.innerHTML = '<h1>New Document</h1><p>Start typing...</p>';
                    EditorCore.update();
                }
            });

            document.getElementById('btn-open').addEventListener('click', () => {
                document.getElementById('file-input').click();
            });

            document.getElementById('file-input').addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    editor.innerText = e.target.result;
                    EditorCore.update();
                    showToast('File opened successfully', 'info');
                };
                reader.readAsText(file);
            });

            document.getElementById('btn-save-txt').addEventListener('click', () => this.save('text/plain', 'wordflow-doc.txt'));
            document.getElementById('btn-save-html').addEventListener('click', () => this.save('text/html', 'wordflow-doc.html', true));
            document.getElementById('btn-print').addEventListener('click', () => window.print());
        },

        save(type, filename, isHtml = false) {
            const content = isHtml ? editor.innerHTML : editor.innerText;
            const blob = new Blob([content], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Document saved!', 'success');
        }
    };

    // === SEARCH ENGINE ===
    const SearchEngine = {
        currentMatches: [],
        currentIndex: -1,

        init() {
            const toggle = document.getElementById('toggle-search');
            const sidebar = document.getElementById('search-sidebar');
            const closeBtn = document.getElementById('close-search');

            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('d-none');
                if (!sidebar.classList.contains('d-none')) {
                    document.getElementById('find-input').focus();
                } else {
                    this.clear();
                }
            });

            closeBtn.addEventListener('click', () => sidebar.classList.add('d-none'));

            document.getElementById('find-input').addEventListener('input', () => this.find());
            document.getElementById('find-next').addEventListener('click', () => this.move(1));
            document.getElementById('find-prev').addEventListener('click', () => this.move(-1));
            document.getElementById('replace-one').addEventListener('click', () => this.replace());
            document.getElementById('replace-all').addEventListener('click', () => this.replaceAll());
        },

        find() {
            const query = document.getElementById('find-input').value;
            this.clear();
            if (!query) return;

            // Simple search implementation:
            // We use standard window.find or manual highlighting. 
            // Manual highlighting is complex in contenteditable without breaking structure.
            // For this project, we'll use a regex search and count matches.
            const text = editor.innerText;
            const regex = new RegExp(query, 'gi');
            const matches = text.match(regex);
            
            document.getElementById('search-count').innerText = `Matches: ${matches ? matches.length : 0}`;
            
            // Visual highlight (Advanced: using Rangy or custom marker. 
            // Simple: just find first)
            this.currentMatches = matches || [];
            this.currentIndex = -1;
        },

        move(dir) {
            const query = document.getElementById('find-input').value;
            if (!query) return;
            
            // Use browser builtin find for scrolling
            const found = window.find(query, false, dir < 0, true, false, true, false);
            if (!found) {
                // Wrap around logic
                window.getSelection().removeAllRanges();
                window.find(query, false, dir < 0, true, false, true, false);
            }
        },

        replace() {
            const query = document.getElementById('find-input').value;
            const replacement = document.getElementById('replace-input').value;
            if (!query) return;

            const selection = window.getSelection();
            if (selection.toString().toLowerCase() === query.toLowerCase()) {
                document.execCommand('insertText', false, replacement);
                this.find();
            } else {
                this.move(1);
            }
        },

        replaceAll() {
            const query = document.getElementById('find-input').value;
            const replacement = document.getElementById('replace-input').value;
            if (!query) return;

            const html = editor.innerHTML;
            // Be careful not to replace tags. Better to use text-based replacement.
            // Simplified replacement for the core text:
            const text = editor.innerText;
            const newText = text.split(new RegExp(query, 'gi')).join(replacement);
            editor.innerText = newText;
            
            EditorCore.update();
            this.find();
            showToast('Replaced all occurrences', 'info');
        },

        clear() {
            document.getElementById('search-count').innerText = 'Matches: 0';
        }
    };

    // === SUGGESTIONS ENGINE ===
    const SuggestionsEngine = {
        timer: null,

        debouncedCheck() {
            clearTimeout(this.timer);
            this.timer = setTimeout(() => this.check(), 500);
        },

        check() {
            const text = editor.innerText;
            const suggestions = [];

            // Detect issues
            const doubleSpace = (text.match(/  /g) || []).length;
            if (doubleSpace > 0) {
                suggestions.push({
                    type: 'Spacing',
                    msg: `Found ${doubleSpace} double spaces.`,
                    fix: 'Remove double spaces',
                    action: () => {
                        editor.innerText = editor.innerText.replace(/  /g, ' ');
                        EditorCore.update();
                    }
                });
            }

            const repeated = text.match(/\b(\w+)\s+\1\b/gi);
            if (repeated) {
                suggestions.push({
                    type: 'Grammar',
                    msg: `Repeated words: "${repeated[0]}"`,
                    fix: 'Remove duplicate',
                    action: () => {
                        editor.innerText = editor.innerText.replace(/\b(\w+)\s+\1\b/gi, '$1');
                        EditorCore.update();
                    }
                });
            }

            const longSentences = text.split(/[.!?]+/).filter(s => s.trim().split(/\s+/).length > 25);
            if (longSentences.length > 0) {
                suggestions.push({
                    type: 'Style',
                    msg: 'Some sentences are very long (>25 words).',
                    fix: 'Break them up'
                });
            }

            this.render(suggestions);
        },

        render(suggestions) {
            const container = document.getElementById('suggestions-list');
            container.innerHTML = '';

            if (suggestions.length === 0) {
                container.innerHTML = `
                    <div class="text-center p-4 text-muted small">
                        <i class="fas fa-sparkles text-warning mb-2"></i>
                        <p class="mb-0">All clear! No issues found.</p>
                    </div>
                `;
                return;
            }

            suggestions.forEach((s, idx) => {
                const card = document.createElement('div');
                const isWarning = s.type === 'Grammar' || s.type === 'Spacing';
                card.className = `suggestion-card ${isWarning ? 'warning' : 'info'} p-3 shadow-sm mx-2 mb-3`;
                card.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <span class="text-[10px] font-bold uppercase tracking-wider ${isWarning ? 'text-warning' : 'text-primary'}" style="font-size: 0.65rem;">${s.type}</span>
                        <button class="btn-close small remove-sugg" data-idx="${idx}" style="font-size: 0.5rem;"></button>
                    </div>
                    <p class="small mb-2 fw-medium text-dark" style="font-size: 0.75rem;">${s.msg}</p>
                    ${s.fix ? `<button class="btn btn-sm ${isWarning ? 'btn-warning' : 'btn-primary'} py-1 px-3 fw-bold fix-btn" style="font-size: 0.65rem;" data-idx="${idx}">Fix Now</button>` : ''}
                `;
                
                card.querySelector('.remove-sugg').onclick = () => card.remove();
                if (s.action) {
                    card.querySelector('.fix-btn').onclick = () => {
                        s.action();
                        this.check();
                    };
                }
                
                container.appendChild(card);
            });
        }
    };

    // === AUTOSAVE ENGINE ===
    const AutosaveEngine = {
        dirty: false,
        
        init() {
            // Check for existing draft
            const draft = localStorage.getItem('wf_draft');
            if (draft && draft !== editor.innerHTML) {
                document.getElementById('restore-banner').classList.remove('d-none');
            }

            document.getElementById('btn-restore').onclick = () => {
                editor.innerHTML = draft;
                EditorCore.update();
                document.getElementById('restore-banner').classList.add('d-none');
                showToast('Draft restored!', 'info');
            };

            document.getElementById('btn-discard').onclick = () => {
                document.getElementById('restore-banner').classList.add('d-none');
                localStorage.removeItem('wf_draft');
            };

            // Setup interval
            setInterval(() => this.save(), 30000); // 30s
        },

        markDirty() {
            this.dirty = true;
            document.getElementById('save-status').classList.add('d-none');
        },

        save() {
            if (!this.dirty) return;
            
            const statusBadge = document.getElementById('save-status');
            const dot = statusBadge ? statusBadge.querySelector('.bg-success, .bg-warning') : null;
            const text = statusBadge ? statusBadge.querySelector('.text-muted') : null;
            
            if (dot) dot.className = 'bg-warning rounded-circle animate-pulse'; // temporary "saving" state
            if (text) text.innerText = 'Saving...';

            try {
                localStorage.setItem('wf_draft', editor.innerHTML);
                this.dirty = false;
                
                setTimeout(() => {
                    if (dot) dot.className = 'bg-success rounded-circle';
                    if (text) text.innerText = 'Saved to LocalStorage';
                }, 1000);
            } catch (e) {
                console.error('Autosave failed:', e);
                if (dot) dot.className = 'bg-danger rounded-circle';
                if (text) text.innerText = 'Save Error';
                showToast('Autosave failed (Storage full?)', 'danger');
            }
        }
    };

    // === UI UTILS ===
    const UIHelpers = {
        init() {
            // Dark Mode
            const toggle = document.getElementById('toggle-dark-mode');
            const updateUI = () => {
                document.documentElement.setAttribute('data-theme', state.theme);
                toggle.innerHTML = state.theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
                localStorage.setItem('theme', state.theme);
            };
            
            toggle.addEventListener('click', () => {
                state.theme = state.theme === 'light' ? 'dark' : 'light';
                updateUI();
            });
            updateUI();

            // Fullscreen
            document.getElementById('toggle-fullscreen').addEventListener('click', () => this.toggleFullscreen());
            
            // Shortcuts
            window.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch(e.key.toLowerCase()) {
                        case 's': e.preventDefault(); AutosaveEngine.save(); showToast('Document saved manually', 'success'); break;
                        case 'f': e.preventDefault(); document.getElementById('toggle-search').click(); break;
                        case 'b': EditorCore.updateToolbarState(); break; // document.execCommand handled by browser but we update state
                        case 'i': EditorCore.updateToolbarState(); break;
                        case 'u': EditorCore.updateToolbarState(); break;
                    }
                }
                if (e.key === 'F11') {
                    // Custom handle if needed
                }
            });
        },

        toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    showToast(`Error: ${err.message}`, 'danger');
                });
            } else {
                document.exitFullscreen();
            }
        }
    };

    // === AUTH ENGINE ===
    const AuthEngine = {
        init() {
            const btnLogin = document.getElementById('btn-login');
            const btnLogout = document.getElementById('btn-logout');
            const userProfile = document.getElementById('user-profile');
            const userAvatar = document.getElementById('user-avatar');
            const userName = document.getElementById('user-name');

            if (btnLogin) {
                btnLogin.onclick = async () => {
                    try {
                        await signInWithPopup(auth, googleProvider);
                    } catch (error) {
                        console.error('Login failed:', error);
                        showToast('Login failed', 'danger');
                    }
                };
            }

            if (btnLogout) {
                btnLogout.onclick = async () => {
                    try {
                        await signOut(auth);
                    } catch (error) {
                        console.error('Logout failed:', error);
                    }
                };
            }

            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    state.user = user;
                    if (btnLogin) btnLogin.classList.add('d-none');
                    if (userProfile) userProfile.classList.remove('d-none');
                    if (userAvatar) userAvatar.src = user.photoURL || '';
                    if (userName) userName.innerText = user.displayName || 'User';
                    
                    showToast(`Welcome, ${user.displayName}!`, 'success');
                    
                    // Sync user to Firestore
                    await this.syncUser(user);
                } else {
                    state.user = null;
                    if (btnLogin) btnLogin.classList.remove('d-none');
                    if (userProfile) userProfile.classList.add('d-none');
                    if (userAvatar) userAvatar.src = '';
                    if (userName) userName.innerText = '';
                }
            });
        },

        async syncUser(user) {
            const userRef = doc(db, 'users', user.uid);
            try {
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    lastLogin: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }, { merge: true });
            } catch (error) {
                this.handleFirestoreError(error, 'write', `users/${user.uid}`);
            }
        },

        handleFirestoreError(error, operationType, path) {
            const errInfo = {
                error: error instanceof Error ? error.message : String(error),
                authInfo: {
                    userId: auth.currentUser?.uid,
                    email: auth.currentUser?.email,
                    emailVerified: auth.currentUser?.emailVerified,
                },
                operationType,
                path
            };
            console.error('Firestore Error: ', JSON.stringify(errInfo));
            throw new Error(JSON.stringify(errInfo));
        }
    };

    // --- HEADER MENU LOGIC ---
    const initHeaderMenus = () => {
        const menuSpell = document.getElementById('menu-spellcheck');
        if (menuSpell) menuSpell.onclick = () => {
            SuggestionsEngine.check();
            showToast('Writing analysis complete', 'info');
        };
    };

    // --- INITIALIZE ALL ---
    AuthEngine.init();
    initHeaderMenus();
    EditorCore.init();
    FileOperations.init();
    SearchEngine.init();
    AutosaveEngine.init();
    UIHelpers.init();
    SuggestionsEngine.check();

});
