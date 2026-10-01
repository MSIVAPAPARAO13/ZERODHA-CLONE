import React from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Apps from "./Apps";
import Funds from "./Funds";
import Holdings from "./Holdings";
import Alerts from "./Alerts";
import TradeJournal from "./TradeJournal";
import TradeReplay from "./TradeReplay";
import PortfolioAnalyst from "./PortfolioAnalyst";
import BehaviorInsights from "./BehaviorInsights";
import Playbooks from "./Playbooks";
import MarketCascade from "./MarketCascade";
import StressStudio from "./StressStudio";
import StrategyLab from "./StrategyLab";
import MarketScanner from "./MarketScanner";
import ResearchCopilot from "./ResearchCopilot";
import Events from "./Events";
import Insights from "./Insights";
import InterviewDemo from "./InterviewDemo";

import Orders from "./Orders";
import Positions from "./Positions";
import Summary from "./Summary";
import WatchList from "./WatchList";
import { GeneralContextProvider } from "./GeneralContext";

const Dashboard = () => {
  return (
    <GeneralContextProvider>
      <div className="app-content-row">
        <Toaster position="bottom-right" />
        <div className="app-page">
          <Routes>
            <Route exact path="/" element={<Summary />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/holdings" element={<Holdings />} />
            <Route path="/positions" element={<Positions />} />
            <Route path="/funds" element={<Funds />} />
            <Route path="/apps" element={<Apps />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/journal" element={<TradeJournal />} />
            <Route path="/replay/:id" element={<TradeReplay />} />
            <Route path="/ai-analyst" element={<PortfolioAnalyst />} />
            <Route path="/behavior-insights" element={<BehaviorInsights />} />
            <Route path="/playbooks" element={<Playbooks />} />
            <Route path="/cascade" element={<MarketCascade />} />
            <Route path="/market-events" element={<MarketCascade />} />
            <Route path="/stress-studio" element={<StressStudio />} />
            <Route path="/scenarios" element={<StressStudio />} />
            <Route path="/strategy-lab" element={<StrategyLab />} />
            <Route path="/strategies" element={<StrategyLab />} />
            <Route path="/scanner" element={<MarketScanner />} />
            <Route path="/market-scanner" element={<MarketScanner />} />
            <Route path="/research" element={<ResearchCopilot />} />
            <Route path="/events" element={<Events />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/demo" element={<InterviewDemo />} />
          </Routes>
        </div>
        <WatchList />
      </div>
    </GeneralContextProvider>
  );
};

export default Dashboard;