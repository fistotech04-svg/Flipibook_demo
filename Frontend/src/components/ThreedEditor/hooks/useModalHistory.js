import { useState, useCallback, useRef } from 'react';

function toComparableArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return [...val].sort();
    if (val instanceof Set) return Array.from(val).sort();
    try {
        return Array.from(val).sort();
    } catch (_) {
        return [];
    }
}

/**
 * Fast deep equality comparison for 3D editor snapshots to prevent duplicate history states
 */
function areStatesEqual(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    try {
        if (a.modelName !== b.modelName) return false;
        if ((a.selectedTextureId || null) !== (b.selectedTextureId || null)) return false;
        if ((a.models?.length || 0) !== (b.models?.length || 0)) return false;
        
        // Compare selectedMaterial
        const aMat = a.selectedMaterial?.name || null;
        const bMat = b.selectedMaterial?.name || null;
        if (aMat !== bMat) return false;

        // Compare hidden and deleted materials (handling Set / Array safely)
        if (JSON.stringify(toComparableArray(a.hiddenMaterials)) !== JSON.stringify(toComparableArray(b.hiddenMaterials))) return false;
        if (JSON.stringify(toComparableArray(a.deletedMaterials)) !== JSON.stringify(toComparableArray(b.deletedMaterials))) return false;

        // Compare transformValues
        if (JSON.stringify(a.transformValues) !== JSON.stringify(b.transformValues)) return false;

        // Compare meshTransforms (individual child mesh transforms)
        if (JSON.stringify(a.meshTransforms || {}) !== JSON.stringify(b.meshTransforms || {})) return false;

        // Compare materialSettings
        if (JSON.stringify(a.materialSettings) !== JSON.stringify(b.materialSettings)) return false;

        return true;
    } catch (_) {
        return false;
    }
}

export default function useModalHistory(initialState) {
    const [index, setIndex] = useState(0);
    const [history, setHistory] = useState([initialState]);
    
    const historyRef = useRef([initialState]);
    const indexRef = useRef(0);

    const setState = useCallback((newState) => {
        const curIndex = indexRef.current;
        const curHistory = historyRef.current;
        
        // Prevent pushing duplicate identical states
        if (curHistory[curIndex] && areStatesEqual(curHistory[curIndex], newState)) {
            return;
        }

        const sliced = curHistory.slice(0, curIndex + 1);
        // Keep up to 60 history steps
        const nextHistory = sliced.length >= 60 ? [...sliced.slice(sliced.length - 59), newState] : [...sliced, newState];
        const nextIndex = nextHistory.length - 1;

        historyRef.current = nextHistory;
        indexRef.current = nextIndex;

        setHistory(nextHistory);
        setIndex(nextIndex);
    }, []);

    const undo = useCallback(() => {
        const curIndex = indexRef.current;
        const curHistory = historyRef.current;
        if (curIndex > 0) {
            const prevIndex = curIndex - 1;
            indexRef.current = prevIndex;
            setIndex(prevIndex);
            return curHistory[prevIndex];
        }
        return null;
    }, []);

    const redo = useCallback(() => {
        const curIndex = indexRef.current;
        const curHistory = historyRef.current;
        if (curIndex < curHistory.length - 1) {
            const nextIndex = curIndex + 1;
            indexRef.current = nextIndex;
            setIndex(nextIndex);
            return curHistory[nextIndex];
        }
        return null;
    }, []);

    const resetHistory = useCallback((newState) => {
        historyRef.current = [newState];
        indexRef.current = 0;
        setHistory([newState]);
        setIndex(0);
    }, []);

    const update = useCallback((newState) => {
        const curIndex = indexRef.current;
        const curHistory = [...historyRef.current];
        curHistory[curIndex] = newState;
        historyRef.current = curHistory;
        setHistory(curHistory);
    }, []);

    const currentState = history[index] || historyRef.current[indexRef.current];

    return {
        state: currentState,
        past: history.slice(0, index),
        future: history.slice(index + 1),
        set: setState,
        update,
        undo,
        redo,
        canUndo: index > 0,
        canRedo: index < history.length - 1,
        resetHistory,
        historyRef,
        indexRef
    };
}
