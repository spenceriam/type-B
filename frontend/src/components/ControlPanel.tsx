import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Upload, Download, Sun, Moon, Type, Hash, Eye, EyeOff, AlignLeft, AlignRight } from 'lucide-react';

interface ControlPanelProps {
  isVisible: boolean;
  onClose: () => void;
  gearButtonRef: React.RefObject<HTMLButtonElement>;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  showWordCount: boolean;
  onWordCountToggle: () => void;
  showCountDisplay: boolean;
  onCountDisplayToggle: () => void;
  leftMargin: number;
  rightMargin: number;
  onLeftMarginChange: (margin: number) => void;
  onRightMarginChange: (margin: number) => void;
  onNew: () => void;
  onOpen: () => void;
  onSaveAs: () => void;
}

const PANEL_POSITION_KEY = 'type-b-panel-position';

export default function ControlPanel({
  isVisible,
  onClose,
  gearButtonRef,
  fontSize,
  onFontSizeChange,
  isDarkMode,
  onThemeToggle,
  showWordCount,
  onWordCountToggle,
  showCountDisplay,
  onCountDisplayToggle,
  leftMargin,
  rightMargin,
  onLeftMarginChange,
  onRightMarginChange,
  onNew,
  onOpen,
  onSaveAs
}: ControlPanelProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const currentPositionRef = useRef({ x: 100, y: 100 });

  // Load saved position
  useEffect(() => {
    const savedPosition = sessionStorage.getItem(PANEL_POSITION_KEY);
    if (savedPosition) {
      const pos = JSON.parse(savedPosition);
      setPosition(pos);
      currentPositionRef.current = pos;
    }
  }, []);

  // Save position to sessionStorage (only when dragging ends)
  const savePosition = useCallback((pos: { x: number; y: number }) => {
    sessionStorage.setItem(PANEL_POSITION_KEY, JSON.stringify(pos));
  }, []);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      dragOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      setIsDragging(true);
      e.preventDefault();
    }
  }, []);

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && panelRef.current) {
        const newPosition = {
          x: e.clientX - dragOffsetRef.current.x,
          y: e.clientY - dragOffsetRef.current.y
        };
        
        // Update DOM directly for smooth movement
        panelRef.current.style.left = `${newPosition.x}px`;
        panelRef.current.style.top = `${newPosition.y}px`;
        
        // Store current position in ref
        currentPositionRef.current = newPosition;
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        // Commit final position to state and save to storage
        const finalPosition = currentPositionRef.current;
        setPosition(finalPosition);
        savePosition(finalPosition);
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, savePosition]);

  // Handle click outside to close (excluding gear button)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      
      // Don't close if clicking on the panel itself
      if (panelRef.current && panelRef.current.contains(target)) {
        return;
      }
      
      // Don't close if clicking on the gear button
      if (gearButtonRef.current && gearButtonRef.current.contains(target)) {
        return;
      }
      
      // Close the panel for any other click
      onClose();
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose, gearButtonRef]);

  if (!isVisible) return null;

  return (
    <div
      ref={panelRef}
      className={`fixed z-50 border rounded-lg shadow-lg p-4 w-72 transition-all duration-200 ${
        isDarkMode 
          ? 'bg-editor-bg border-editor-text/20 text-editor-text' 
          : 'bg-editor-bg-light border-editor-text-light/20 text-editor-text-light'
      } ${isDragging ? 'transition-none' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-medium ${
          isDarkMode ? 'text-editor-text' : 'text-editor-text-light'
        }`}>Settings</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className={`h-6 w-6 p-0 transition-colors duration-200 ${
            isDarkMode 
              ? 'text-editor-text/60 hover:text-editor-text hover:bg-editor-text/10' 
              : 'text-editor-text-light/60 hover:text-editor-text-light hover:bg-editor-text-light/10'
          }`}
        >
          ×
        </Button>
      </div>

      {/* Font Size */}
      <div className="space-y-3 mb-4">
        <Label className={`text-sm ${
          isDarkMode ? 'text-editor-text/80' : 'text-editor-text-light/80'
        }`}>Font Size: {fontSize}px</Label>
        <Slider
          value={[fontSize]}
          onValueChange={(value) => onFontSizeChange(value[0])}
          min={12}
          max={24}
          step={1}
          className="w-full"
        />
      </div>

      <Separator className={isDarkMode ? 'bg-editor-text/20' : 'bg-editor-text-light/20'} />

      {/* Margins */}
      <div className="space-y-4 my-4">
        <Label className={`text-sm ${
          isDarkMode ? 'text-editor-text/80' : 'text-editor-text-light/80'
        }`}>Margins</Label>
        
        {/* Left Margin */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlignLeft className="w-3 h-3" />
            <Label className={`text-xs ${
              isDarkMode ? 'text-editor-text/70' : 'text-editor-text-light/70'
            }`}>Left: {leftMargin}px</Label>
          </div>
          <Slider
            value={[leftMargin]}
            onValueChange={(value) => onLeftMarginChange(value[0])}
            min={0}
            max={200}
            step={4}
            className="w-full"
          />
        </div>

        {/* Right Margin */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlignRight className="w-3 h-3" />
            <Label className={`text-xs ${
              isDarkMode ? 'text-editor-text/70' : 'text-editor-text-light/70'
            }`}>Right: {rightMargin}px</Label>
          </div>
          <Slider
            value={[rightMargin]}
            onValueChange={(value) => onRightMarginChange(value[0])}
            min={0}
            max={200}
            step={4}
            className="w-full"
          />
        </div>
      </div>

      <Separator className={isDarkMode ? 'bg-editor-text/20' : 'bg-editor-text-light/20'} />

      {/* Theme Toggle */}
      <div className="flex items-center justify-between my-4">
        <div className="flex items-center gap-2">
          {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          <Label className={`text-sm ${
            isDarkMode ? 'text-editor-text/80' : 'text-editor-text-light/80'
          }`}>
            {isDarkMode ? 'Dark' : 'Light'} Mode
          </Label>
        </div>
        <Switch checked={isDarkMode} onCheckedChange={onThemeToggle} />
      </div>

      {/* Count Display Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {showCountDisplay ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <Label className={`text-sm ${
            isDarkMode ? 'text-editor-text/80' : 'text-editor-text-light/80'
          }`}>
            Show Count
          </Label>
        </div>
        <Switch checked={showCountDisplay} onCheckedChange={onCountDisplayToggle} />
      </div>

      {/* Word/Character Count Toggle */}
      {showCountDisplay && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {showWordCount ? <Type className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
            <Label className={`text-sm ${
              isDarkMode ? 'text-editor-text/80' : 'text-editor-text-light/80'
            }`}>
              {showWordCount ? 'Word' : 'Character'} Count
            </Label>
          </div>
          <Switch checked={showWordCount} onCheckedChange={onWordCountToggle} />
        </div>
      )}

      <Separator className={isDarkMode ? 'bg-editor-text/20' : 'bg-editor-text-light/20'} />

      {/* File Operations */}
      <div className="space-y-2 mt-4">
        <Label className={`text-sm ${
          isDarkMode ? 'text-editor-text/80' : 'text-editor-text-light/80'
        }`}>File Operations</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onNew}
            className={`flex items-center gap-1 text-xs transition-colors duration-200 ${
              isDarkMode 
                ? 'border-editor-text/20 text-editor-text hover:bg-editor-text/10 hover:border-editor-text/40' 
                : 'border-editor-text-light/20 text-editor-text-light hover:bg-editor-text-light/10 hover:border-editor-text-light/40'
            }`}
          >
            <Plus className="w-3 h-3" />
            New
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpen}
            className={`flex items-center gap-1 text-xs transition-colors duration-200 ${
              isDarkMode 
                ? 'border-editor-text/20 text-editor-text hover:bg-editor-text/10 hover:border-editor-text/40' 
                : 'border-editor-text-light/20 text-editor-text-light hover:bg-editor-text-light/10 hover:border-editor-text-light/40'
            }`}
          >
            <Upload className="w-3 h-3" />
            Open
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSaveAs}
            className={`flex items-center gap-1 text-xs transition-colors duration-200 ${
              isDarkMode 
                ? 'border-editor-text/20 text-editor-text hover:bg-editor-text/10 hover:border-editor-text/40' 
                : 'border-editor-text-light/20 text-editor-text-light hover:bg-editor-text-light/10 hover:border-editor-text-light/40'
            }`}
          >
            <Download className="w-3 h-3" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}