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
    heading: <>Thank you for supporting an open web.</>,
    content: (
      <>
        Easy Access to Web3. With native Handshake (HNS) and Ethereum (ENS)
        support, you can forget eth.link and hns.is. This is your gateway.
      </>
    ),
  },
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
    heading: <>Thank you for supporting an open web.</>,
    content: (
      <>
        Stop worrying about being vendor-locked. Remain flexible and reduce your
        storage costs by 50% or more. Lume is affordable storage on-demand.
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
