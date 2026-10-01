// useHistory.js
import { useState, useRef, useCallback } from 'react';

const useHistory = () => {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyRef = useRef({ 
    undoStack: [], 
    redoStack: [], 
    isPerforming: false 
  });

  const saveTimerRef = useRef(null);
  const pendingStateRef = useRef(null);

  const commitHistory = useCallback(() => {
    if (historyRef.current.isPerforming || !pendingStateRef.current) return;
    
    let jsonString;
    try {
      jsonString = JSON.stringify(pendingStateRef.current);
    } catch (e) {
      console.warn("Failed to serialize history state:", e);
      pendingStateRef.current = null;
      return;
    }
    
    const lastState = undoStack[undoStack.length - 1];
    if (lastState !== jsonString) {
      undoStack.push(jsonString);
      historyRef.current.redoStack = [];
      
      if (undoStack.length > 50) {
        undoStack.shift();
      }
      
      setCanUndo(undoStack.length > 1);
      setCanRedo(false);
    }
    
    pendingStateRef.current = null;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const saveToHistory = useCallback((state) => {
    if (historyRef.current.isPerforming) return;

    // Update pending state
    pendingStateRef.current = state;
    
    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // If it's the first state ever, commit it immediately
    if (historyRef.current.undoStack.length === 0) {
      try {
        historyRef.current.undoStack.push(JSON.stringify(state));
      } catch (e) {
        console.warn("Failed to serialize history initial state:", e);
      }
      setCanUndo(false);
      return;
    }

    // Otherwise, debounce the save (800ms)
    saveTimerRef.current = setTimeout(() => {
      commitHistory();
    }, 800);
  }, [commitHistory]);

  const undo = useCallback(() => {
    // Force commit any pending changes before undoing
    if (pendingStateRef.current) {
       // We don't commit here because we want to undo THE state before this pending one
       // But if we just started typing, the "current" state on stack is BEFORE typing.
       // So we just clear pending.
       pendingStateRef.current = null;
    }
    if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
    }

    const { undoStack, redoStack } = historyRef.current;
    
    if (undoStack.length <= 1) return;

    historyRef.current.isPerforming = true;

    const currentState = undoStack.pop();
    redoStack.push(currentState);

    const previousState = undoStack[undoStack.length - 1];
    
    historyRef.current.isPerforming = false;
    setCanUndo(undoStack.length > 1);
    setCanRedo(true);

    return JSON.parse(previousState);
  }, []);

  const redo = useCallback(() => {
    const { undoStack, redoStack } = historyRef.current;
    
    if (redoStack.length === 0) return;

    historyRef.current.isPerforming = true;

    const nextState = redoStack.pop();
    undoStack.push(nextState);
    
    historyRef.current.isPerforming = false;
    setCanUndo(true);
    setCanRedo(redoStack.length > 0);

    return JSON.parse(nextState);
  }, []);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    saveToHistory,
    commitHistory
  };
};

export default useHistory;