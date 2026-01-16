import { type ReactNode } from 'react';
import Head from './Head';
import zhCN from 'rsuite/locales/zh_CN';
import { CustomProvider } from 'rsuite';
import { HelmetProvider, type HelmetDataContext } from '@dr.pogodin/react-helmet';
import useAppReady from '../library/useAppReady';

const components = {
  Image: {
    defaultProps: {
      loading: 'lazy',
      rounded: true,
    },
  },
  ProgressCircle: {
    defaultProps: {
      showInfo: false,
      strokeWidth: 14,
    },
  },
} as const;

interface Props {
  helmetContext?: HelmetDataContext;
  children: ReactNode;
}

const App = ({ helmetContext, children }: Props) => {
  useAppReady();
  
  return (
    <>
      <CustomProvider components={components} locale={zhCN}>
        <HelmetProvider context={helmetContext}>
          <Head />
          {children}
        </HelmetProvider>
      </CustomProvider>
    </>
  );
};

export default App;
