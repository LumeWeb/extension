import "./Art.scss";
import classNames from "classnames";

export default function Art({ connected, pulse }) {
  return (
    <div
      className={classNames("art-wrapper", {
        pulse,
        connected,
      })}>
      <div className="art-rotate">
        <div className="art">
          <div className="gradient-1" />
          <div className="gradient-2" />
          <div className="gradient-3" />
          <div className="gradient-4" />
        </div>
      </div>
    </div>
  );
}
