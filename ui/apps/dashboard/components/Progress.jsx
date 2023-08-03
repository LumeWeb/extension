import "./Progress.scss";

export default function Progress({ percent }) {
  return (
    <div className="progress">
      <progress value={percent} min="0" max="100" />
      <div className="status">
        <div className="status-text">Loading Network</div>
        <div className="status-percent">{percent}%</div>
      </div>
    </div>
  );
}
