import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FileText, AlertTriangle, Settings, Lock } from 'lucide-react';
import ControlPanel from '@/components/ControlPanel';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const STORAGE_KEY = 'type-b-editor-content';
const SETTINGS_KEY = 'type-b-editor-settings';
const AUTO_SAVE_DELAY = 3000; // 3 seconds

interface EditorSettings {
  fontSize: number;
  isDarkMode: boolean;
  showWordCount: boolean;
  showCountDisplay: boolean;
  currentFilename: string;
  leftMargin: number;
  rightMargin: number;
}

export default function Index() {
  const [content, setContent] = useState('');
  const [welcomeText, setWelcomeText] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isSaved, setIsSaved] = useState(true);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [saveFilename, setSaveFilename] = useState('document.txt');
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [showGearPulse, setShowGearPulse] = useState(true);
  const [cursorCoords, setCursorCoords] = useState({ x: 0, y: 0 });
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [settings, setSettings] = useState<EditorSettings>({
    fontSize: 16,
    isDarkMode: true,
    showWordCount: true,
    showCountDisplay: false, // Changed to false by default
    currentFilename: 'document.txt',
    leftMargin: 72,
    rightMargin: 72
  });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gearButtonRef = useRef<HTMLButtonElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const welcomeMessage = "Welcome to type-B... to start just type anything";

  // Load settings and content from sessionStorage on mount
  useEffect(() => {
    const savedContent = sessionStorage.getItem(STORAGE_KEY);
    const savedSettings = sessionStorage.getItem(SETTINGS_KEY);
    
    if (savedContent) {
      setContent(savedContent);
      setShowWelcome(false);
      setIsSaved(true);
    }
    
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings({
        fontSize: 16,
        isDarkMode: true,
        showWordCount: true,
        showCountDisplay: false, // Changed to false by default
        currentFilename: 'document.txt',
        leftMargin: 72,
        rightMargin: 72,
        ...parsed
      });
    }

    const timer = setTimeout(() => setShowGearPulse(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Focus textarea immediately on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Save settings when they change
  useEffect(() => {
    sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Auto-save functionality
  const autoSave = useCallback(() => {
    if (!autoSaveEnabled || content.length === 0) return;
    
    const contentSize = new Blob([content]).size;
    if (contentSize > MAX_FILE_SIZE) {
      setAutoSaveEnabled(false);
      console.warn('File size exceeds 5MB limit. Auto-save disabled.');
      return;
    }

    setIsAutoSaving(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, content);
      setIsSaved(true);
      setTimeout(() => setIsAutoSaving(false), 500);
    } catch (error) {
      console.error('Failed to auto-save:', error);
      setIsAutoSaving(false);
    }
  }, [content, autoSaveEnabled]);

  // Auto-save timer effect
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (!isSaved && content.length > 0) {
      autoSaveTimerRef.current = setTimeout(autoSave, AUTO_SAVE_DELAY);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, isSaved, autoSave]);

  // Clear storage on window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem(STORAGE_KEY);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Welcome animation effect
  useEffect(() => {
    if (!showWelcome) return;
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < welcomeMessage.length) {
        setWelcomeText(welcomeMessage.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 80);

    return () => clearInterval(timer);
  }, [showWelcome]);

  // Enhanced cursor positioning that handles state synchronization issues
  const updateCursorPosition = useCallback((forceUseTextarea = false) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    
    // Use textarea's actual values if forced or if there's a mismatch
    const shouldUseTextarea = forceUseTextarea || 
      (textarea.value.length !== content.length) || 
      (textarea.selectionStart !== cursorPosition);
    
    const actualContent = shouldUseTextarea ? textarea.value : content;
    const actualCursorPosition = shouldUseTextarea ? textarea.selectionStart : cursorPosition;
    
    try {
      // Get text before cursor using actual values
      const textBeforeCursor = actualContent.substring(0, actualCursorPosition);
      
      // Create a temporary div that matches the textarea exactly
      const measureDiv = document.createElement('div');
      const textareaStyles = window.getComputedStyle(textarea);
      
      // Copy all relevant styles
      measureDiv.style.position = 'absolute';
      measureDiv.style.visibility = 'hidden';
      measureDiv.style.whiteSpace = 'pre-wrap';
      measureDiv.style.wordWrap = 'break-word';
      measureDiv.style.fontSize = textareaStyles.fontSize;
      measureDiv.style.fontFamily = textareaStyles.fontFamily;
      measureDiv.style.lineHeight = textareaStyles.lineHeight;
      measureDiv.style.width = textareaStyles.width;
      measureDiv.style.padding = textareaStyles.padding;
      measureDiv.style.border = textareaStyles.border;
      measureDiv.style.boxSizing = textareaStyles.boxSizing;
      measureDiv.style.overflow = 'hidden';
      
      document.body.appendChild(measureDiv);
      
      // Set the content up to cursor position
      measureDiv.textContent = textBeforeCursor;
      
      // Add a marker span at the cursor position
      const cursorMarker = document.createElement('span');
      cursorMarker.textContent = '|';
      cursorMarker.style.position = 'relative';
      measureDiv.appendChild(cursorMarker);
      
      // Get the position of the cursor marker
      const markerRect = cursorMarker.getBoundingClientRect();
      const divRect = measureDiv.getBoundingClientRect();
      
      // Calculate relative position
      const x = markerRect.left - divRect.left;
      const y = markerRect.top - divRect.top - textarea.scrollTop;
      
      // Clean up
      document.body.removeChild(measureDiv);
      
      setCursorCoords({ x, y });
      
    } catch (error) {
      console.error('Error updating cursor position:', error);
      // Fallback to simple calculation using actual values
      const lines = actualContent.substring(0, actualCursorPosition).split('\n');
      const currentLine = lines[lines.length - 1];
      const x = currentLine.length * (settings.fontSize * 0.6);
      const y = (lines.length - 1) * (settings.fontSize * 1.5) - textarea.scrollTop;
      setCursorCoords({ x, y });
    }
  }, [content, cursorPosition, settings.fontSize]);

  // Update cursor position when content or position changes
  useEffect(() => {
    updateCursorPosition();
  }, [updateCursorPosition]);

  // Handle user input
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (showWelcome) {
      setShowWelcome(false);
      setWelcomeText('');
    }
    setContent(e.target.value);
    setCursorPosition(e.target.selectionStart);
    setIsSaved(false);
  };

  // Handle cursor position changes
  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  // Fixed paste handler that forces textarea values
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Use requestAnimationFrame to ensure the paste operation is complete
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const newContent = textareaRef.current.value;
        const newCursorPos = textareaRef.current.selectionStart;
        
        // Update React state to match textarea
        setContent(newContent);
        setCursorPosition(newCursorPos);
        
        // Force cursor position update using textarea values immediately
        updateCursorPosition(true); // Force use of textarea values
      }
    });
  };

  // Enhanced keyboard handling with hotkeys and Caps Lock detection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Update Caps Lock state
    setIsCapsLockOn(e.getModifierState('CapsLock'));
    
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
    
    // Handle Tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        setCursorPosition(start + 2);
      }, 0);
      return;
    }
    
    // Handle hotkeys
    if (cmdOrCtrl) {
      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          handleNew();
          break;
        case 'o':
          e.preventDefault();
          handleOpen();
          break;
        case 's':
          e.preventDefault();
          if (e.shiftKey) {
            handleSaveAs();
          } else {
            autoSave();
          }
          break;
        case 'a':
          // Allow default select all behavior
          break;
        case 'z':
          // Allow default undo behavior
          break;
        case 'y':
          // Allow default redo behavior (Windows)
          break;
        case 'c':
          // Allow default copy behavior
          break;
        case 'v':
          // Allow default paste behavior
          break;
        case 'x':
          // Allow default cut behavior
          break;
        case 'f':
          // Allow default find behavior
          break;
        default:
          break;
      }
    }
  };

  // Handle key up to update Caps Lock state
  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setIsCapsLockOn(e.getModifierState('CapsLock'));
  };

  // ... existing file operation functions remain the same ...
  const handleNew = () => {
    if (!isSaved && content.length > 0) {
      setPendingAction(() => () => {
        setContent('');
        setShowWelcome(true);
        setWelcomeText('');
        setIsSaved(true);
        setSettings(prev => ({ ...prev, currentFilename: 'document.txt' }));
        sessionStorage.removeItem(STORAGE_KEY);
      });
      setShowUnsavedDialog(true);
    } else {
      setContent('');
      setShowWelcome(true);
      setWelcomeText('');
      setIsSaved(true);
      setSettings(prev => ({ ...prev, currentFilename: 'document.txt' }));
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleOpen = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
      setShowWelcome(false);
      setIsSaved(true);
      setSettings(prev => ({ ...prev, currentFilename: file.name }));
      sessionStorage.setItem(STORAGE_KEY, text);
    };
    reader.onerror = () => {
      console.error('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleSaveAs = () => {
    setSaveFilename(settings.currentFilename);
    setShowSaveDialog(true);
  };

  const downloadFile = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = saveFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowSaveDialog(false);
    setIsSaved(true);
    setSettings(prev => ({ ...prev, currentFilename: saveFilename }));
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const textFile = files.find(file => 
      file.type === 'text/plain' || 
      file.name.endsWith('.txt') || 
      file.name.endsWith('.md')
    );
    
    if (textFile) {
      readFile(textFile);
    }
  };

  // Calculate word/character count
  const getCount = () => {
    if (settings.showWordCount) {
      return content.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    return content.length;
  };

  // Get cursor position for inline count display
  const getCursorLinePosition = () => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length - 1;
    const column = lines[lines.length - 1].length;
    return { line, column };
  };

  const { line, column } = getCursorLinePosition();
  const gearIconColor = settings.isDarkMode ? '#2d3748' : '#cbd5e1';
  const gearIconHoverColor = settings.isDarkMode ? '#4a5568' : '#94a3b8';

  return (
    <div className={`h-screen overflow-hidden relative ${
      settings.isDarkMode 
        ? 'bg-editor-bg text-editor-text' 
        : 'bg-editor-bg-light text-editor-text-light light-mode'
    }`}>
      {/* Gear icon for control panel */}
      <Button
        ref={gearButtonRef}
        variant="ghost"
        size="sm"
        onClick={() => {
          setShowControlPanel(!showControlPanel);
          setShowGearPulse(false);
        }}
        className={`absolute top-4 right-4 z-40 w-8 h-8 p-0 transition-all duration-200 ${
          showGearPulse ? 'gear-pulse' : ''
        }`}
        style={{
          backgroundColor: gearIconColor,
          color: 'white'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = gearIconHoverColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = gearIconColor;
        }}
      >
        <Settings className="w-4 h-4" />
      </Button>

      {/* Caps Lock indicator */}
      {isCapsLockOn && (
        <div className={`absolute top-4 right-16 z-30 flex items-center gap-2 px-2 py-1 rounded text-xs ${
          settings.isDarkMode 
            ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-400/20' 
            : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
        }`}>
          <Lock className="w-3 h-3" />
          CAPS
        </div>
      )}

      <ControlPanel
        isVisible={showControlPanel}
        onClose={() => setShowControlPanel(false)}
        gearButtonRef={gearButtonRef}
        fontSize={settings.fontSize}
        onFontSizeChange={(size) => setSettings(prev => ({ ...prev, fontSize: size }))}
        isDarkMode={settings.isDarkMode}
        onThemeToggle={() => setSettings(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }))}
        showWordCount={settings.showWordCount}
        onWordCountToggle={() => setSettings(prev => ({ ...prev, showWordCount: !prev.showWordCount }))}
        showCountDisplay={settings.showCountDisplay}
        onCountDisplayToggle={() => setSettings(prev => ({ ...prev, showCountDisplay: !prev.showCountDisplay }))}
        leftMargin={settings.leftMargin}
        rightMargin={settings.rightMargin}
        onLeftMarginChange={(margin) => setSettings(prev => ({ ...prev, leftMargin: margin }))}
        onRightMarginChange={(margin) => setSettings(prev => ({ ...prev, rightMargin: margin }))}
        onNew={handleNew}
        onOpen={handleOpen}
        onSaveAs={handleSaveAs}
      />

      {/* Save indicator */}
      {isAutoSaving && (
        <div className={`absolute top-4 left-4 text-sm flex items-center gap-2 z-30 ${
          settings.isDarkMode ? 'text-editor-text/60' : 'text-editor-text-light/60'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            settings.isDarkMode ? 'bg-editor-text/60' : 'bg-editor-text-light/60'
          }`}></div>
          Saving...
        </div>
      )}

      {/* File size warning */}
      {!autoSaveEnabled && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-yellow-400 text-sm flex items-center gap-2 bg-yellow-400/10 px-3 py-1 rounded z-30">
          <AlertTriangle className="w-4 h-4" />
          File too large - auto-save disabled
        </div>
      )}

      {/* Support Link - Bottom Left */}
      <div className="fixed bottom-4 left-4 z-30 text-left text-xs font-mono transition-all duration-200 ease-in-out opacity-30 hover:opacity-80 pointer-events-auto select-none">
        <div className="text-[#4a5568] hover:text-[#64748b] transition-colors duration-200">
          <div className="whitespace-nowrap">
            Support me on{' '}
            <a 
              href="https://ko-fi.com/spenceriam" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              https://ko-fi.com/spenceriam
            </a>
          </div>
        </div>
      </div>

      {/* Branding Footer - Bottom Right */}
      <div className="fixed bottom-4 right-4 z-30 text-right text-xs font-mono transition-all duration-200 ease-in-out opacity-30 hover:opacity-80 pointer-events-auto select-none">
        <div className="text-[#4a5568] hover:text-[#64748b] transition-colors duration-200">
          <div className="whitespace-nowrap">type-B v1.0</div>
          <div className="whitespace-nowrap">
            by Spencer Francisco ×{' '}
            <a 
              href="https://von.dev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              Von.dev
            </a>
          </div>
          <div className="whitespace-nowrap">Forged in dark mode 🌌 // 5.27.2025</div>
        </div>
      </div>

      {/* Main scrollable container - Centered with symmetric margins */}
      <div 
        className={`h-full overflow-y-auto custom-scrollbar transition-all duration-200 flex justify-center ${
          isDragOver ? (settings.isDarkMode ? 'bg-editor-text/5 border-2 border-dashed border-editor-text/30' : 'bg-editor-text-light/5 border-2 border-dashed border-editor-text-light/30') : ''
        }`}
        style={{
          paddingTop: '32px',
          paddingBottom: '120px'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Centered content wrapper */}
        <div 
          className="w-full max-w-none relative min-h-full"
          style={{
            marginLeft: `${Math.max(32, settings.leftMargin)}px`,
            marginRight: `${Math.max(32, settings.rightMargin)}px`,
          }}
        >
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onSelect={handleSelectionChange}
            onKeyUp={handleKeyUp}
            onKeyDown={handleKeyDown}
            onClick={handleSelectionChange}
            onPaste={handlePaste}
            onScroll={updateCursorPosition}
            className="w-full bg-transparent resize-none border-none outline-none editor-textarea leading-relaxed"
            style={{ 
              fontSize: `${settings.fontSize}px`,
              minHeight: 'calc(100vh - 152px)',
              height: 'auto',
              caretColor: 'transparent'
            }}
            placeholder=""
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
          
          {/* Welcome message overlay */}
          {showWelcome && content.length === 0 && (
            <div className="absolute top-0 left-0 flex items-center pointer-events-none">
              <span className="text-base">{welcomeText}</span>
              <div className={`w-2 h-6 ml-0.5 terminal-blink ${
                settings.isDarkMode ? 'bg-editor-text' : 'bg-editor-text-light'
              }`}></div>
            </div>
          )}

          {/* Custom vintage terminal cursor */}
          {!showWelcome && (
            <div 
              className="absolute pointer-events-none z-10"
              style={{
                left: `${Math.max(0, cursorCoords.x)}px`,
                top: `${Math.max(0, cursorCoords.y)}px`,
                transform: 'translateY(2px)'
              }}
            >
              <div className={`w-2 terminal-blink ${
                settings.isDarkMode ? 'bg-editor-text' : 'bg-editor-text-light'
              }`} 
              style={{ 
                height: `${settings.fontSize * 1.2}px` 
              }}></div>
            </div>
          )}
          
          {/* Inline word/character count */}
          {settings.showCountDisplay && content.length > 0 && !showWelcome && (
            <div 
              className="absolute ghost-count pointer-events-none z-10"
              style={{
                left: `${Math.max(0, cursorCoords.x + 12)}px`,
                top: `${Math.max(0, cursorCoords.y)}px`,
                fontSize: `${Math.max(12, settings.fontSize - 2)}px`,
              }}
            >
              {getCount()} {settings.showWordCount ? 'words' : 'chars'}
            </div>
          )}

          {/* Drag overlay */}
          {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className={`text-xl flex items-center gap-3 ${
                settings.isDarkMode ? 'text-editor-text/60' : 'text-editor-text-light/60'
              }`}>
                <FileText className="w-8 h-8" />
                Drop your file here
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className={settings.isDarkMode ? 'bg-editor-bg border-editor-text/20' : 'bg-white border-gray-200'}>
          <DialogHeader>
            <DialogTitle className={settings.isDarkMode ? 'text-editor-text' : 'text-gray-900'}>Save As</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filename" className={settings.isDarkMode ? 'text-editor-text' : 'text-gray-700'}>Filename</Label>
              <Input
                id="filename"
                value={saveFilename}
                onChange={(e) => setSaveFilename(e.target.value)}
                className={settings.isDarkMode ? 'bg-editor-bg border-editor-text/20 text-editor-text' : 'bg-white border-gray-200 text-gray-900'}
                placeholder="document.txt"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowSaveDialog(false)}
                className={settings.isDarkMode ? 'text-editor-text hover:bg-editor-text/10' : 'text-gray-700 hover:bg-gray-100'}
              >
                Cancel
              </Button>
              <Button
                onClick={downloadFile}
                className={settings.isDarkMode ? 'bg-editor-text text-editor-bg hover:bg-editor-text/90' : 'bg-gray-900 text-white hover:bg-gray-800'}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent className={settings.isDarkMode ? 'bg-editor-bg border-editor-text/20' : 'bg-white border-gray-200'}>
          <AlertDialogHeader>
            <AlertDialogTitle className={settings.isDarkMode ? 'text-editor-text' : 'text-gray-900'}>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription className={settings.isDarkMode ? 'text-editor-text/70' : 'text-gray-600'}>
              You have unsaved changes. Do you want to save before continuing?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className={settings.isDarkMode ? 'text-editor-text hover:bg-editor-text/10' : 'text-gray-700 hover:bg-gray-100'}
              onClick={() => {
                if (pendingAction) {
                  pendingAction();
                  setPendingAction(null);
                }
              }}
            >
              Don't Save
            </AlertDialogCancel>
            <AlertDialogAction
              className={settings.isDarkMode ? 'bg-editor-text text-editor-bg hover:bg-editor-text/90' : 'bg-gray-900 text-white hover:bg-gray-800'}
              onClick={() => {
                autoSave();
                if (pendingAction) {
                  setTimeout(() => {
                    pendingAction();
                    setPendingAction(null);
                  }, 100);
                }
              }}
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}