import { Link } from "react-router-dom";

export default function Page({
  heading,
  content,
  start,
  skip,
  next,
  back,
  getStarted,
}) {
  return (
    <div className="page">
      <h1>{heading}</h1>
      <p>{content}</p>
      <div className="btn-wrapper">
        {start && (
          <Link to={start}>
            <button className="btn-main">Begin</button>
          </Link>
        )}
        {skip && (
          <a href={skip} className="btn-main btn-black">
            <button>Skip</button>
          </a>
        )}
        {back && (
          <Link to={back} className="btn-main btn-black">
            <button>Back</button>
          </Link>
        )}
        {next && (
          <Link to={next} className="btn-main">
            <button>Next</button>
          </Link>
        )}
        {getStarted && (
          <a href={getStarted} className="btn-main btn-green">
            <button>Get started</button>
          </a>
        )}
      </div>
    </div>
  );
}
