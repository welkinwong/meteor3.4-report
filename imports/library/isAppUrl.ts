import { Meteor } from 'meteor/meteor';
// @ts-expect-error
import { RoutePolicy } from 'meteor/routepolicy';

const isAppUrl = (req: any) => {
  const url = req.url.pathname;
  if (url === '/favicon.ico' || url === '/robots.txt') {
    return false;
  }

  if (url === '/app.manifest') {
    return false;
  }

  // Avoid serving app HTML for declared routes such as /sockjs/.
  if (RoutePolicy.classify(url)) {
    return false;
  }
  return true;
};

export default isAppUrl;
