'use client';

if (Meteor.isServer) {
  throw new Error('This file is only imported on the client side.');
}

export default 'This file is only imported on the client side.';