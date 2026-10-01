/**
 * penOverlayEngine.js
 * SVG Overlay rendering engine for Pen Tool & Node Edit mode.
 * Handles rendering anchor dots, handle controls, segment highlights,
 * rubber-band join previews, bending nodes, and Vectra session overlays.
 */

import { getPaperSegments, getPaperCurves } from './vectorNodeEngine';

export const drawNodeEditOverlay = (
  pathEl,
  paperPath,
  pageIndex,
  zoom = 100,
  refs = {}
) => {
  if (!pathEl || !paperPath) return;

  const {
    nodeEditSelectedSegIdxRef,
    nodeEditSelectedSegIndicesRef,
    nodeEditSelectedHandleSideRef,
    nodeEditSelectedCurveIdxRef,
    nodeEditHoverCurveIdxRef,
    nodeEditSplitSegIdxRef,
    nodeEditDragRef,
    nodeEditScreenNodesRef,
    nodeEditScreenSegmentsRef,
    nodeEditRetractHandleRef
  } = refs;

  const overlay = document.getElementById(`highlight-overlay-${pageIndex}`);
  if (!overlay) return;

  let nodeGroup = overlay.querySelector('#node-edit-overlay-group');
  if (!nodeGroup) {
    nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodeGroup.setAttribute('id', 'node-edit-overlay-group');
    overlay.appendChild(nodeGroup);
  } else {
    nodeGroup.innerHTML = '';
  }

  if (nodeEditScreenNodesRef) nodeEditScreenNodesRef.current = [];

  try {
    const ctm = pathEl.getScreenCTM();
    const overlayCtm = overlay.getScreenCTM();
    if (!ctm || !overlayCtm) return;
    const svgMatrix = overlayCtm.inverse().multiply(ctm);

    const overlayScale = Math.hypot(overlayCtm.a, overlayCtm.b) || (zoom / 100) || 1;
    const invScale = 1 / overlayScale;

    const mapPt = (x, y) => new DOMPoint(x, y).matrixTransform(svgMatrix);
    const screenPt = (x, y) => {
      const sp = new DOMPoint(x, y).matrixTransform(ctm);
      return { x: sp.x, y: sp.y };
    };

    const segments = getPaperSegments(paperPath);
    const curves = getPaperCurves(paperPath);
    const selectedSegIdx = nodeEditSelectedSegIdxRef ? nodeEditSelectedSegIdxRef.current : null;
    const selectedSegIndices = nodeEditSelectedSegIndicesRef ? nodeEditSelectedSegIndicesRef.current : new Set();
    const selectedHandleSide = nodeEditSelectedHandleSideRef ? nodeEditSelectedHandleSideRef.current : null;
    const selectedCurveIdx = nodeEditSelectedCurveIdxRef ? nodeEditSelectedCurveIdxRef.current : null;
    const hoverCurveIdx = nodeEditHoverCurveIdxRef ? nodeEditHoverCurveIdxRef.current : -1;
    const splitSegIdx = nodeEditSplitSegIdxRef ? nodeEditSplitSegIdxRef.current : null;
    const retractHandle = nodeEditRetractHandleRef ? nodeEditRetractHandleRef.current : null;
    const isBendingCurve = nodeEditDragRef?.current?.mode === 'segment-bend';

    // Render hovered and selected curve segment lines
    curves.forEach((curve, curveIdx) => {
      const isSelected = selectedCurveIdx === curveIdx ||
        (isBendingCurve && nodeEditDragRef?.current?.curveIndex === curveIdx);
      const isHovered = hoverCurveIdx === curveIdx;

      if (isSelected || isHovered) {
        const p1 = mapPt(curve.point1.x, curve.point1.y);
        const p2 = mapPt(curve.point2.x, curve.point2.y);
        const h1 = mapPt(curve.point1.x + curve.segment1.handleOut.x, curve.point1.y + curve.segment1.handleOut.y);
        const h2 = mapPt(curve.point2.x + curve.segment2.handleIn.x, curve.point2.y + curve.segment2.handleIn.y);

        const segHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        segHighlight.setAttribute('d', `M ${p1.x} ${p1.y} C ${h1.x} ${h1.y} ${h2.x} ${h2.y} ${p2.x} ${p2.y}`);
        segHighlight.setAttribute('fill', 'none');
        segHighlight.setAttribute('stroke-linecap', 'round');

        if (isSelected) {
          segHighlight.setAttribute('stroke', '#6366f1');
          segHighlight.setAttribute('stroke-width', String(2.5 * invScale));
          segHighlight.setAttribute('stroke-opacity', '0.95');
        } else if (isHovered) {
          segHighlight.setAttribute('stroke', '#c7d2fe');
          segHighlight.setAttribute('stroke-width', String(2.5 * invScale));
          segHighlight.setAttribute('stroke-opacity', '0.9');
        }
        nodeGroup.appendChild(segHighlight);
      }
    });

    // Render solid rubber band preview line between 2 selected points ONLY if NOT already connected
    const activeSelSet = nodeEditSelectedSegIndicesRef?.current || new Set();
    if (activeSelSet.size >= 2) {
      const selSegs = Array.from(activeSelSet).map(idx => segments[idx]).filter(Boolean);
      const distinct = [];
      selSegs.forEach(seg => {
        if (!distinct.some(s => Math.hypot(s.point.x - seg.point.x, s.point.y - seg.point.y) < 3.0)) {
          distinct.push(seg);
        }
      });

      if (distinct.length === 2) {
        const pt1 = distinct[0].point;
        const pt2 = distinct[1].point;

        const segs1 = segments.filter(s => Math.hypot(s.point.x - pt1.x, s.point.y - pt1.y) < 3.0);
        const segs2 = segments.filter(s => Math.hypot(s.point.x - pt2.x, s.point.y - pt2.y) < 3.0);

        const isConnected = curves.some(c =>
          (segs1.includes(c.segment1) && segs2.includes(c.segment2)) ||
          (segs1.includes(c.segment2) && segs2.includes(c.segment1))
        );

        if (!isConnected) {
          const p1 = mapPt(pt1.x, pt1.y);
          const p2 = mapPt(pt2.x, pt2.y);

          const rubberBand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          rubberBand.setAttribute('x1', p1.x);
          rubberBand.setAttribute('y1', p1.y);
          rubberBand.setAttribute('x2', p2.x);
          rubberBand.setAttribute('y2', p2.y);
          rubberBand.setAttribute('stroke', '#6366f1');
          rubberBand.setAttribute('stroke-width', String(1.5 * invScale));
          rubberBand.setAttribute('stroke-opacity', '0.8');
          rubberBand.setAttribute('class', 'pen-tool-node node-rubber-band');
          rubberBand.style.pointerEvents = 'none';
          nodeGroup.appendChild(rubberBand);
        }
      }
    }

    const drawnAnchors = [];

    // Render node control handles and anchor dots
    segments.forEach((seg, segIdx) => {
      const pt = seg.point;
      const mappedPt = mapPt(pt.x, pt.y);
      const screenAnchor = screenPt(pt.x, pt.y);
      const isSel = selectedSegIndices.has(segIdx) || selectedSegIdx === segIdx;

      // Handle In - ONLY draw if node is selected
      if (isSel && seg.handleIn && !seg.handleIn.isZero()) {
        const absIn = pt.add(seg.handleIn);
        const mappedIn = mapPt(absIn.x, absIn.y);
        const screenIn = screenPt(absIn.x, absIn.y);
        const isHandleInActive = (selectedSegIdx === segIdx && selectedHandleSide === 'in');

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', mappedPt.x); line.setAttribute('y1', mappedPt.y);
        line.setAttribute('x2', mappedIn.x); line.setAttribute('y2', mappedIn.y);
        line.setAttribute('stroke', '#6366f1');
        line.setAttribute('stroke-width', String((isHandleInActive ? 1.5 : 1) * invScale));
        line.setAttribute('stroke-opacity', isHandleInActive ? '1' : '0.6');
        nodeGroup.appendChild(line);

        const hDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hDot.setAttribute('cx', mappedIn.x); hDot.setAttribute('cy', mappedIn.y);
        hDot.setAttribute('r', String(3 * invScale));
        hDot.setAttribute('fill', isHandleInActive ? '#6366f1' : '#FFFFFF');
        hDot.setAttribute('stroke', isHandleInActive ? '#FFFFFF' : '#6366f1');
        hDot.setAttribute('stroke-width', String((isHandleInActive ? 1.5 : 1.2) * invScale));
        if (isHandleInActive) {
          hDot.style.filter = 'drop-shadow(0px 1px 3px rgba(99, 102, 241, 0.75))';
        }
        hDot.setAttribute('data-node-edit', 'true');
        hDot.setAttribute('data-seg-idx', segIdx);
        hDot.setAttribute('data-handle-side', 'in');
        nodeGroup.appendChild(hDot);

        if (nodeEditScreenNodesRef) {
          nodeEditScreenNodesRef.current.push({ x: screenIn.x, y: screenIn.y, segIdx, handleSide: 'in' });
        }
      }

      // Handle Out - ONLY draw if node is selected
      if (isSel && seg.handleOut && !seg.handleOut.isZero()) {
        const absOut = pt.add(seg.handleOut);
        const mappedOut = mapPt(absOut.x, absOut.y);
        const screenOut = screenPt(absOut.x, absOut.y);
        const isHandleOutActive = (selectedSegIdx === segIdx && selectedHandleSide === 'out');

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', mappedPt.x); line.setAttribute('y1', mappedPt.y);
        line.setAttribute('x2', mappedOut.x); line.setAttribute('y2', mappedOut.y);
        line.setAttribute('stroke', '#6366f1');
        line.setAttribute('stroke-width', String((isHandleOutActive ? 1.5 : 1) * invScale));
        line.setAttribute('stroke-opacity', isHandleOutActive ? '1' : '0.6');
        nodeGroup.appendChild(line);

        const hDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hDot.setAttribute('cx', mappedOut.x); hDot.setAttribute('cy', mappedOut.y);
        hDot.setAttribute('r', String(3 * invScale));
        hDot.setAttribute('fill', isHandleOutActive ? '#6366f1' : '#FFFFFF');
        hDot.setAttribute('stroke', isHandleOutActive ? '#FFFFFF' : '#6366f1');
        hDot.setAttribute('stroke-width', String((isHandleOutActive ? 1.5 : 1.2) * invScale));
        if (isHandleOutActive) {
          hDot.style.filter = 'drop-shadow(0px 1px 3px rgba(99, 102, 241, 0.75))';
        }
        hDot.setAttribute('data-node-edit', 'true');
        hDot.setAttribute('data-seg-idx', segIdx);
        hDot.setAttribute('data-handle-side', 'out');
        nodeGroup.appendChild(hDot);

        if (nodeEditScreenNodesRef) {
          nodeEditScreenNodesRef.current.push({ x: screenOut.x, y: screenOut.y, segIdx, handleSide: 'out' });
        }
      }

      if (nodeEditScreenNodesRef) {
        nodeEditScreenNodesRef.current.push({ x: screenAnchor.x, y: screenAnchor.y, segIdx, handleSide: 'point' });
      }

      const splitSegIdx = nodeEditSplitSegIdxRef?.current;
      const splitPt = (splitSegIdx !== null && splitSegIdx !== undefined && segments[splitSegIdx]) ? segments[splitSegIdx].point : null;
      const isSplit = splitPt ? (splitSegIdx === segIdx || Math.hypot(pt.x - splitPt.x, pt.y - splitPt.y) < 1.5) : false;
      const isRetractThisNode = retractHandle && retractHandle.segIdx === segIdx && retractHandle.isReadyToDelete;

      const existing = drawnAnchors.find(a => Math.hypot(a.mappedPt.x - mappedPt.x, a.mappedPt.y - mappedPt.y) < 2.0);
      if (existing) {
        if (isRetractThisNode) {
          existing.circleEl.setAttribute('r', String(3.5 * invScale));
          existing.circleEl.setAttribute('fill', '#FF3B30');
          existing.circleEl.setAttribute('stroke', '#FFFFFF');
          existing.circleEl.setAttribute('stroke-width', String(1.8 * invScale));
          existing.circleEl.style.filter = 'drop-shadow(0px 1px 3px rgba(255, 59, 48, 0.75))';
        } else if (isSplit) {
          existing.isSplit = true;
          existing.circleEl.setAttribute('r', String(3.5 * invScale));
          existing.circleEl.setAttribute('fill', '#ef4444');
          existing.circleEl.setAttribute('stroke', '#FFFFFF');
          existing.circleEl.setAttribute('stroke-width', String(1.8 * invScale));
          existing.circleEl.style.filter = 'drop-shadow(0px 1px 3px rgba(239, 68, 68, 0.6))';
        } else if (isSel && !existing.isSel) {
          existing.isSel = true;
          existing.circleEl.setAttribute('r', String(3.5 * invScale));
          existing.circleEl.setAttribute('fill', '#6366f1');
          existing.circleEl.setAttribute('stroke', '#FFFFFF');
          existing.circleEl.setAttribute('stroke-width', String(1.8 * invScale));
          existing.circleEl.style.filter = 'drop-shadow(0px 1px 3px rgba(99, 102, 241, 0.6))';
        }
      } else {
        const anchor = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        anchor.setAttribute('cx', mappedPt.x);
        anchor.setAttribute('cy', mappedPt.y);
        anchor.setAttribute('r', String(3.5 * invScale));
        anchor.setAttribute('fill', isRetractThisNode ? '#FF3B30' : (isSplit ? '#ef4444' : (isSel ? '#6366f1' : '#FFFFFF')));
        anchor.setAttribute('stroke', isRetractThisNode || isSel || isSplit ? '#FFFFFF' : '#6366f1');
        anchor.setAttribute('stroke-width', String((isRetractThisNode || isSel || isSplit ? 1.8 : 1.5) * invScale));
        anchor.setAttribute('data-node-edit', 'true');
        anchor.setAttribute('data-seg-idx', segIdx);
        anchor.setAttribute('data-handle-side', 'point');
        if (isRetractThisNode) {
          anchor.style.filter = 'drop-shadow(0px 1px 3px rgba(255, 59, 48, 0.75))';
        } else if (isSplit) {
          anchor.style.filter = 'drop-shadow(0px 1px 3px rgba(239, 68, 68, 0.6))';
        } else if (isSel) {
          anchor.style.filter = 'drop-shadow(0px 1px 3px rgba(99, 102, 241, 0.6))';
        }
        nodeGroup.appendChild(anchor);
        drawnAnchors.push({ mappedPt, isSel, isSplit, circleEl: anchor });
      }
    });

    if (nodeEditScreenSegmentsRef) {
      nodeEditScreenSegmentsRef.current = [];
      curves.forEach((curve, curveIdx) => {
        try {
          const midLoc = curve.getPointAtTime(0.5);
          const screenMid = screenPt(midLoc.x, midLoc.y);
          nodeEditScreenSegmentsRef.current.push({
            curveIdx,
            mx: screenMid.x,
            my: screenMid.y,
            seg1Idx: segments.indexOf(curve.segment1),
            seg2Idx: segments.indexOf(curve.segment2),
          });
        } catch (_) {}
      });
    }

  } catch (err) { /* non-critical */ }
};

export const clearPenToolNodes = (pageIndex) => {
  const overlay = document.getElementById(`highlight-overlay-${pageIndex}`);
  if (!overlay) return;
  const nodeGroup = overlay.querySelector('#node-edit-overlay-group');
  if (nodeGroup) nodeGroup.remove();
};

export const drawPenToolNodes = (pageIndex, parentEl, nestedPoints, currentPoint = null, zoom = 100) => {
  const overlay = document.getElementById(`highlight-overlay-${pageIndex}`);
  if (!overlay || !parentEl) return;

  clearPenToolNodes(pageIndex);

  try {
    const ctm = parentEl.getScreenCTM();
    const overlayCtm = overlay.getScreenCTM();
    if (!ctm || !overlayCtm) return;
    const svgMatrix = overlayCtm.inverse().multiply(ctm);

    const overlayScale = Math.hypot(overlayCtm.a, overlayCtm.b) || (zoom / 100) || 1;
    const invScale = 1 / overlayScale;

    nestedPoints.forEach((pts, pIdx) => {
      const allPts = [...pts];
      const isCurrentPath = pIdx === nestedPoints.length - 1;
      if (isCurrentPath && currentPoint && !pts.isZ) allPts.push(currentPoint);

      allPts.forEach((pt, i) => {
        const svgPt = overlay.createSVGPoint();
        svgPt.x = pt.x;
        svgPt.y = pt.y;
        const mapped = svgPt.matrixTransform(svgMatrix);

        const isCorner = pt.isCorner;
        let node;
        if (isCorner) {
          node = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          const rSize = 7 * invScale;
          node.setAttribute('x', mapped.x - rSize / 2);
          node.setAttribute('y', mapped.y - rSize / 2);
          node.setAttribute('width', String(rSize));
          node.setAttribute('height', String(rSize));
        } else {
          node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          node.setAttribute('cx', mapped.x);
          node.setAttribute('cy', mapped.y);
          node.setAttribute('r', String(4 * invScale));
        }

        node.setAttribute('class', 'pen-tool-node');
        node.setAttribute('stroke', '#6366F1');
        node.setAttribute('stroke-width', String(1.5 * invScale));

        const isLast = isCurrentPath && i === allPts.length - 1 && !pts.isZ;
        node.setAttribute('fill', isLast ? '#6366F1' : '#FFFFFF');

        overlay.appendChild(node);
      });
    });
  } catch (e) { }
};

export const drawBendingNodes = (pageIndex, pathEl, paperPath, activeCurveIndex, zoom = 100, refs = {}) => {
  const overlay = document.getElementById(`highlight-overlay-${pageIndex}`);
  if (!overlay || !pathEl) return;

  const { drawingPathRef, drawingSubPathsRef } = refs;

  if (drawingPathRef?.current) {
    drawPenToolNodes(pageIndex, drawingPathRef.current, drawingSubPathsRef?.current || [], null, zoom);
  } else {
    clearPenToolNodes(pageIndex);
  }

  try {
    const ctm = pathEl.getScreenCTM();
    const overlayCtm = overlay.getScreenCTM();
    if (!ctm || !overlayCtm) return;
    const svgMatrix = overlayCtm.inverse().multiply(ctm);

    const overlayScale = Math.hypot(overlayCtm.a, overlayCtm.b) || (zoom / 100) || 1;
    const invScale = 1 / overlayScale;

    const curve = paperPath.curves[activeCurveIndex];
    const segments = [curve.segment1, curve.segment2];

    const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    const map = (x, y) => new DOMPoint(x, y).matrixTransform(svgMatrix);
    const p1 = map(curve.point1.x, curve.point1.y);
    const p2 = map(curve.point2.x, curve.point2.y);
    const h1 = map(curve.point1.x + curve.segment1.handleOut.x, curve.point1.y + curve.segment1.handleOut.y);
    const h2 = map(curve.point2.x + curve.segment2.handleIn.x, curve.point2.y + curve.segment2.handleIn.y);

    highlight.setAttribute('d', `M ${p1.x} ${p1.y} C ${h1.x} ${h1.y} ${h2.x} ${h2.y} ${p2.x} ${p2.y}`);
    highlight.setAttribute('stroke', '#6366F1');
    highlight.setAttribute('stroke-width', String(2.5 * invScale));
    highlight.setAttribute('fill', 'none');
    highlight.setAttribute('class', 'pen-tool-node');
    highlight.style.pointerEvents = 'none';
    overlay.appendChild(highlight);

    segments.forEach(seg => {
      const pt = seg.point;

      const mappedPt = new DOMPoint(pt.x, pt.y).matrixTransform(svgMatrix);
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      node.setAttribute('cx', mappedPt.x);
      node.setAttribute('cy', mappedPt.y);
      node.setAttribute('r', String(3.5 * invScale));
      node.setAttribute('class', 'pen-tool-node');
      node.setAttribute('stroke', '#6366F1');
      node.setAttribute('stroke-width', String(1.5 * invScale));
      node.setAttribute('fill', '#FFFFFF');
      overlay.appendChild(node);

      const drawHandle = (h) => {
        if (!h || h.isZero()) return;
        const absH = pt.add(h);
        const mappedH = new DOMPoint(absH.x, absH.y).matrixTransform(svgMatrix);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', mappedPt.x);
        line.setAttribute('y1', mappedPt.y);
        line.setAttribute('x2', mappedH.x);
        line.setAttribute('y2', mappedH.y);
        line.setAttribute('stroke', '#6366F1');
        line.setAttribute('stroke-width', String(1 * invScale));
        line.setAttribute('class', 'pen-tool-node');
        overlay.appendChild(line);

        const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const dSize = 6 * invScale;
        diamond.setAttribute('x', mappedH.x - dSize / 2);
        diamond.setAttribute('y', mappedH.y - dSize / 2);
        diamond.setAttribute('width', String(dSize));
        diamond.setAttribute('height', String(dSize));
        diamond.setAttribute('transform', `rotate(45, ${mappedH.x}, ${mappedH.y})`);
        diamond.setAttribute('fill', '#FFFFFF');
        diamond.setAttribute('stroke', '#6366F1');
        diamond.setAttribute('stroke-width', String(1 * invScale));
        diamond.setAttribute('class', 'pen-tool-node');
        overlay.appendChild(diamond);
      };

      drawHandle(seg.handleIn);
      drawHandle(seg.handleOut);
    });
  } catch (e) { }
};

export const renderVectraOverlay = (pageIndex, parentEl, vectraSession, zoom = 100) => {
  const overlay = document.getElementById(`highlight-overlay-${pageIndex}`);
  if (!overlay || !parentEl || !vectraSession) return;

  let vectraGroup = overlay.querySelector('#vectra-overlay-group');
  if (!vectraGroup) {
    vectraGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    vectraGroup.setAttribute('id', 'vectra-overlay-group');
    overlay.appendChild(vectraGroup);
  } else {
    vectraGroup.innerHTML = '';
  }

  try {
    const ctm = parentEl.getScreenCTM();
    const overlayCtm = overlay.getScreenCTM();
    if (!ctm || !overlayCtm) return;
    const matrix = overlayCtm.inverse().multiply(ctm);

    const overlayScale = Math.hypot(overlayCtm.a, overlayCtm.b) || (zoom / 100) || 1;
    const invScale = 1 / overlayScale;

    const mapPt = (x, y) => {
      const p = overlay.createSVGPoint();
      p.x = x; p.y = y;
      return p.matrixTransform(matrix);
    };

    if (vectraSession.ui.previewD) {
      const previewG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const matrixStr = `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})`;
      previewG.setAttribute('transform', matrixStr);

      const previewPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      previewPath.setAttribute('d', vectraSession.ui.previewD);
      previewPath.setAttribute('fill', 'none');
      previewPath.setAttribute('stroke', '#6366f1');
      previewPath.setAttribute('stroke-width', String(1.5 * invScale));
      previewPath.setAttribute('stroke-opacity', '0.8');
      previewG.appendChild(previewPath);
      vectraGroup.appendChild(previewG);
    }

    if (vectraSession.ui.endpointHint) {
      const hp = mapPt(vectraSession.ui.endpointHint.x, vectraSession.ui.endpointHint.y);
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('cx', hp.x);
      ring.setAttribute('cy', hp.y);
      ring.setAttribute('r', String(7 * invScale));
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', '#6366f1');
      ring.setAttribute('stroke-width', String(1.5 * invScale));
      vectraGroup.appendChild(ring);
    }

    if (vectraSession.ui.ghost) {
      const gp = mapPt(vectraSession.ui.ghost.x, vectraSession.ui.ghost.y);
      const r = 5 * invScale;
      const ghostPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      ghostPath.setAttribute('d', `M ${gp.x - r} ${gp.y} H ${gp.x + r} M ${gp.x} ${gp.y - r} V ${gp.y + r}`);
      ghostPath.setAttribute('stroke', '#FF5C87');
      ghostPath.setAttribute('stroke-width', String(1.25 * invScale));
      ghostPath.setAttribute('fill', 'none');
      vectraGroup.appendChild(ghostPath);
    }

    for (const path of vectraSession.paths.values()) {
      const n = path.nodes.length;
      for (let i = 0; i < n; i++) {
        const node = path.nodes[i];
        const np = mapPt(node.x, node.y);

        for (const end of ['in', 'out']) {
          if (node[end]) {
            const hPt = end === 'in' ? { x: node.x + node.in.x, y: node.y + node.in.y } : { x: node.x + node.out.x, y: node.y + node.out.y };
            const hp = mapPt(hPt.x, hPt.y);

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', np.x);
            line.setAttribute('y1', np.y);
            line.setAttribute('x2', hp.x);
            line.setAttribute('y2', hp.y);
            line.setAttribute('stroke', '#6366f1');
            line.setAttribute('stroke-width', String(1 * invScale));
            line.setAttribute('stroke-opacity', '0.6');
            vectraGroup.appendChild(line);

            const hDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            hDot.setAttribute('cx', hp.x);
            hDot.setAttribute('cy', hp.y);
            hDot.setAttribute('r', String(3 * invScale));
            hDot.setAttribute('fill', '#FFFFFF');
            hDot.setAttribute('stroke', '#6366f1');
            hDot.setAttribute('stroke-width', String(1 * invScale));
            vectraGroup.appendChild(hDot);
          }
        }

        const anchor = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        anchor.setAttribute('cx', np.x);
        anchor.setAttribute('cy', np.y);
        const isLastOrActive = (path.id === vectraSession.activePathId && i === n - 1);
        anchor.setAttribute('r', String(3.5 * invScale));
        anchor.setAttribute('fill', isLastOrActive ? '#6366f1' : '#FFFFFF');
        anchor.setAttribute('stroke', isLastOrActive ? '#FFFFFF' : '#6366f1');
        anchor.setAttribute('stroke-width', String(1.5 * invScale));
        vectraGroup.appendChild(anchor);
      }
    }
  } catch (e) { }
};

export const clearVectraOverlay = (pageIndex) => {
  const overlay = document.getElementById(`highlight-overlay-${pageIndex}`);
  if (!overlay) return;
  const vectraGroup = overlay.querySelector('#vectra-overlay-group');
  if (vectraGroup) vectraGroup.innerHTML = '';
};

export const generatePathData = (pts, isClosed = false, toolType = 'pen', activePoint = null) => {
  let subPts = [...pts];
  if (activePoint) subPts.push(activePoint);
  if (subPts.length === 0) return "";

  const subIsClosed = isClosed || (pts && pts.isZ);
  const isCurve = toolType === 'curve';

  if (!isCurve) {
    return subPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') + (subIsClosed ? ' Z' : '');
  }

  if (subPts.length === 1) return `M ${subPts[0].x.toFixed(2)} ${subPts[0].y.toFixed(2)}`;
  if (subPts.length === 2 && !subIsClosed) {
    return `M ${subPts[0].x.toFixed(2)} ${subPts[0].y.toFixed(2)} L ${subPts[1].x.toFixed(2)} ${subPts[1].y.toFixed(2)}`;
  }

  let d = `M ${subPts[0].x.toFixed(2)} ${subPts[0].y.toFixed(2)}`;
  const count = subIsClosed ? subPts.length : subPts.length - 1;

  for (let i = 0; i < count; i++) {
    const p1 = subPts[i];
    const p2 = subPts[(i + 1) % subPts.length];

    if (p1.handleOut || p2.handleIn) {
      const h1 = p1.handleOut || { x: 0, y: 0 };
      const h2 = p2.handleIn || { x: 0, y: 0 };
      const cp1x = p1.x + h1.x;
      const cp1y = p1.y + h1.y;
      const cp2x = p2.x + h2.x;
      const cp2y = p2.y + h2.y;
      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
      continue;
    }

    if (p1.isCorner || p2.isCorner || !isCurve) {
      d += ` L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
      continue;
    }

    const p0 = subPts[i === 0 ? (subIsClosed ? subPts.length - 1 : 0) : i - 1] || p1;
    const p3 = subPts[(i + 2) % subPts.length] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  if (subIsClosed) d += " Z";
  return d;
};
