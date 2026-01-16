import React from 'react';
import { useFind, useSubscribe } from 'meteor/react-meteor-data/suspense';
import { LinksCollection } from '../api/links';
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  main: {
    color: 'blue'
  }
})

export const Info = () => {
  useSubscribe('links');
  const links = useFind(LinksCollection, [{}], []);

  return (
    <div>
      <h2 {...stylex.props(styles.main)}>Learn Meteor!</h2>
      <ul>{links.map(
        link => <li key={link._id}>
          <a href={link.url} target="_blank">{link.title}</a>
        </li>
      )}</ul>
    </div>
  );
};
