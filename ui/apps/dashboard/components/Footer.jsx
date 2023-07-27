import "./Footer.scss";
import classNames from "classnames";
import svgGithub from "../../../assets/icon/github.svg?raw";
import svgDiscord from "../../../assets/icon/discord.svg?raw";
import svgTwitter from "../../../assets/icon/twitter.svg?raw";
import svgFacebook from "../../../assets/icon/facebook.svg?raw";
import parse from "html-react-parser";

export default function Footer({ connected }) {
  return (
    <div className={classNames("socials", { connected })}>
      <a href="#" title="GitHub" className="github-logo">
        {parse(svgGithub)}
      </a>
      <a href="#" title="Discord" className="discord-logo">
        {parse(svgDiscord)}
      </a>
      <a href="#" title="Twitter" className="twitter-logo">
        {parse(svgTwitter)}
      </a>
      <a href="#" title="Facebook" className="facebook-logo">
        {parse(svgFacebook)}
      </a>
    </div>
  );
}
