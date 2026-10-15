import { createRoot } from "react-dom/client";
import Home from "@/app/page";
import { setTransport } from "@/lib/transport";
import { claudeTransport } from "./claudeTransport";

setTransport(claudeTransport);
createRoot(document.getElementById("root")!).render(<Home />);
