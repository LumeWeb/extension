import {
  createHashRouter,
  RouteObject,
  RouterProvider,
  useMatches,
} from "react-router-dom";
import Page from "./components/Page.js";
// @ts-ignore
import lumeLogo from "../../assets/lume-logo.png";
// @ts-ignore
import classNames from "classnames";
import "./App.scss";
// @ts-ignore
import browser from "webextension-polyfill";

const contentPages = [
  {
    heading: <>Thank you for supporting an open web.</>,
    content: (
      <>
        We are an independent, pure organization. We have decided not to take
        money from venture capitalists. Nor do we have a large treasury funding
        our work.
      </>
    ),
  },
  {
    heading: <>Your means to access all of the open web</>,
    content: (
      <>
        Web3 is made up of a diverse set of open networks and projects, all with
        the intention of letting you be in control.
        <br /> <br />
        You can now <i>freely</i>&nbsp;access all these platforms and services
        without a concern for censorship.
      </>
    ),
  },
  {
    heading: <>An early demo</>,
    content: (
      <>
        Be aware this system is effectively a prototype/product demo/tech demo.
        <br /> <br />
        It relies on you to provide feedback and the direction you want to see
        it evolve.
        <br /> <br />
        In short, we are here to show you what is possible with web3, and the
        rest is in your court!
        <br /> <br />
        We are starting off with: Handshake, Ethereum, and IPFS.
      </>
    ),
  },
  {
    heading: <>The next step is to create an account</>,
    content: (
      <>
        If you are new to web3, this is a 12 word code that represents your
        account. <i>Keep it safe</i>. If you share it, that person can access
        everything and <b>you cannot revoke access</b>. <br /> <br />
        If you are not new, consider this as a wallet, but for the web, not for
        crypto.
      </>
    ),
  },
] as {
  heading: React.ReactElement;
  content: React.ReactElement;
}[];

contentPages.map((page, index) => {
  if (!index) {
    return;
  }
});

const childRoutes = contentPages.slice(1).map((item, index): RouteObject => {
  return {
    path: `page-${index + 1}`,
    handle: {
      page: index + 1,
    },
  };
});

const rootRoute = {
  path: "/",
  element: <Content />,
  handle: {
    page: 0,
  },
};

const router = createHashRouter([{ ...rootRoute, children: childRoutes }]);

export default function App() {
  return (
    <>
      <header>
        <img src={lumeLogo} alt="Lume" />
      </header>
      <RouterProvider router={router} />
    </>
  );
}

function Content() {
  const routeData = useMatches();

  const accountUrl = browser.runtime.getURL("account.html");
  const handle = routeData.pop().handle as { page: number };

  const start = handle.page === 0 ? `page-1` : false;

  const next =
    !start && contentPages.length - 1 > handle.page
      ? `page-${handle.page + 1}`
      : false;
  const back = handle.page > 1 ? `page-${handle.page - 1}` : false;

  const getStarted =
    handle.page + 1 === contentPages.length ? accountUrl : false;

  const skip = handle.page === 1 ? accountUrl : false;

  return (
    <main className={classNames({ started: handle.page > 0 })}>
      {Array(contentPages.length)
        .fill(0)
        .map((_, index) => (
          <div
            className={classNames("art", `art-${index + 1}`, {
              visible: handle.page === index,
            })}
          />
        ))}

      <div className="content">
        <div>
          <Page
            heading={contentPages[handle.page].heading}
            content={contentPages[handle.page].content}
            start={start}
            skip={skip}
            back={back}
            next={next}
            getStarted={getStarted}
          />
        </div>
        <GrantInfo />
      </div>
    </main>
  );
}

function GrantInfo() {
  return (
    <div className="grant-info">
      Lume is a 503c Grant recipient,
      <a href="https://lumeweb.com">learn more</a> about the work we’re doing to
      provide accessible access to the open web for everyone.
    </div>
  );
}
