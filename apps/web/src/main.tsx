import { createRoot } from "react-dom/client";

const root = document.getElementById("root");
if (!root) throw new Error("Application root is missing");
createRoot(root).render(
  <main>
    <h1>AdigunEplanAI</h1>
    <p>Hephzibah Behulah · HB Elektroniker</p>
    <p>Application foundation</p>
  </main>,
);
