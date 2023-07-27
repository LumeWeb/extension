import "./Network.scss";
import { useEffect, useState } from "react";
import classNames from "classnames";
import { getNetworkModuleStatus } from "@lumeweb/libkernel";

export default function Network({ module }) {
  let [ready, setReady] = useState(false);
  let [sync, setSync] = useState(null);
  let [peers, setPeers] = useState(0);

  useEffect(() => {
    const destroy = getNetworkModuleStatus((data) => {
      setReady(data.ready);
      setSync(data.sync);
      setPeers(data.peers);
    }, module);

    return () => destroy?.();
  }, [module]);

  return (
    <li className={classNames({ success: ready, loading: !ready })}>
      <div className="network">
        <span
          className={classNames("icon", {
            "icon-success": ready,
            "icon-wait": !ready,
          })}
        />
        Network
      </div>
      {ready ? (
        <div className="status">Synced</div>
      ) : (
        <div className="status">Syncing</div>
      )}
    </li>
  );
}
