/**
 * penToolEngine.js
 * Centralized Pen Tool and Node Edit Mode Engine for MainEditor.
 * Encapsulates Pen overlay rendering, node edit mode lifecycle helpers,
 * vector path action processor, and Vectra session drawing utilities to prevent code confusion in MainEditor.jsx.
 */

import {
  drawNodeEditOverlay as drawNodeEditOverlayExt,
  clearPenToolNodes as clearPenToolNodesExt,
  drawPenToolNodes as drawPenToolNodesExt,
  drawBendingNodes as drawBendingNodesExt,
  renderVectraOverlay as renderVectraOverlayExt,
  clearVectraOverlay as clearVectraOverlayExt,
  generatePathData
} from './penOverlayEngine';

import {
  VectraPenSession,
  pathToD,
  pathToDCombo,
  makeNode,
  makePath
} from './vectraPenEngine';

import {
  getPaperSegments,
  getPaperCurves,
  cleanPaperPathData,
  mergeMeetingNodes,
  applyHandleDrag,
  executeVectorPathAction,
  deleteSelectedNodeOrHandle,
  bakeTransformIntoPaperPath,
  processVectorPathAction
} from './vectorNodeEngine';

export {
  drawNodeEditOverlayExt,
  clearPenToolNodesExt,
  drawPenToolNodesExt,
  drawBendingNodesExt,
  renderVectraOverlayExt,
  clearVectraOverlayExt,
  generatePathData,
  VectraPenSession,
  pathToD,
  pathToDCombo,
  makeNode,
  makePath,
  getPaperSegments,
  getPaperCurves,
  cleanPaperPathData,
  mergeMeetingNodes,
  applyHandleDrag,
  executeVectorPathAction,
  deleteSelectedNodeOrHandle,
  bakeTransformIntoPaperPath,
  processVectorPathAction
};

/**
 * Renders the node edit overlay with zoom and state references.
 */
export const drawNodeEditOverlay = (pathEl, paperPath, pageIndex, zoom = 100, refs = {}) => {
  return drawNodeEditOverlayExt(pathEl, paperPath, pageIndex, zoom, refs);
};

/**
 * Clears pen tool node overlays for a specified page index.
 */
export const clearPenToolNodes = (pageIndex) => {
  return clearPenToolNodesExt(pageIndex);
};

/**
 * Renders bending node indicators for curve editing.
 */
export const drawBendingNodes = (pageIndex, pathEl, paperPath, activeCurveIndex, zoom = 100, refs = {}) => {
  return drawBendingNodesExt(pageIndex, pathEl, paperPath, activeCurveIndex, zoom, refs);
};

/**
 * Renders pen tool node dots on the overlay SVG.
 */
export const drawPenToolNodes = (pageIndex, parentEl, nestedPoints, currentPoint = null, zoom = 100) => {
  return drawPenToolNodesExt(pageIndex, parentEl, nestedPoints, currentPoint, zoom);
};

/**
 * Renders Vectra Pen live preview overlay.
 */
export const renderVectraOverlay = (pageIndex, parentEl, vectraSession, zoom = 100) => {
  return renderVectraOverlayExt(pageIndex, parentEl, vectraSession, zoom);
};

/**
 * Clears Vectra Pen live preview overlay.
 */
export const clearVectraOverlay = (pageIndex) => {
  return clearVectraOverlayExt(pageIndex);
};

/**
 * Helper to exit Node Edit mode safely and clean up overlays.
 */
export const exitNodeEditModeHelper = ({
  nodeEditModeRef,
  nodeEditPathRef,
  drawingPathRef,
  nodeEditPageIndexRef,
  nodeEditDragRef,
  nodeEditSelectedSegIdxRef,
  nodeEditSelectedCurveIdxRef,
  nodeEditHoverCurveIdxRef,
  nodeEditSelectedSegIndicesRef,
  nodeEditSplitSegIdxRef,
  vectraPenSessionRef,
  drawOverlayHighlight
}) => {
  if (!nodeEditModeRef || !nodeEditModeRef.current) return;

  // Remove node edit overlay from ALL page highlight containers
  document.querySelectorAll('[id^="highlight-overlay-"]').forEach(overlay => {
    const nodeGroup = overlay.querySelector('#node-edit-overlay-group');
    if (nodeGroup) nodeGroup.remove();
  });

  const pathEl = nodeEditPathRef.current;
  nodeEditModeRef.current = false;
  if (nodeEditPathRef) nodeEditPathRef.current = null;
  if (drawingPathRef) drawingPathRef.current = null;
  if (nodeEditPageIndexRef) nodeEditPageIndexRef.current = null;
  if (nodeEditDragRef) nodeEditDragRef.current = null;
  if (nodeEditSelectedSegIdxRef) nodeEditSelectedSegIdxRef.current = null;
  if (nodeEditSelectedCurveIdxRef) nodeEditSelectedCurveIdxRef.current = null;
  if (nodeEditHoverCurveIdxRef) nodeEditHoverCurveIdxRef.current = -1;
  if (nodeEditSelectedSegIndicesRef) nodeEditSelectedSegIndicesRef.current = new Set();
  if (nodeEditSplitSegIdxRef) nodeEditSplitSegIdxRef.current = null;
  if (vectraPenSessionRef && vectraPenSessionRef.current) vectraPenSessionRef.current.reset();

  if (pathEl && pathEl.id && document.getElementById(pathEl.id) && typeof drawOverlayHighlight === 'function') {
    drawOverlayHighlight(pathEl, 'selected');
  }

  // Remove node-edit cursor class
  document.querySelectorAll('.page-svg-container').forEach(el => el.classList.remove('cur-node-edit'));
  window.dispatchEvent(new CustomEvent('node-edit-mode-changed', { detail: { active: false } }));
};
