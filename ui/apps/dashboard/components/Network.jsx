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
        <div className="status">
          Synced
          <div className="user-count">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
            {peers}
          </div>
        </div>
      ) : (
        <div className="status">Syncing</div>
      )}
    </li>
  );
}
