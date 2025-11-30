import React from 'react';
import { Hello } from './Hello.jsx';
import { Info } from './Info.jsx';
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  main: {
    color: 'blue'
  }
});

export const App = () => (
  <div>
    <h1 {...stylex.props(styles.main)}>Welcome to Meteor!</h1>
    <Hello/>
    <Info/>
  </div>
);
