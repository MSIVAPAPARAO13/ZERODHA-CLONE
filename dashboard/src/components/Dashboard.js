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

import Orders from "./Orders";
import Positions from "./Positions";
import Summary from "./Summary";
import WatchList from "./WatchList";
import { GeneralContextProvider } from "./GeneralContext";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <Toaster position="bottom-right" />
      <GeneralContextProvider>
        <WatchList />
      </GeneralContextProvider>
      <div className="content">
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
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;