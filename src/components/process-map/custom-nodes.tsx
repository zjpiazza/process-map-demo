import { Handle, Position, NodeProps, NodeTypes } from "reactflow";
import { cn } from "../../lib/utils";

interface NodeData {
  label: string;
  onClick: (data: NodeData) => void;
  inputs?: { id: string; position: Position }[];
  outputs?: { id: string; position: Position }[];
}

// This is a generic, shared custom node component that can render different styles
// and handle dynamic connection points (handles) based on the data provided.
export const CustomNode = ({ data, selected, type }: NodeProps<NodeData>) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onClick?.(data);
  };

  // Special rendering for the diamond-shaped decision node to correctly
  // position handles on the corners of the bounding box, not the rotated shape.
  if (type === "decision") {
    return (
      <div
        className="w-28 h-28 relative flex items-center justify-center"
        onClick={handleClick}
      >
        {/* Input handles are positioned absolutely on the parent container */}
        {data.inputs?.map((input) => (
          <Handle
            key={input.id}
            type="target"
            position={input.position}
            id={input.id}
            className="!w-3 !h-3 !bg-orange-500"
            style={{
              // This style correctly places the handle on the corner of the non-rotated bounding box
              [input.position]: "-6px",
            }}
          />
        ))}
        {/* Output handles are also positioned absolutely */}
        {data.outputs?.map((output) => (
          <Handle
            key={output.id}
            type="source"
            position={output.position}
            id={output.id}
            className="!w-3 !h-3 !bg-orange-500"
            style={{
              [output.position]: "-6px",
            }}
          />
        ))}
        {/* This is the visible diamond shape, rotated inside the container */}
        <div
          className={cn(
            "w-full h-full bg-white border-2 flex items-center justify-center cursor-pointer transition-all duration-200 transform rotate-45",
            selected
              ? "border-orange-500 shadow-lg"
              : "border-gray-300 hover:border-orange-400",
          )}
        >
          <div className="transform -rotate-45 text-xs font-semibold text-center text-gray-800">
            {data.label}
          </div>
        </div>
      </div>
    );
  }

  // Standard rendering for all other node types (process, startEnd, etc.)
  const nodeClass = cn(
    "shadow-sm rounded-md bg-white border relative cursor-pointer transition-all duration-200 flex items-center justify-center text-xs font-semibold text-center text-gray-800",
    selected && "shadow-lg",
    type === "process" &&
      `w-44 h-16 px-3 py-2 ${selected ? "border-blue-500" : "border-gray-300 hover:border-blue-400"}`,
    type === "startEnd" &&
      `w-28 h-16 px-3 py-2 rounded-full bg-green-100 text-green-800 ${selected ? "border-green-500" : "border-green-300 hover:border-green-400"}`,
  );

  return (
    <div className={nodeClass} onClick={handleClick}>
      {data.inputs?.map((input) => (
        <Handle
          key={input.id}
          type="target"
          position={input.position}
          id={input.id}
          className="w-2 h-2 !bg-gray-500"
        />
      ))}
      <div>{data.label}</div>
      {data.outputs?.map((output) => (
        <Handle
          key={output.id}
          type="source"
          position={output.position}
          id={output.id}
          className="w-2 h-2 !bg-gray-500"
        />
      ))}
    </div>
  );
};

// Export the node types map to be used in any React Flow instance
export const nodeTypes: NodeTypes = {
  process: CustomNode,
  decision: CustomNode,
  startEnd: CustomNode,
};
