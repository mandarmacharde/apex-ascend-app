import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// 1. Import the AuthProvider component
// This assumes you created the file at src/contexts/AuthContext.tsx
import { AuthProvider } from "./contexts/AuthContext"; 

createRoot(document.getElementById("root")!).render(
  // 2. Wrap your entire application with the AuthProvider
  <AuthProvider> 
    <App />
  </AuthProvider>
);