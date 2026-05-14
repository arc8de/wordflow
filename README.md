# WordFlow — Smart Word Processor & Writing Assistant

WordFlow is a production-quality, responsive web application designed for writers, students, and professionals. It combines a rich text editor with real-time analytics and a smart writing assistant.

## 🚀 Features

### 1. Rich Text Word Processor
- **Google Docs Experience**: A centered "Paper-on-Gray" layout for a professional feel.
- **Formatting Tools**: Bold, Italic, Underline, Font family, Font size, Colors, and Highlights.
- **Advanced Editing**: Undo/Redo, List management, Alignment controls, and "Clear Formatting".
- **Dynamic Toolbar**: Real-time button highighting based on current cursor selection.

### 2. Live Analytics Panel
- **Real-time Stats**: Word count, characters, sentences, and paragraphs.
- **Time Estimates**: Calculates Reading Time and Speaking Time based on industry averages.
- **Typing Speed (WPM)**: Live Words-Per-Minute tracker that resets after 5 seconds of inactivity.

### 3. Smart Writing Assistant
- **Automated Checks**: Detects double spaces, repeated words, and very long sentences.
- **One-Click Fixes**: Dismiss or automatically fix issues directly from the suggestions panel.
- **Debounced Analysis**: Runs efficiently in the background without slowing down your typing.

### 4. Search & Replace System
- **Collapsible Panel**: Modern search interface (Ctrl+F).
- **Functionality**: Find Next/Prev, Replace, and Replace All.
- **Match Counter**: Real-time counter for search results.

### 5. File Operations & Autosave
- **Autosave**: Automatically saves a draft to LocalStorage every 30 seconds.
- **Draft Recovery**: Detects previous sessions on reload and offers to restore unsaved work.
- **Export Options**: Save as pure Text (.txt) or Rich HTML (.html).
- **Print Mode**: Optimizes the document for printing (hides UI elements, centered text).

### 6. Personalization
- **Dark Mode**: High-contrast theme for low-light environments.
- **Fullscreen**: F11 or button-triggered distraction-free mode.
- **Word Frequency**: Visual bar chart showing your top used keywords (excluding common stopwords).

## 🛠️ Technologies Used
- **HTML5**: Semantic tags and `contenteditable` for the rich editor.
- **CSS3**: Custom properties (CSS variables), Grid/Flexbox, and @media print rules.
- **Bootstrap 5**: Responsive layout and utility components.
- **Vanilla JavaScript**: Pure ES6 logic without framework dependencies.
- **Web APIs**: LocalStorage, FileReader, Blob, and `document.execCommand`.

## 📦 Project Structure
```text
/
├── index.html   # Main Application UI
├── style.css    # Design Tokens & Layout Styles
├── script.js     # Modular Application Logic
└── README.md    # Documentation
```

## 🖥️ Getting Started
1. Open `index.html` in any modern web browser.
2. Start typing in the white paper area.
3. Use the toolbar or keyboard shortcuts to format your text.
4. Export your work via the "Save" dropdown.

## ⌨️ Keyboard Shortcuts
- **Ctrl + B**: Bold
- **Ctrl + I**: Italic
- **Ctrl + U**: Underline
- **Ctrl + S**: Manual Save
- **Ctrl + F**: Open Search
- **Ctrl + Shift + Z**: Redo
- **F11**: Fullscreen Mode

## 📄 License
This project is open-source and created for educational purposes.
