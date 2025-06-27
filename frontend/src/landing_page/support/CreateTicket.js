// CreateTicket.jsx
import React from 'react';

function CreateTicket() {
  return (
    <div className="container">
      <div className="row">
        {/* Heading */}
        <h3 className="text-muted fs-2">
          To create a ticket, select a relevant topic
        </h3>

        {/* 1 ▸ Account Opening */}
        <div className="col-12 col-md-6 col-lg-4 pt-5 mt-2 mb-2">
          <h4>➕ Account Opening</h4>
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Getting started</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Online</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Offline</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Charges</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Company, Partnership and HUF</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Non Resident Indian (NRI)</a><br />
        </div>

        {/* 2 ▸ Your Zerodha Account */}
        <div className="col-12 col-md-6 col-lg-4 pt-5 mt-2 mb-2">
          <h4>👤 Your Zerodha Account</h4>
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Login credentials</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Your Profile</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Account modification and segment addition</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>CMR &amp; DP ID</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Nomination</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Transfer and conversion of shares</a><br />
        </div>

        {/* 3 ▸ Trading and Markets */}
        <div className="col-12 col-md-6 col-lg-4 pt-5 mt-2 mb-2">
          <h4>📈 Trading and Markets</h4>
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Trading FAQs</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Kite</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Margins</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Product and order types</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Corporate actions</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Kite features</a><br />
        </div>

        {/* 4 ▸ Funds */}
        <div className="col-12 col-md-6 col-lg-4 pt-5 mt-2 mb-2">
          <h4>💰 Funds</h4>
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Fund withdrawal</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Adding funds</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Adding bank accounts</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>eMandates</a><br />
        </div>

        {/* 5 ▸ Console */}
        <div className="col-12 col-md-6 col-lg-4 pt-5 mt-2 mb-2">
          <h4>💻 Console</h4>
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>IPO</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Portfolio</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Funds statement</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Profile</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Reports</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Referral program</a><br />
        </div>

        {/* 6 ▸ Coin */}
        <div className="col-12 col-md-6 col-lg-4 pt-5 mt-2 mb-2">
          <h4>🪙 Coin</h4>
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Understanding mutual funds and Coin</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Coin app</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Coin web</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>Transactions and reports</a><br />
          <a href="#" style={{ textDecoration: 'none', lineHeight: '2.5' }}>National Pension Scheme (NPS)</a><br />
        </div>
      </div>
    </div>
  );
}

export default CreateTicket;
