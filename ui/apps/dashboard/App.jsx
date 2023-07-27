import "./App.scss";
import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Art from "./components/Art.jsx";
import { waitForConnected } from "../../../shared/util.ts";
import { createClient } from "@lumeweb/kernel-network-registry-client";
import Network from "./components/Network.jsx";
import Footer from "./components/Footer.jsx";
import classNames from "classnames";

const networkClient = createClient();

async function getNetworks() {
  let types = {};

  await waitForConnected(async () => {
    const allTypes = await networkClient.getTypes();

    for (const type of allTypes) {
      types[type] = await networkClient.getNetworksByType(type);
    }
  });

  return types;
}

export default function App() {
  let [connected, setConnected] = useState(false);
  let [networks, setNetworks] = useState({});
  let [showConnected, setShowConnected] = useState(false);
  let [artPulse, setArtPulse] = useState(false);

  useEffect(() => {
    getNetworks().then((networks) => {
      setConnected(true);
      setNetworks(networks);
    });
  });

  useEffect(() => {
    if (connected) {
      const pulseTimeout = setTimeout(() => {
        setArtPulse(true);
        setTimeout(() => {
          setArtPulse(false);
          setShowConnected(true);
        }, 1000);
      }, 1000);

      return () => clearTimeout(pulseTimeout);
    }
  }, [connected]);

  return (
    <main>
      <Header connected={connected} />
      <Art connected={showConnected} pulse={artPulse} />
      <div className={classNames("content", { connected: showConnected })}>
        <h3>All set.</h3>
        <div className="content-grid">
          {showConnected &&
            Object.entries(networks).map(([type, networks]) => {
              if (!networks.length) {
                return <></>;
              }
              return (
                <div>
                  <h4>{type} Networks</h4>
                  <ul>
                    {networks.map((network) => (
                      <Network module={network} />
                    ))}
                  </ul>
                </div>
              );
            })}
        </div>
      </div>
      <Footer connected={connected} />
    </main>
  );
}
