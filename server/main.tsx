import { Meteor } from 'meteor/meteor';
import { LinksCollection } from '/imports/api/links';
import { StrictMode } from 'react';
import { prerenderToNodeStream } from 'react-dom/static';
import { onPageLoad, type ServerSink } from 'meteor/server-render';
import { type StaticHandlerContext, StaticRouterProvider, createStaticHandler, createStaticRouter } from 'react-router';
import isAppUrl from '../imports/library/isAppUrl';
import { Provider } from 'react-redux';
import { EJSON } from 'meteor/ejson';
import { getStore } from '../imports/app/store';
import { Routes } from '/imports/app/Routes';
import createFetchRequest from '/imports/library/createFetchRequest';
import App from '/imports/app/App';

async function insertLink({ title, url }) {
  await LinksCollection.insertAsync({ title, url, createdAt: new Date() });
}

Meteor.startup(async () => {
  // If the Links collection is empty, add some data.
  if (await LinksCollection.find().countAsync() === 0) {
    await insertLink({
      title: 'Do the Tutorial',
      url: 'https://react-tutorial.meteor.com/simple-todos/01-creating-app.html',
    });

    await insertLink({
      title: 'Follow the Guide',
      url: 'https://guide.meteor.com',
    });

    await insertLink({
      title: 'Read the Docs',
      url: 'https://docs.meteor.com',
    });

    await insertLink({
      title: 'Discussions',
      url: 'https://forums.meteor.com',
    });
  }

  // We publish the entire Links collection to all clients.
  // In order to be fetched in real-time to the clients
  Meteor.publish("links", function () {
    return LinksCollection.find();
  });
});

const { query, dataRoutes } = createStaticHandler(Routes);

onPageLoad(async sink => {
  if (!isAppUrl((sink as ServerSink).request)) return;

  let fetchRequest;
  try {
    fetchRequest = createFetchRequest(sink as ServerSink);
  } catch (error) {
    console.error('Error creating fetch request:', error);
    return sink.redirect('/', 302); // Force redirect to root
  }

  // run actions/loaders to get the routing context with `query`
  let context;
  try {
    context = (await query(fetchRequest)) as StaticHandlerContext;
  } catch (error) {
    console.error('Error querying routing context:', error);
    return sink.redirect('/', 302); // Force redirect to root
  }

  // if `query` returns a Response, send it raw (a route probably redirected)
  if (context instanceof Response && [301, 302].includes(context.status)) {
    return sink.redirect(context.headers.get('Location') ?? '/', context.status);
  }

  // Create a static router for SSR
  const router = createStaticRouter(dataRoutes, context);

  // Get auth token from request headers

  const store = getStore(
    {
      app: {
        appReady: false,
      },
    }
  );

  const helmetContext = {} as any;

  const AppTSX = (
    <StrictMode>
      <Provider store={store}>
        <App helmetContext={helmetContext}>
          <StaticRouterProvider router={router} context={context} />
        </App>
      </Provider>
    </StrictMode>
  );

  const { prelude } = await prerenderToNodeStream(AppTSX);

  sink.renderIntoElementById('react-target', prelude);

  const { helmet } = helmetContext;
  ['base', 'meta', 'link', 'script', 'style', 'title', 'noscript'].forEach(tag => {
    sink.appendToHead(helmet[tag].toString());
  });

  const initialData = store.getState();

  sink.appendToBody!(`
    <script id="preloaded-state">
      window.__PRELOADED_STATE__ = decodeURIComponent("${encodeURIComponent(EJSON.stringify(initialData))}")
    </script>
  `);
});
