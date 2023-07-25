<script>
  import svgGithub from "../../../assets/icon/github.svg";
  import svgDiscord from "../../../assets/icon/discord.svg";
  import svgTwitter from "../../../assets/icon/twitter.svg";
  import svgFacebook from "../../../assets/icon/facebook.svg";
  import { waitForConnected } from "../../../../shared/util.ts";

  let connected = false;

  waitForConnected(() => {
    connected = true;
  });
</script>

<div class="socials" class:connected>
  <a href="#" title="GitHub" class="github-logo">
    {@html svgGithub}
  </a>
  <a href="#" title="Discord" class="discord-logo">
    {@html svgDiscord}
  </a>
  <a href="#" title="Twitter" class="twitter-logo">
    {@html svgTwitter}
  </a>
  <a href="#" title="Facebook" class="facebook-logo">
    {@html svgFacebook}
  </a>
</div>
