import "./Network.scss";
import { useEffect, useState } from "react";
import classNames from "classnames";
import { callModule, getNetworkModuleStatus } from "@lumeweb/libkernel";

export default function Network({ module }) {
  let [ready, setReady] = useState(false);
  let [sync, setSync] = useState(null);
  let [peers, setPeers] = useState(0);
  let [name, setName] = useState();

  useEffect(() => {
    const destroy = getNetworkModuleStatus((data) => {
      setReady(data.ready);
      setSync(data.sync);
      setPeers(data.peers);
    }, module);

    callModule(module, "name").then((value) => {
      setName(value);
    });

    return () => destroy?.();
  }, [module]);

  return (
    <li
      className={classNames({ success: ready, loading: !ready })}
      title={sync ? `${sync}% Synced` : ""}>
      <div className="network">
        <span
          className={classNames("icon", {
            "icon-success": ready,
            "icon-wait": !ready,
          })}
        />
        {name} Network
      </div>
      {ready ? (
        <div className="status">Synced</div>
      ) : (
        <div className="status">Syncing</div>
      )}
    </li>
  );
}
