"use client";

import { useEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

const NODE_BATCH_INTERVAL_MS = 3200;
const NODE_LIFETIME_MS = 6000;

/**
 * A structured technical grid for the hero.
 *
 * Its lines stay fixed while a changing number of unique intersections are
 * selected at random and softly illuminated. No work is tied to scrolling.
 */
export function AmbientBackdrop({ className }) {
  const rootRef = useRef(null);
  const batchSequenceRef = useRef(0);
  const nodeSequenceRef = useRef(0);
  const [nodes, setNodes] = useState([]);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const removalTimers = new Set();
    const occupiedIntersections = new Set();
    let resizeTimer;
    let isFirstBatch = true;

    const spawnNodes = () => {
      const { width, height } = root.getBoundingClientRect();
      const unit = Number.parseFloat(getComputedStyle(root).getPropertyValue("--grid-unit"));
      if (!width || !height || !unit) return;

      const horizontalSteps = Math.ceil(width / unit / 2) + 1;
      const verticalSteps = Math.floor(height / unit);
      const intersections = [];

      // A repeating background positioned at `center` aligns the centre of
      // one grid tile with the centre of the container. Its vertical line is
      // at the tile's leading edge, half a unit to the left of that centre.
      const gridOriginX = width / 2 - unit / 2;

      for (let xStep = -horizontalSteps; xStep <= horizontalSteps; xStep += 1) {
        const x = gridOriginX + xStep * unit;
        if (x < 0 || x > width) continue;

        for (let yStep = 1; yStep <= verticalSteps; yStep += 1) {
          const positionKey = `${xStep}:${yStep}`;
          if (!occupiedIntersections.has(positionKey)) {
            intersections.push({ x, y: yStep * unit, positionKey });
          }
        }
      }

      const count = Math.min(intersections.length, 3 + Math.floor(Math.random() * 5));
      const nextBatchId = batchSequenceRef.current;
      batchSequenceRef.current += 1;
      const nextNodes = [];

      for (let index = 0; index < count; index += 1) {
        const candidateIndex = Math.floor(Math.random() * intersections.length);
        const [position] = intersections.splice(candidateIndex, 1);
        if (!position) break;
        occupiedIntersections.add(position.positionKey);

        const nodeId = nodeSequenceRef.current;
        nodeSequenceRef.current += 1;

        nextNodes.push({
          id: `grid-node-${nodeId}`,
          batchId: nextBatchId,
          ...position,
          delay: Math.floor(Math.random() * 700),
        });
      }

      setNodes((current) =>
        reduced || isFirstBatch ? nextNodes : [...current, ...nextNodes],
      );
      isFirstBatch = false;

      if (!reduced) {
        const timer = window.setTimeout(() => {
          removalTimers.delete(timer);
          nextNodes.forEach((node) => occupiedIntersections.delete(node.positionKey));
          setNodes((current) => current.filter((node) => node.batchId !== nextBatchId));
        }, NODE_LIFETIME_MS);
        removalTimers.add(timer);
      }
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        removalTimers.forEach((timer) => window.clearTimeout(timer));
        removalTimers.clear();
        occupiedIntersections.clear();
        setNodes([]);
        spawnNodes();
      }, 120);
    };

    spawnNodes();
    const interval = reduced
      ? undefined
      : window.setInterval(spawnNodes, NODE_BATCH_INTERVAL_MS);
    const observer = new ResizeObserver(onResize);
    observer.observe(root);

    return () => {
      if (interval) window.clearInterval(interval);
      window.clearTimeout(resizeTimer);
      removalTimers.forEach((timer) => window.clearTimeout(timer));
      observer.disconnect();
    };
  }, [reduced]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        "[--grid-unit:64px] sm:[--grid-unit:80px] lg:[--grid-unit:96px]",
        className,
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--foreground) 9%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--foreground) 9%, transparent) 1px, transparent 1px)",
          backgroundPosition: "center top",
          backgroundSize: "var(--grid-unit) var(--grid-unit)",
        }}
      />

      {nodes.map((node) => (
        <GridNode key={node.id} node={node} />
      ))}
    </div>
  );
}

function GridNode({ node }) {
  return (
    <span
      className="dd-grid-node absolute size-1.5 -translate-1/2 rounded-full"
      style={{ left: node.x, top: node.y, animationDelay: `${node.delay}ms` }}
    />
  );
}
