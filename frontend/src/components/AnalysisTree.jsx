import { useEffect, useState } from "react";
import axios from "axios";

export default function AnalysisTree({ onSelect }) {
  const [tree, setTree] = useState([]);

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    const res = await axios.get("/api/uploads");
    buildTree(res.data);
  };

  const buildTree = (uploads) => {
    const structure = {};

    uploads.forEach(u => {
      const type = u.directionType?.name || "Unknown";

      if (!structure[type]) structure[type] = {};

      if (type === "Ongoing Batches") {
        const program = u.program?.name || "No Program";
        const batch = u.batch?.name || "No Batch";

        if (!structure[type][program]) structure[type][program] = [];
        structure[type][program].push(batch);
      } else if (type === "Workshops") {
        const program = u.program?.name || "Workshop";
        if (!structure[type][program]) structure[type][program] = [];
      } else if (type === "New Registration") {
        const month = u.month || "Unknown";
        if (!structure[type][month]) structure[type][month] = [];
      }
    });

    setTree(structure);
  };

  return (
    <div className="tree-card">
      <h3>Analysis Navigator</h3>

      {Object.keys(tree).map(type => (
        <div key={type} className="tree-section">
          <div
            className="tree-node root"
            onClick={() => onSelect({ type })}
          >
            {type}
          </div>

          {Object.keys(tree[type]).map(level2 => (
            <div key={level2} className="tree-level2">
              <div
                className="tree-node level2"
                onClick={() => onSelect({ type, level2 })}
              >
                {level2}
              </div>

              {tree[type][level2].map((level3, i) => (
                <div
                  key={i}
                  className="tree-node level3"
                  onClick={() =>
                    onSelect({ type, level2, level3 })
                  }
                >
                  {level3}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}