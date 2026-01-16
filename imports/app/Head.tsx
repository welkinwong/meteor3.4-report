import { Meteor } from 'meteor/meteor';
import { Helmet } from '@dr.pogodin/react-helmet';

const SITE_NAME_SHORT = 'title';
const SITE_NAME_FULL = `${SITE_NAME_SHORT}${Meteor.isClient ? '' : ' | site name'}`;
const DESCRIPTION = `${SITE_NAME_SHORT} description`;

const Head = () => {
  return (
    <Helmet titleTemplate={`%s - ${SITE_NAME_FULL}`} defaultTitle={SITE_NAME_FULL}>
      <meta charSet="utf-8" />
      <meta name="description" content={DESCRIPTION} />
      <meta
        name="viewport"
        content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"
      />
      <meta name="theme-color" content="#ffffff" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={SITE_NAME_SHORT} />
      <meta property="og:site_name" content={SITE_NAME_SHORT} />
      <meta property="og:description" content={DESCRIPTION} />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
    </Helmet>
  );
};

export default Head;
