import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import { YearProvider } from "./context/YearContext";

import "./index.css";


ReactDOM.createRoot(
  document.getElementById("root")
).render(

  <React.StrictMode>

    <YearProvider>
      <App />
    </YearProvider>

  </React.StrictMode>

);