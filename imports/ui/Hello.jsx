import React, { useEffect, useState } from 'react';
import { Button } from 'rsuite';
import { useAppSelector } from '../app/slice';
import clientOnlyFile from './clientOnlyFile';

// server side should be {}
console.log('Client Only File: ', clientOnlyFile);

export const Hello = () => {
  const [counter, setCounter] = useState(0);
  const appReady = useAppSelector(state => state.appReady);
  const [clientOnlyValue, setClientOnlyValue] = useState();

  useEffect(() => {
    setClientOnlyValue(clientOnlyFile);
  }, []);

  const increment = () => {
    setCounter(counter + 1);
  };

  return (
    <div>
      <Button appearance="primary" onClick={increment}>Click Me</Button>
      <p>You've pressed the button {counter} times.</p>
      <p>App Ready: {String(appReady)}</p>
      <p>Client Only Value: {String(clientOnlyValue)}</p>
      <p>When targeting ES2015, `??` will be transpiled. Check the output: {undefined ?? 'ES2019??'}</p>
    </div>
  );
};
