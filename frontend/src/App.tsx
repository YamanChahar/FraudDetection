import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout/Layout";
import { Overview } from "./pages/Overview";
import { SingleAnalysis } from "./pages/SingleAnalysis";
import { BatchAnalysis } from "./pages/BatchAnalysis";
import { Transactions } from "./pages/Transactions";
import { ModelInsights } from "./pages/ModelInsights";
import { About } from "./pages/About";
import { NotFound } from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="analyze" element={<SingleAnalysis />} />
          <Route path="batch-analysis" element={<BatchAnalysis />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="model-insights" element={<ModelInsights />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
