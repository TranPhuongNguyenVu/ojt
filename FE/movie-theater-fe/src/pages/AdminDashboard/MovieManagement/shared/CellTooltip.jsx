import { useRef, useState } from "react";
import { createPortal } from "react-dom";

const CellTooltip = ({ items, renderItem, ariaLabel, children }) => {
  const triggerRef = useRef(null);
  const [pos, setPos] = useState(null);

  const show = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ top: rect.bottom + 6, left: rect.left });
  };
  const hide = () => setPos(null);

  if (!items || items.length === 0) {
    return <>{children}</>;
  }

  return (
    <div
      ref={triggerRef}
      tabIndex={0}
      aria-label={ariaLabel}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className="outline-none rounded focus-visible:ring-2 focus-visible:ring-[#C00000]"
    >
      {children}
      {pos &&
        createPortal(
          <div
            role="tooltip"
            style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
            className="max-w-xs rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-lg flex flex-wrap gap-1"
          >
            {items.map((item, i) => (
              <span key={i} className="whitespace-nowrap">
                {renderItem ? renderItem(item) : item}
                {i < items.length - 1 ? "," : ""}
              </span>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

export default CellTooltip;
