/**
 * vectorNodeEngine.js
 * Extracted vector path manipulation, node editing, line deduplication,
 * meeting-node cleanup utilities, handle calculations, and vector path actions.
 */

export const getPaperSegments = (paperPath) => {
  if (!paperPath) return [];
  if (paperPath.children && paperPath.children.length > 0) {
    return paperPath.children.flatMap(c => c.segments || []);
  }
  return paperPath.segments || [];
};

export const getPaperCurves = (paperPath) => {
  if (!paperPath) return [];
  if (paperPath.children && paperPath.children.length > 0) {
    return paperPath.children.flatMap(c => c.curves || []);
  }
  return paperPath.curves || [];
};

export const cleanPaperPathData = (paperPath) => {
  if (!paperPath) return '';
  const contours = (paperPath.children && paperPath.children.length > 0)
    ? paperPath.children
    : [paperPath];

  const cleanSubpathDs = [];

  contours.forEach(child => {
    if (!child.segments || child.segments.length === 0) return;
    const n = child.segments.length;
    const first = child.segments[0].point;
    let d = `M ${Math.round(first.x * 100) / 100} ${Math.round(first.y * 100) / 100}`;
    const count = child.closed ? n : Math.max(0, n - 1);

    for (let i = 0; i < count; i++) {
      const seg1 = child.segments[i];
      const seg2 = child.segments[(i + 1) % n];
      const p1 = seg1.point;
      const p2 = seg2.point;

      // Remove in-between line if two points meet at exact same position (0-length line)
      const pointDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (pointDist < 0.5) {
        continue;
      }

      const isLine = (!seg1.handleOut || seg1.handleOut.isZero()) && (!seg2.handleIn || seg2.handleIn.isZero());

      if (isLine) {
        d += ` L ${Math.round(p2.x * 100) / 100} ${Math.round(p2.y * 100) / 100}`;
      } else {
        const c1 = p1.add(seg1.handleOut);
        const c2 = p2.add(seg2.handleIn);
        d += ` C ${Math.round(c1.x * 100) / 100} ${Math.round(c1.y * 100) / 100} ${Math.round(c2.x * 100) / 100} ${Math.round(c2.y * 100) / 100} ${Math.round(p2.x * 100) / 100} ${Math.round(p2.y * 100) / 100}`;
      }
    }
    if (child.closed) d += ' Z';
    cleanSubpathDs.push(d);
  });

  return cleanSubpathDs.join(' ');
};

const parseSingleMatrix = (el) => {
  if (!el) return new DOMMatrix();

  try {
    const consolidated = el.transform?.baseVal?.consolidate();
    if (consolidated?.matrix) {
      const { a, b, c, d, e, f } = consolidated.matrix;
      return new DOMMatrix([a, b, c, d, e, f]);
    }
  } catch (e) {}

  const transformAttr = el.getAttribute ? el.getAttribute('transform') : null;
  const styleTransform = el.style ? (el.style.transform || el.style.translate) : null;

  let matrix = new DOMMatrix();

  if (transformAttr) {
    try {
      const match = transformAttr.match(/matrix\s*\(([^)]+)\)/i);
      if (match) {
        const parts = match[1].split(/[\s,]+/).map(Number);
        if (parts.length === 6) matrix = new DOMMatrix(parts);
      } else {
        const tMatch = transformAttr.match(/translate\s*\(([^)]+)\)/i);
        if (tMatch) {
          const parts = tMatch[1].split(/[\s,]+/).map(Number);
          matrix = matrix.translate(parts[0] || 0, parts[1] || 0);
        }
      }
    } catch (e) {}
  }

  if (styleTransform) {
    try {
      matrix = matrix.multiply(new DOMMatrix(styleTransform));
    } catch (e) {}
  }

  return matrix;
};

export const bakeTransformIntoPaperPath = (pathEl, paperPath, paperScope) => {
  if (!pathEl || !paperPath) return paperPath;

  const elementsWithTransform = [];
  let curr = pathEl;
  while (curr && curr.tagName && curr.tagName.toLowerCase() !== 'svg') {
    const transformAttr = curr.getAttribute('transform');
    const styleTransform = curr.style.transform || curr.style.translate;
    if (transformAttr || styleTransform) {
      elementsWithTransform.push(curr);
    }
    curr = curr.parentElement;
  }

  if (elementsWithTransform.length === 0) return paperPath;

  try {
    let combinedMatrix = new DOMMatrix();
    for (let i = elementsWithTransform.length - 1; i >= 0; i--) {
      const el = elementsWithTransform[i];
      const m = parseSingleMatrix(el);
      combinedMatrix = combinedMatrix.multiply(m);
    }

    if (combinedMatrix.isIdentity) return paperPath;

    if (paperScope) paperScope.activate();
    const paperMatrix = paperScope
      ? new paperScope.Matrix(combinedMatrix.a, combinedMatrix.b, combinedMatrix.c, combinedMatrix.d, combinedMatrix.e, combinedMatrix.f)
      : null;

    if (paperMatrix && typeof paperPath.transform === 'function') {
      paperPath.transform(paperMatrix);
    } else {
      const segments = getPaperSegments(paperPath);
      segments.forEach(seg => {
        const p = new DOMPoint(seg.point.x, seg.point.y).matrixTransform(combinedMatrix);
        seg.point.x = p.x;
        seg.point.y = p.y;

        if (seg.handleIn && !seg.handleIn.isZero()) {
          const inPt = new DOMPoint(seg.point.x + seg.handleIn.x, seg.point.y + seg.handleIn.y).matrixTransform(combinedMatrix);
          seg.handleIn.x = inPt.x - p.x;
          seg.handleIn.y = inPt.y - p.y;
        }
        if (seg.handleOut && !seg.handleOut.isZero()) {
          const outPt = new DOMPoint(seg.point.x + seg.handleOut.x, seg.point.y + seg.handleOut.y).matrixTransform(combinedMatrix);
          seg.handleOut.x = outPt.x - p.x;
          seg.handleOut.y = outPt.y - p.y;
        }
      });
    }

    const newD = cleanPaperPathData(paperPath);
    if (newD) pathEl.setAttribute('d', newD);

    elementsWithTransform.forEach(el => {
      el.removeAttribute('transform');
      if (el.style) {
        el.style.transform = '';
        el.style.translate = '';
      }
    });
  } catch (err) {
    console.warn('[bakeTransformIntoPaperPath] Error baking matrix:', err);
  }

  return paperPath;
};

export const mergeMeetingNodes = (paperPath, paperScope) => {
  if (!paperPath) return;
  try {
    if (paperScope) paperScope.activate();
    const contours = (paperPath.children && paperPath.children.length > 0)
      ? paperPath.children.slice()
      : [paperPath];

    contours.forEach(child => {
      if (!child.segments) return;

      // If all points in this contour have merged to the same location, remove contour
      if (child.segments.length > 1) {
        const firstPt = child.segments[0].point;
        const allMerged = child.segments.every(s => Math.hypot(s.point.x - firstPt.x, s.point.y - firstPt.y) < 1.5);
        if (allMerged) {
          child.remove();
          return;
        }
      }

      // If an open 2-point line segment meets at the exact same location, remove the line subpath completely
      if (!child.closed && child.segments.length === 2) {
        const seg1 = child.segments[0];
        const seg2 = child.segments[1];
        if (seg1 && seg2 && Math.hypot(seg1.point.x - seg2.point.x, seg1.point.y - seg2.point.y) < 1.5) {
          child.remove();
          return;
        }
      }

      // Loop backwards to remove duplicate meeting segments
      for (let i = child.segments.length - 1; i >= 0; i--) {
        if (child.segments.length <= 1) break;
        const nextIdx = (i + 1) % child.segments.length;
        if (!child.closed && nextIdx === 0) continue;
        const seg1 = child.segments[i];
        const seg2 = child.segments[nextIdx];
        if (seg1 && seg2) {
          const dist = Math.hypot(seg1.point.x - seg2.point.x, seg1.point.y - seg2.point.y);
          if (dist < 1.5) {
            child.removeSegment(nextIdx);
          }
        }
      }

      if (child.segments.length <= 1) {
        child.remove();
      }
    });
  } catch (e) {}
};

/**
 * Drag and adjust control handles according to active node curve mode (smooth, balanced, custom, sharp).
 */
export const applyHandleDrag = (seg, handleSide, mousePoint, isAltKey) => {
  if (!seg) return;
  if (isAltKey) {
    seg.nodeType = 'custom';
  }

  // If one of the handles is zero (retracted/deleted), lock nodeType as 'custom' so dragging the remaining handle never recreates the deleted handle!
  if ((handleSide === 'in' && seg.handleOut.isZero()) || (handleSide === 'out' && seg.handleIn.isZero())) {
    seg.nodeType = 'custom';
  }

  let nodeType = seg.nodeType;
  if (!nodeType) {
    if (seg.handleIn.isZero() && seg.handleOut.isZero()) {
      nodeType = 'sharp';
    } else if (!seg.handleIn.isZero() && !seg.handleOut.isZero()) {
      const dot = seg.handleIn.normalize().dot(seg.handleOut.normalize());
      if (dot < -0.90) {
        const lenDiff = Math.abs(seg.handleIn.length - seg.handleOut.length);
        nodeType = lenDiff < 4.0 ? 'balanced' : 'smooth';
      } else {
        nodeType = 'custom';
      }
    } else {
      nodeType = 'custom';
    }
    seg.nodeType = nodeType;
  }

  const mouseVec = mousePoint.subtract(seg.point);

  if (handleSide === 'in') {
    seg.handleIn = mouseVec;
    if (nodeType === 'balanced' && seg.handleOut && !seg.handleOut.isZero()) {
      seg.handleOut = mouseVec.multiply(-1);
    } else if (nodeType === 'smooth' && seg.handleOut && !seg.handleOut.isZero()) {
      const outLen = seg.handleOut.length;
      if (!mouseVec.isZero()) {
        seg.handleOut = mouseVec.normalize(-outLen);
      }
    }
  } else if (handleSide === 'out') {
    seg.handleOut = mouseVec;
    if (nodeType === 'balanced' && seg.handleIn && !seg.handleIn.isZero()) {
      seg.handleIn = mouseVec.multiply(-1);
    } else if (nodeType === 'smooth' && seg.handleIn && !seg.handleIn.isZero()) {
      const inLen = seg.handleIn.length;
      if (!mouseVec.isZero()) {
        seg.handleIn = mouseVec.normalize(-inLen);
      }
    }
  }
};

/**
 * Execute vector path property action (sharp, smooth, balanced, custom, join, split, add-point, curve-line).
 * Supports both standard Paths and CompoundPaths.
 */
export const executeVectorPathAction = (paperPath, action, targetSegIndices, paperScope, targetCurveIdx = null) => {
  if (!paperPath || !action) return { paperPath, addedSegIdx: null };

  const Point = paperScope ? paperScope.Point : paperPath.project?.paper?.Point;
  const segments = getPaperSegments(paperPath);
  const curves = getPaperCurves(paperPath);
  let addedSegIdx = null;

  if (action === 'sharp') {
    targetSegIndices.forEach(idx => {
      const seg = segments[idx];
      if (seg) {
        seg.nodeType = 'sharp';
        seg.handleIn = new Point(0, 0);
        seg.handleOut = new Point(0, 0);
      }
    });
  } else if (action === 'smooth') {
    targetSegIndices.forEach(idx => {
      const seg = segments[idx];
      if (!seg) return;
      seg.nodeType = 'smooth';
      const isClosed = seg.path ? seg.path.closed : paperPath.closed;

      let prev = seg.previous;
      let next = seg.next;

      if (isClosed) {
        if (!prev && seg.path && seg.path.segments.length > 0) {
          prev = seg.path.segments[seg.path.segments.length - 1];
        }
        if (!next && seg.path && seg.path.segments.length > 0) {
          next = seg.path.segments[0];
        }
      }

      if (prev && next && prev !== seg && next !== seg) {
        const dir = next.point.subtract(prev.point);
        if (dir.isZero()) return;
        let outLen = (!seg.handleOut.isZero() && seg.handleOut.length > 1) ? seg.handleOut.length : 35;
        let inLen = (!seg.handleIn.isZero() && seg.handleIn.length > 1) ? seg.handleIn.length : 20;

        if (Math.abs(outLen - inLen) < 4.0) {
          outLen = 35;
          inLen = 20;
        }

        seg.handleOut = dir.normalize(outLen);
        seg.handleIn = dir.normalize(-inLen);
      } else if (prev && prev !== seg) {
        const dir = seg.point.subtract(prev.point);
        if (dir.isZero()) return;
        const inLen = (!seg.handleIn.isZero() && seg.handleIn.length > 1) ? seg.handleIn.length : 25;

        seg.handleIn = dir.normalize(-inLen);
        seg.handleOut = new Point(0, 0);
      } else if (next && next !== seg) {
        const dir = next.point.subtract(seg.point);
        if (dir.isZero()) return;
        const outLen = (!seg.handleOut.isZero() && seg.handleOut.length > 1) ? seg.handleOut.length : 25;

        seg.handleOut = dir.normalize(outLen);
        seg.handleIn = new Point(0, 0);
      }
    });
  } else if (action === 'balanced') {
    targetSegIndices.forEach(idx => {
      const seg = segments[idx];
      if (!seg) return;
      seg.nodeType = 'balanced';
      const isClosed = seg.path ? seg.path.closed : paperPath.closed;

      let prev = seg.previous;
      let next = seg.next;

      if (isClosed) {
        if (!prev && seg.path && seg.path.segments.length > 0) {
          prev = seg.path.segments[seg.path.segments.length - 1];
        }
        if (!next && seg.path && seg.path.segments.length > 0) {
          next = seg.path.segments[0];
        }
      }

      if (prev && next && prev !== seg && next !== seg) {
        const dir = next.point.subtract(prev.point);
        if (dir.isZero()) return;
        const len = Math.max(seg.handleIn.length, seg.handleOut.length, 25);

        seg.handleOut = dir.normalize(len);
        seg.handleIn = dir.normalize(-len);
      } else if (prev && prev !== seg) {
        const dir = seg.point.subtract(prev.point);
        if (dir.isZero()) return;
        const len = seg.handleIn.length > 1 ? seg.handleIn.length : 25;

        seg.handleIn = dir.normalize(-len);
        seg.handleOut = new Point(0, 0);
      } else if (next && next !== seg) {
        const dir = next.point.subtract(seg.point);
        if (dir.isZero()) return;
        const len = seg.handleOut.length > 1 ? seg.handleOut.length : 25;

        seg.handleOut = dir.normalize(len);
        seg.handleIn = new Point(0, 0);
      }
    });
  } else if (action === 'custom') {
    targetSegIndices.forEach(idx => {
      const seg = segments[idx];
      if (!seg) return;
      seg.nodeType = 'custom';

      if (seg.handleIn.isZero() && seg.handleOut.isZero()) {
        const isClosed = seg.path ? seg.path.closed : paperPath.closed;
        let prev = seg.previous;
        let next = seg.next;

        if (isClosed) {
          if (!prev && seg.path && seg.path.segments.length > 0) {
            prev = seg.path.segments[seg.path.segments.length - 1];
          }
          if (!next && seg.path && seg.path.segments.length > 0) {
            next = seg.path.segments[0];
          }
        }

        // Use independent handle angles (rotated 25 deg) and asymmetric lengths (30 out / 20 in) for custom curves
        if (prev && next && prev !== seg && next !== seg) {
          const dir = next.point.subtract(prev.point);
          if (!dir.isZero()) {
            seg.handleOut = dir.rotate(25).normalize(30);
            seg.handleIn = dir.multiply(-1).rotate(-25).normalize(20);
          } else {
            seg.handleOut = new Point(30, 8);
            seg.handleIn = new Point(-20, -8);
          }
        } else if (prev && prev !== seg) {
          const dir = seg.point.subtract(prev.point);
          if (!dir.isZero()) {
            seg.handleIn = dir.multiply(-1).rotate(-25).normalize(20);
            seg.handleOut = dir.rotate(25).normalize(30);
          } else {
            seg.handleIn = new Point(-20, -8);
            seg.handleOut = new Point(30, 8);
          }
        } else if (next && next !== seg) {
          const dir = next.point.subtract(seg.point);
          if (!dir.isZero()) {
            seg.handleOut = dir.rotate(25).normalize(30);
            seg.handleIn = dir.multiply(-1).rotate(-25).normalize(20);
          } else {
            seg.handleOut = new Point(30, 8);
            seg.handleIn = new Point(-20, -8);
          }
        } else {
          seg.handleOut = new Point(30, 8);
          seg.handleIn = new Point(-20, -8);
        }
      } else {
        // Handles already exist — ensure nodeType is custom so handles move independently
        // If handles were collinear (dot < -0.90), tilt handleOut by 30 deg so dot is -0.866 > -0.90 and auto-detection classifies as custom
        if (!seg.handleIn.isZero() && !seg.handleOut.isZero()) {
          const dot = seg.handleIn.normalize().dot(seg.handleOut.normalize());
          if (dot < -0.90) {
            seg.handleOut = seg.handleOut.rotate(30);
          }
        }
      }
    });
  } else if (action === 'join') {
    const selSegs = (targetSegIndices || []).map(idx => segments[idx]).filter(Boolean);
    const distinct = [];
    selSegs.forEach(seg => {
      if (!distinct.some(s => Math.hypot(s.point.x - seg.point.x, s.point.y - seg.point.y) < 3.0)) {
        distinct.push(seg);
      }
    });

    if (distinct.length === 2) {
      const seg1 = distinct[0];
      const seg2 = distinct[1];
      if (seg1 && seg2) {
        const subpath1 = seg1.path || paperPath;
        const subpath2 = seg2.path || paperPath;

        if (subpath1 === subpath2) {
          const path = subpath1;
          const first = path.firstSegment;
          const last = path.lastSegment;

          const isEnd1 = (seg1 === first || seg1 === last);
          const isEnd2 = (seg2 === first || seg2 === last);

          if (!path.closed && isEnd1 && isEnd2 && first && last && first !== last) {
            path.closed = true;
          } else {
            const PathClass = paperScope ? paperScope.Path : (paperPath.project?.paper?.Path || paperPath.constructor);
            const CompoundClass = paperScope ? paperScope.CompoundPath : (paperPath.project?.paper?.CompoundPath);
            const linePath = new PathClass({
              segments: [seg1.point.clone(), seg2.point.clone()],
              closed: false
            });
            if (paperPath.className === 'CompoundPath') {
              paperPath.addChild(linePath);
            } else if (CompoundClass) {
              const compound = new CompoundClass({
                children: [paperPath, linePath]
              });
              return { paperPath: compound, addedSegIdx: null };
            } else {
              const compound = new CompoundClass({
                children: [paperPath, linePath]
              });
              return { paperPath: compound, addedSegIdx: null };
            }
          }
        } else if (subpath1 && subpath2) {
          const first1 = subpath1.firstSegment;
          const last1 = subpath1.lastSegment;
          const first2 = subpath2.firstSegment;
          const last2 = subpath2.lastSegment;

          const isEp1 = (seg1 === first1 || seg1 === last1);
          const isEp2 = (seg2 === first2 || seg2 === last2);

          if (isEp1 && isEp2 && typeof subpath1.join === 'function') {
            try {
              subpath1.join(subpath2);
            } catch (_) {
              const PathClass = paperScope ? paperScope.Path : (paperPath.project?.paper?.Path || paperPath.constructor);
              const CompoundClass = paperScope ? paperScope.CompoundPath : (paperPath.project?.paper?.CompoundPath);
              const linePath = new PathClass({
                segments: [seg1.point.clone(), seg2.point.clone()],
                closed: false
              });
              if (paperPath.className === 'CompoundPath') {
                paperPath.addChild(linePath);
              } else if (CompoundClass) {
                return { paperPath: new CompoundClass({ children: [paperPath, linePath] }), addedSegIdx: null };
              }
            }
          } else {
            const PathClass = paperScope ? paperScope.Path : (paperPath.project?.paper?.Path || paperPath.constructor);
            const CompoundClass = paperScope ? paperScope.CompoundPath : (paperPath.project?.paper?.CompoundPath);
            const linePath = new PathClass({
              segments: [seg1.point.clone(), seg2.point.clone()],
              closed: false
            });
            if (paperPath.className === 'CompoundPath') {
              paperPath.addChild(linePath);
            } else if (CompoundClass) {
              return { paperPath: new CompoundClass({ children: [paperPath, linePath] }), addedSegIdx: null };
            }
          }
        }
      }
    }
  } else if (action === 'add-point') {
    let curveToDivide = null;
    if (targetCurveIdx !== null && targetCurveIdx !== undefined && curves[targetCurveIdx]) {
      curveToDivide = curves[targetCurveIdx];
    } else if (targetSegIndices && targetSegIndices.length === 2) {
      const s1 = segments[targetSegIndices[0]];
      const s2 = segments[targetSegIndices[1]];
      if (s1 && s2) {
        curveToDivide = curves.find(c => (c.segment1 === s1 && c.segment2 === s2) || (c.segment1 === s2 && c.segment2 === s1));
      }
    }

    if (curveToDivide) {
      const resCurve = curveToDivide.divideAtTime(0.5);
      const newSeg = resCurve ? (resCurve.segment1 || resCurve) : null;
      if (newSeg) {
        const updatedSegments = getPaperSegments(paperPath);
        addedSegIdx = updatedSegments.indexOf(newSeg);
      }
    } else if (targetSegIndices && targetSegIndices.length > 0) {
      const targetSegs = targetSegIndices.map(idx => segments[idx]).filter(Boolean);
      const targetCurves = curves.filter(c => targetSegs.includes(c.segment1) || targetSegs.includes(c.segment2));
      if (targetCurves.length > 0) {
        targetCurves.forEach(c => c.divideAtTime(0.5));
      } else {
        curves.forEach(c => c.divideAtTime(0.5));
      }
    } else {
      curves.forEach(c => c.divideAtTime(0.5));
    }
  } else if (action === 'curve-line') {
    let targetCurves = [];
    if (targetCurveIdx !== null && targetCurveIdx !== undefined && curves[targetCurveIdx]) {
      targetCurves = [curves[targetCurveIdx]];
    } else if (targetSegIndices && targetSegIndices.length === 2) {
      const s1 = segments[targetSegIndices[0]];
      const s2 = segments[targetSegIndices[1]];
      if (s1 && s2) {
        const c = curves.find(curve => (curve.segment1 === s1 && curve.segment2 === s2) || (curve.segment1 === s2 && curve.segment2 === s1));
        if (c) targetCurves = [c];
      }
    }
    if (targetCurves.length === 0) {
      targetCurves = curves;
    }

    targetCurves.forEach(curve => {
      if (curve.isStraight()) {
        const p1 = curve.segment1.point;
        const p2 = curve.segment2.point;
        const dir = p2.subtract(p1).normalize(20);
        curve.segment1.handleOut = dir;
        curve.segment2.handleIn = dir.multiply(-1);
      }
    });
  } else if (action === 'split') {
    if (targetSegIndices && targetSegIndices.length > 0) {
      const idx = targetSegIndices[0];
      const seg = segments[idx];
      if (seg) {
        const subpath = seg.path || paperPath;
        const PathClass = paperScope ? paperScope.Path : (paperPath.project?.paper?.Path || paperPath.constructor);
        const CompoundClass = paperScope ? paperScope.CompoundPath : (paperPath.project?.paper?.CompoundPath);

        if (subpath.closed) {
          // Closed shape: split point opens the shape into two overlapping endpoints at (x, y)
          const segIdxInSub = subpath.segments.indexOf(seg);
          if (segIdxInSub !== -1) {
            if (segIdxInSub > 0) {
              const moved = subpath.segments.splice(0, segIdxInSub);
              subpath.segments.push(...moved);
            }
            // Create a duplicate endpoint segment at the exact same location
            const endSeg = subpath.segments[0].clone();
            subpath.segments[0].handleIn = new Point(0, 0);
            endSeg.handleOut = new Point(0, 0);
            subpath.segments.push(endSeg);
            subpath.closed = false;

            const allSegs = getPaperSegments(paperPath);
            const splitIndex = allSegs.indexOf(subpath.segments[0]);
            addedSegIdx = splitIndex >= 0 ? splitIndex : 0;
          }
        } else {
          // Open path: split interior node into two independent subpath contours meeting at (x, y)
          const segIdxInSub = subpath.segments.indexOf(seg);
          if (segIdxInSub > 0 && segIdxInSub < subpath.segments.length - 1) {
            const segs1 = [];
            for (let i = 0; i <= segIdxInSub; i++) {
              segs1.push(subpath.segments[i].clone());
            }
            segs1[segs1.length - 1].handleOut = new Point(0, 0);

            const segs2 = [];
            for (let i = segIdxInSub; i < subpath.segments.length; i++) {
              segs2.push(subpath.segments[i].clone());
            }
            segs2[0].handleIn = new Point(0, 0);

            const path1 = new PathClass({ segments: segs1, closed: false });
            const path2 = new PathClass({ segments: segs2, closed: false });

            let finalPath = paperPath;
            if (paperPath.className === 'CompoundPath') {
              subpath.remove();
              paperPath.addChild(path1);
              paperPath.addChild(path2);
              finalPath = paperPath;
            } else if (CompoundClass) {
              finalPath = new CompoundClass({ children: [path1, path2] });
            }
            const allSegs = getPaperSegments(finalPath);
            const splitIndex = allSegs.indexOf(path2.segments[0]);
            addedSegIdx = splitIndex >= 0 ? splitIndex : (segs1.length - 1);
            return { paperPath: finalPath, addedSegIdx };
          }
        }
      }
    }
  }
  return { paperPath, addedSegIdx };
};

export const removeCurveFromPath = (paperPath, curveToDelete, paperScope) => {
  if (!paperPath || !curveToDelete) return paperPath;
  const Point = paperScope ? paperScope.Point : (paperPath.project?.paper?.Point || paperScope?.Point);
  const subpath = curveToDelete.path || paperPath;

  const seg1 = curveToDelete.segment1;
  const seg2 = curveToDelete.segment2;

  if (seg1) seg1.handleOut = new Point(0, 0);
  if (seg2) seg2.handleIn = new Point(0, 0);

  const isClosed = subpath.closed || paperPath.closed;

  if (isClosed) {
    // ── CLOSED SUBPATH: Open the path by removing curveToDelete ──
    const segments = subpath.segments || [];
    const idx2 = segments.indexOf(seg2);
    const idx1 = segments.indexOf(seg1);

    if (idx2 !== -1 && idx1 !== -1) {
      const count = segments.length;
      const reordered = [];

      // Reorder starting at seg2 and ending at seg1
      for (let i = 0; i < count; i++) {
        const seg = segments[(idx2 + i) % count];
        reordered.push({
          point: seg.point.clone(),
          handleIn: seg.handleIn ? seg.handleIn.clone() : new Point(0, 0),
          handleOut: seg.handleOut ? seg.handleOut.clone() : new Point(0, 0),
          nodeType: seg.nodeType
        });
      }

      // First segment (seg2) has no handleIn; Last segment (seg1) has no handleOut
      reordered[0].handleIn = new Point(0, 0);
      reordered[reordered.length - 1].handleOut = new Point(0, 0);

      subpath.closed = false;
      subpath.removeSegments();
      reordered.forEach(s => {
        const added = subpath.add(s.point);
        added.handleIn = s.handleIn;
        added.handleOut = s.handleOut;
        added.nodeType = s.nodeType;
      });
    }
  } else {
    // ── OPEN SUBPATH ──
    const segments = subpath.segments || [];
    const idx1 = segments.indexOf(seg1);
    const idx2 = segments.indexOf(seg2);

    if ((idx1 === 0 && idx2 === 1) || (idx1 === 1 && idx2 === 0)) {
      // First curve of open subpath: remove start segment (index 0)
      if (segments[0]) segments[0].remove();
    } else if ((idx1 === segments.length - 2 && idx2 === segments.length - 1) || (idx1 === segments.length - 1 && idx2 === segments.length - 2)) {
      // Last curve of open subpath: remove end segment (last index)
      if (segments[segments.length - 1]) segments[segments.length - 1].remove();
    } else if (idx1 !== -1 && idx2 !== -1) {
      // Interior curve of open subpath: split at curveToDelete into TWO separate subpaths
      const minIdx = Math.min(idx1, idx2);
      const maxIdx = Math.max(idx1, idx2);

      const segs1 = segments.slice(0, minIdx + 1).map(s => ({
        point: s.point.clone(),
        handleIn: s.handleIn ? s.handleIn.clone() : new Point(0, 0),
        handleOut: s.handleOut ? s.handleOut.clone() : new Point(0, 0),
        nodeType: s.nodeType
      }));
      segs1[segs1.length - 1].handleOut = new Point(0, 0);

      const segs2 = segments.slice(maxIdx).map(s => ({
        point: s.point.clone(),
        handleIn: s.handleIn ? s.handleIn.clone() : new Point(0, 0),
        handleOut: s.handleOut ? s.handleOut.clone() : new Point(0, 0),
        nodeType: s.nodeType
      }));
      segs2[0].handleIn = new Point(0, 0);

      const CompoundPath = paperScope ? paperScope.CompoundPath : (paperPath.project?.paper?.CompoundPath || paperScope?.CompoundPath);
      const Path = paperScope ? paperScope.Path : (paperPath.project?.paper?.Path || paperPath.constructor);

      if (segs1.length >= 2 && segs2.length >= 2 && Path) {
        const p1 = new Path({ closed: false });
        segs1.forEach(s => {
          const added = p1.add(s.point);
          added.handleIn = s.handleIn;
          added.handleOut = s.handleOut;
          added.nodeType = s.nodeType;
        });

        const p2 = new Path({ closed: false });
        segs2.forEach(s => {
          const added = p2.add(s.point);
          added.handleIn = s.handleIn;
          added.handleOut = s.handleOut;
          added.nodeType = s.nodeType;
        });

        if (paperPath.className === 'CompoundPath') {
          subpath.remove();
          paperPath.addChild(p1);
          paperPath.addChild(p2);
        } else if (CompoundPath) {
          const compound = new CompoundPath({ children: [p1, p2] });
          mergeMeetingNodes(compound, paperScope);
          return compound;
        }
      } else if (segs1.length >= 2) {
        subpath.removeSegments();
        segs1.forEach(s => {
          const added = subpath.add(s.point);
          added.handleIn = s.handleIn;
          added.handleOut = s.handleOut;
          added.nodeType = s.nodeType;
        });
      } else if (segs2.length >= 2) {
        subpath.removeSegments();
        segs2.forEach(s => {
          const added = subpath.add(s.point);
          added.handleIn = s.handleIn;
          added.handleOut = s.handleOut;
          added.nodeType = s.nodeType;
        });
      }
    }
  }

  mergeMeetingNodes(paperPath, paperScope);
  return paperPath;
};

/**
 * Delete either the selected control handle point (retract handle), selected line segment, or center node point.
 * Returns { sideDeleted: 'in' | 'out' | 'point' | 'line' | null, paperPath }
 */
export const deleteSelectedNodeOrHandle = (paperPath, targetSegIndices, selectedHandleSide, paperScope, targetCurveIdx = null) => {
  if (!paperPath) return { sideDeleted: null, paperPath };

  const Point = paperScope ? paperScope.Point : paperPath.project?.paper?.Point;
  const segments = getPaperSegments(paperPath);
  const curves = getPaperCurves(paperPath);
  let sideDeleted = null;

  if (selectedHandleSide === 'line' || selectedHandleSide === 'segment') {
    sideDeleted = 'line';
    let curveToDelete = null;
    if (targetCurveIdx !== null && targetCurveIdx !== undefined && curves[targetCurveIdx]) {
      curveToDelete = curves[targetCurveIdx];
    } else if (targetSegIndices && targetSegIndices.length >= 2) {
      const s1 = segments[targetSegIndices[0]];
      const s2 = segments[targetSegIndices[1]];
      if (s1 && s2) {
        curveToDelete = curves.find(c => (c.segment1 === s1 && c.segment2 === s2) || (c.segment1 === s2 && c.segment2 === s1));
      }
    }

    if (curveToDelete) {
      const resultPath = removeCurveFromPath(paperPath, curveToDelete, paperScope);
      if (resultPath) paperPath = resultPath;
    }
  } else if (selectedHandleSide === 'in' || selectedHandleSide === 'out') {
    sideDeleted = selectedHandleSide;
    if (targetSegIndices) {
      targetSegIndices.forEach(idx => {
        const seg = segments[idx];
        if (seg) {
          if (selectedHandleSide === 'in') {
            seg.handleIn = new Point(0, 0);
          } else if (selectedHandleSide === 'out') {
            seg.handleOut = new Point(0, 0);
          }
          if (seg.handleIn.isZero() && seg.handleOut.isZero()) {
            seg.nodeType = 'sharp';
          } else {
            seg.nodeType = 'custom';
          }
        }
      });
    }
  } else {
    sideDeleted = 'point';
    if (targetSegIndices) {
      const sorted = [...targetSegIndices].sort((a, b) => b - a);
      sorted.forEach(idx => {
        if (segments[idx]) {
          segments[idx].remove();
        }
      });
      mergeMeetingNodes(paperPath, paperScope);
    }
  }

  return { sideDeleted, paperPath };
};

/**
 * Executes vector path actions (sharp, smooth, join, split, add-point, delete-node, delete-line)
 * on a target path element and handles paperPath mutation, overlay redraw, and path deletion.
 */
export const processVectorPathAction = (action, {
  pathEl,
  pageIdx,
  paperScope,
  createPaperPath,
  bakeTransformIntoPaperPath,
  deleteSelectedNodeOrHandle,
  executeVectorPathAction,
  cleanPaperPathData,
  getPaperSegments,
  exitNodeEditMode,
  saveModifiedPageHtml,
  setSelectedLayerId,
  drawNodeEditOverlay,
  enterNodeEditMode,
  updatePageHtml,
  refs: {
    nodeEditPaperPathRef,
    nodeEditSelectedSegIndicesRef,
    nodeEditSelectedSegIdxRef,
    nodeEditSelectedHandleSideRef,
    nodeEditSelectedCurveIdxRef,
    nodeEditSplitSegIdxRef,
    nodeEditModeRef
  }
}) => {
  if (!action || !pathEl || !pathEl.getAttribute('d')) return;

  try {
    paperScope.activate();
    const dStrCurrent = pathEl.getAttribute('d');
    if (!dStrCurrent) return;

    let paperPath = createPaperPath(dStrCurrent);
    bakeTransformIntoPaperPath(pathEl, paperPath, paperScope);
    if (nodeEditPaperPathRef) nodeEditPaperPathRef.current = paperPath;

    let targetSegIndices = [];
    if (nodeEditSelectedSegIndicesRef?.current && nodeEditSelectedSegIndicesRef.current.size > 0) {
      targetSegIndices = Array.from(nodeEditSelectedSegIndicesRef.current);
    } else if (nodeEditSelectedSegIdxRef?.current !== null && nodeEditSelectedSegIdxRef?.current !== undefined) {
      targetSegIndices = [nodeEditSelectedSegIdxRef.current];
    } else {
      const segments = getPaperSegments(paperPath);
      targetSegIndices = segments.map((_, i) => i);
    }

    if (action === 'delete-node' || action === 'delete-line') {
      const { sideDeleted, paperPath: updatedPath } = deleteSelectedNodeOrHandle(
        paperPath,
        targetSegIndices,
        nodeEditSelectedHandleSideRef?.current,
        paperScope,
        nodeEditSelectedCurveIdxRef?.current
      );
      if (updatedPath) {
        paperPath = updatedPath;
        if (nodeEditPaperPathRef) nodeEditPaperPathRef.current = updatedPath;
      }
      if (sideDeleted === 'in' || sideDeleted === 'out') {
        if (nodeEditSelectedHandleSideRef) nodeEditSelectedHandleSideRef.current = 'point';
      } else {
        if (nodeEditSelectedHandleSideRef) nodeEditSelectedHandleSideRef.current = null;
        if (nodeEditSelectedCurveIdxRef) nodeEditSelectedCurveIdxRef.current = null;
        if (nodeEditSelectedSegIdxRef) nodeEditSelectedSegIdxRef.current = null;
        if (nodeEditSelectedSegIndicesRef) nodeEditSelectedSegIndicesRef.current = new Set();
      }
    } else {
      const res = executeVectorPathAction(
        paperPath,
        action,
        targetSegIndices,
        paperScope,
        nodeEditSelectedCurveIdxRef?.current
      );
      const resultPath = res?.paperPath || res;
      const addedSegIdx = res?.addedSegIdx;
      if (resultPath) {
        paperPath = resultPath;
        if (nodeEditPaperPathRef) nodeEditPaperPathRef.current = resultPath;
      }
      if (action === 'add-point' && addedSegIdx !== null && addedSegIdx !== undefined && addedSegIdx >= 0) {
        if (nodeEditSelectedHandleSideRef) nodeEditSelectedHandleSideRef.current = 'point';
        if (nodeEditSelectedCurveIdxRef) nodeEditSelectedCurveIdxRef.current = null;
        if (nodeEditSelectedSegIdxRef) nodeEditSelectedSegIdxRef.current = addedSegIdx;
        if (nodeEditSelectedSegIndicesRef) nodeEditSelectedSegIndicesRef.current = new Set([addedSegIdx]);
      } else if (action === 'join') {
        const selectIdx = (targetSegIndices && targetSegIndices.length > 0) ? targetSegIndices[0] : 0;
        if (nodeEditSelectedHandleSideRef) nodeEditSelectedHandleSideRef.current = 'point';
        if (nodeEditSelectedCurveIdxRef) nodeEditSelectedCurveIdxRef.current = null;
        if (nodeEditSelectedSegIdxRef) nodeEditSelectedSegIdxRef.current = selectIdx;
        if (nodeEditSelectedSegIndicesRef) nodeEditSelectedSegIndicesRef.current = new Set([selectIdx]);
        if (nodeEditSplitSegIdxRef) nodeEditSplitSegIdxRef.current = null;
      } else if (action === 'split') {
        const selectIdx = (addedSegIdx !== null && addedSegIdx !== undefined && addedSegIdx >= 0)
          ? addedSegIdx
          : ((targetSegIndices && targetSegIndices.length > 0) ? targetSegIndices[0] : 0);
        if (nodeEditSelectedHandleSideRef) nodeEditSelectedHandleSideRef.current = 'point';
        if (nodeEditSelectedCurveIdxRef) nodeEditSelectedCurveIdxRef.current = null;
        if (nodeEditSelectedSegIdxRef) nodeEditSelectedSegIdxRef.current = selectIdx;
        if (nodeEditSelectedSegIndicesRef) nodeEditSelectedSegIndicesRef.current = new Set([selectIdx]);
        if (nodeEditSplitSegIdxRef) nodeEditSplitSegIdxRef.current = selectIdx;
      }
    }

    const dStr = cleanPaperPathData(paperPath);
    const remainingSegments = getPaperSegments(paperPath);
    let allCollapsed = false;
    if (remainingSegments.length > 0) {
      const firstPt = remainingSegments[0].point;
      allCollapsed = remainingSegments.every(s => Math.hypot(s.point.x - firstPt.x, s.point.y - firstPt.y) < 2.0);
    }

    const svgEl = pathEl.ownerSVGElement;
    if (remainingSegments.length <= 1 || allCollapsed || !dStr || dStr.trim() === '') {
      pathEl.remove();
      if (typeof exitNodeEditMode === 'function') exitNodeEditMode();
      if (svgEl && typeof updatePageHtml === 'function' && typeof saveModifiedPageHtml === 'function') {
        saveModifiedPageHtml(pageIdx, svgEl);
      }
      if (typeof setSelectedLayerId === 'function') setSelectedLayerId(null);
      return;
    }

    pathEl.setAttribute('d', dStr);
    if (nodeEditModeRef?.current) {
      if (typeof drawNodeEditOverlay === 'function') drawNodeEditOverlay(pathEl, paperPath, pageIdx);
    } else {
      if (typeof enterNodeEditMode === 'function') enterNodeEditMode(pathEl, pageIdx);
    }

    if (action === 'add-point' || action === 'join' || action === 'split') {
      const newIdx = nodeEditSelectedSegIdxRef?.current || 0;
      window.dispatchEvent(new CustomEvent('node-selected', { detail: { nodeType: 'sharp', segIdx: newIdx, selectedCount: 1, canJoin: false, isLineSelected: false } }));
    } else if (['sharp', 'smooth', 'balanced', 'custom'].includes(action)) {
      window.dispatchEvent(new CustomEvent('node-selected', { detail: { nodeType: action, selectedCount: 1, canJoin: false, isLineSelected: false } }));
    } else if (action === 'curve-line') {
      // After converting straight to curve, reflect new type in the sidebar
      const curveSegs = getPaperSegments(paperPath);
      const curveSegIdx = nodeEditSelectedSegIdxRef?.current;
      const curveSeg = (curveSegIdx !== null && curveSegIdx !== undefined) ? curveSegs[curveSegIdx] : null;
      let newCurveType = 'smooth';
      if (curveSeg) {
        newCurveType = curveSeg.nodeType || 'smooth';
      }
      window.dispatchEvent(new CustomEvent('node-selected', { detail: { nodeType: newCurveType, selectedCount: 1, canJoin: false, isLineSelected: false } }));
    }

    if (pathEl.ownerSVGElement && typeof updatePageHtml === 'function' && typeof saveModifiedPageHtml === 'function') {
      saveModifiedPageHtml(pageIdx, pathEl.ownerSVGElement);
    }
  } catch (err) {
    console.warn('[VectorPathAction] Error executing action:', action, err);
  }
};
