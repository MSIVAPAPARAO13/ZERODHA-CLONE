import React from "react";

function Universe() {
  return (
    <div className="container mt-5">
      <div className="row text-center">
        <h1 className="pt-5">The Zerodha Universe</h1>
        <p className="my-3 fs-6">
          Extend your trading and investment experience even further with our
          partner platforms
        </p>
      </div>

      <div className="row mt-5 justify-content-center text-center">
        <div className="col-md-4 mb-5">
          <img
            src="media/images/dittoLogo.png"
            alt="dittoLogo"
            style={{ width: "48%" }}
            className="mb-3"
          />
          <p className="text-muted text-small">
            Our asset management venture that is creating simple and transparent
            index funds to help you save for your goals.
          </p>
        </div>

        <div className="col-md-4 mb-5">
          <img
            src="media/images/sensibullLogo.svg"
            alt="sensibullLogo"
            style={{ width: "70%" }}
            className="mb-3"
          />
          <p className="text-muted text-small">
            Options trading platform that lets you create strategies, analyze
            positions, and examine data points like open interest, FII/DII, and
            more.
          </p>
        </div>

        <div className="col-md-4 mb-5">
          <img
            src="media/images/zerodhaFundhouse.png"
            alt="fundhouseLogo"
            style={{ width: "45%" }}
            className="mb-3"
          />
          <p className="text-muted text-small">
            Investment research platform that offers detailed insights on
            stocks, sectors, supply chains, and more.
          </p>
        </div>
      </div>

      <div className="row justify-content-center text-center">
        <div className="col-md-4 mb-5">
          <img
            src="media/images/zerodhaFundhouse.png"
            alt="fundhouse"
            style={{ width: "53%" }}
            className="mb-3"
          />
          <p className="text-muted text-small">
            Our asset management venture that is creating simple and transparent
            index funds to help you save for your goals.
          </p>
        </div>

        <div className="col-md-4 mb-5">
          <img
            src="/media/images/streakLogo.png"
            alt="streakLogo"
            style={{ width: "60%" }}
            className="mb-3"
          />
          <p className="text-muted text-small">
            Systematic trading platform that allows you to create and backtest
            strategies without coding.
          </p>
        </div>

        <div className="col-md-4 mb-5">
          <img
            src="media/images/smallcaseLogo.png"
            alt="smallcaseLogo"
            style={{ width: "60%" }}
            className="mb-3"
          />
          <p className="text-muted text-small">Thematic investment platform</p>
        </div>
            <button
          className="p-2 btn btn-primary fs-5 mb-5"
          style={{ width: "20%", margin: "0 auto" }}
        >
          Signup Now
        </button>
      </div>
    </div>
  );
}

export default Universe;
