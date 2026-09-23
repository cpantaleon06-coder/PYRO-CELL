import { useEffect, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { Landing } from "./components/Landing";

/** Ruteo mínimo por hash, sin dependencias: la landing da contexto en `/` y el
 *  dashboard vive en `#/dashboard`, de modo que ambos son enlazables y el botón
 *  "atrás" del navegador funciona. */
function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

function App() {
  const hash = useHashRoute();
  const isDashboard = hash.startsWith("#/dashboard");

  // Cada cambio de vista arranca arriba; si no, se hereda el scroll de la landing.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [isDashboard]);

  return isDashboard ? (
    <Dashboard onBack={() => (window.location.hash = "")} />
  ) : (
    <Landing onEnter={() => (window.location.hash = "#/dashboard")} />
  );
}

export default App;
