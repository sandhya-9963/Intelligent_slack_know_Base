import React, { useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Upload from "./pages/Upload.jsx";
import Chat from "./pages/Chat.jsx";
import Explorer from "./pages/Explorer.jsx";

export default function App() {
  const [scope, setScope] = useState("org");

  return (
    <HashRouter>
      <div className="flex h-screen w-screen bg-ink text-white font-body overflow-hidden">
        <Sidebar scope={scope} setScope={setScope} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard scope={scope} />} />
            <Route path="/upload" element={<Upload scope={scope} />} />
            <Route path="/chat" element={<Chat scope={scope} />} />
            <Route path="/explorer" element={<Explorer scope={scope} />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
