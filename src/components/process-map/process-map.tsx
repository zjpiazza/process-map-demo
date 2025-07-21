import React, { useCallback, useEffect, useMemo, useLayoutEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  useReactFlow,
  ConnectionMode,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { nodeTypes } from "./custom-nodes";
import { useProcessMapStore } from "../../stores/process-map-store";
import { ProcessMapItem, ProcessPhase } from "../../types/process-map";
import { Badge } from "../ui/badge";

interface ProcessMapProps {
  phases: ProcessPhase[];
  items: ProcessMapItem[];
  selectedItemId?: string;
  onItemClick?: (item: ProcessMapItem) => void;
  onItemSelect?: (itemId: string | null) => void;
  renderItem?: (item: ProcessMapItem) => React.ReactNode;
  className?: string;
}

export function ProcessMap({
  phases,
  items,
  selectedItemId,
  onItemClick,
  onItemSelect,
  renderItem,
  className = "",
}: ProcessMapProps) {
  const {
    searchTerm,
    expandedView,
    getZoomConfig,
    initialize,
    initialized,
    nodes: sharedNodes,
    edges: sharedEdges,
  } = useProcessMapStore();

  const { fitView } = useReactFlow();

  // Initialize the store on mount
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [items, searchTerm]);

  // Group items by phase
  const itemsByPhase = useMemo(() => {
    console.log("ProcessMap: Grouping items by phase", {
      itemsLength: items.length,
      filteredItemsLength: filteredItems.length,
      phases: phases.map((p) => p.id),
    });

    const grouped: Record<string, ProcessMapItem[]> = {};
    phases.forEach((phase) => {
      grouped[phase.id] = [];
    });

    filteredItems.forEach((item) => {
      console.log("ProcessMap: Processing item", {
        id: item.id,
        title: item.title,
        phaseId: item.phaseId,
      });
      if (grouped[item.phaseId]) {
        grouped[item.phaseId].push(item);
      }
    });

    console.log("ProcessMap: Grouped items", grouped);
    return grouped;
  }, [filteredItems, phases, items]);

  // Use ReactFlow's built-in state management
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Initialize and update nodes based on view mode
  useEffect(() => {
    if (sharedNodes.length > 0) {
      setNodes(sharedNodes);
      setEdges(sharedEdges);
    }
  }, [sharedNodes, sharedEdges, setNodes, setEdges]);

  // Fit view when view changes
  useLayoutEffect(() => {
    const zoomConfig = getZoomConfig();
    setTimeout(() => fitView({ ...zoomConfig, duration: 300 }), 100);
  }, [expandedView, fitView, getZoomConfig]);

  const handleItemClick = useCallback(
    (item: ProcessMapItem) => {
      if (onItemClick) {
        onItemClick(item);
      }
      if (onItemSelect) {
        onItemSelect(item.id);
      }
    },
    [onItemClick, onItemSelect],
  );

  const defaultRenderItem = useCallback(
    (item: ProcessMapItem) => (
      <div
        key={item.id}
        className={`p-3 mb-2 rounded-lg border cursor-pointer transition-all ${
          selectedItemId === item.id
            ? "border-blue-500 bg-blue-50 shadow-md"
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
        }`}
        onClick={() => handleItemClick(item)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sm text-gray-900 mb-1">
              {item.title}
            </h4>
            {item.description && (
              <p className="text-xs text-gray-600 mb-2">{item.description}</p>
            )}
            <div className="flex items-center gap-2">
              <Badge
                variant={item.isActive ? "default" : "secondary"}
                className="text-xs"
              >
                {item.category}
              </Badge>
              {!item.isActive && (
                <Badge variant="outline" className="text-xs">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    [selectedItemId, handleItemClick],
  );

  const renderItemContent = renderItem || defaultRenderItem;

  // Calculate total width and proportional widths for phases
  const totalWidth = useMemo(() => {
    return phases.reduce((sum, phase) => sum + phase.width, 0);
  }, [phases]);

  const getPhaseWidthPercentage = useCallback(
    (phase: ProcessPhase) => {
      return (phase.width / totalWidth) * 100;
    },
    [totalWidth],
  );

  // Calculate dynamic heights based on expandedView
  const getViewHeights = () => {
    switch (expandedView) {
      case "process-map":
        return { diagramHeight: "70%", listHeight: "30%" };
      case "workflow-list":
        return { diagramHeight: "30%", listHeight: "70%" };
      case "balanced":
      default:
        return { diagramHeight: "50%", listHeight: "50%" };
    }
  };

  const { diagramHeight, listHeight } = getViewHeights();

  return (
    <div className={`h-full w-full flex flex-col ${className}`}>
      {/* ReactFlow Diagram Section */}
      <div
        className="relative border-b border-gray-200"
        style={{ height: diagramHeight }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          connectionMode={ConnectionMode.Loose}
          fitView
          minZoom={0.5}
          maxZoom={2}
          className="bg-gray-50"
          nodesDraggable={expandedView !== "workflow-list"}
          nodesConnectable={expandedView !== "workflow-list"}
          elementsSelectable={expandedView !== "workflow-list"}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} color="#e5e7eb" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {/* Phase columns with item lists */}
      <div className="flex-1 flex flex-col" style={{ height: listHeight }}>
        {/* Process Map Header */}
        <div className="flex-shrink-0 border-b border-gray-200">
          <div className="flex">
            {phases.map((phase) => (
              <div
                key={phase.id}
                className={`bg-gradient-to-r ${phase.color} border-r border-gray-300 flex items-center justify-center h-12`}
                style={{ width: `${getPhaseWidthPercentage(phase)}%` }}
              >
                <h3 className="font-semibold text-gray-800 text-sm">
                  {phase.label}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Process Map Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Phase columns */}
          {phases.map((phase) => (
            <div
              key={phase.id}
              className="border-r border-gray-200 bg-white overflow-y-auto flex-shrink-0"
              style={{ width: `${getPhaseWidthPercentage(phase)}%` }}
            >
              <div className="p-4 space-y-2">
                {itemsByPhase[phase.id]?.map((item) => renderItemContent(item))}
                {itemsByPhase[phase.id]?.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    No items in this phase
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
