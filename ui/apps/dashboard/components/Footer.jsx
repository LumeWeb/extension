import "./Footer.scss";
import classNames from "classnames";
import svgGithub from "../../../assets/icon/github.svg?raw";
import svgDiscord from "../../../assets/icon/discord.svg?raw";
import svgTwitter from "../../../assets/icon/twitter.svg?raw";
import parse from "html-react-parser";

export default function Footer({ connected }) {
  return (
    <div className={classNames("socials", { connected })}>
      <a
        href="https://github.com/LumeWeb"
        title="GitHub"
        className="github-logo">
        {parse(svgGithub)}
      </a>
      <a
        href="https://discord.gg/qpC8ADp3rS"
        title="Discord"
        className="discord-logo">
        {parse(svgDiscord)}
      </a>
      <a
        href="https://twitter.com/lumeweb3"
        title="Twitter"
        className="twitter-logo">
        {parse(svgTwitter)}
      </a>
    </div>
  );
}
