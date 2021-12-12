export default {
  '$server:ready': [
    { '$ram.set': ['installed', { '$db.get': 'impetus.installed' }] },
    { if: [{ '!': { var: 'ram.installed' } }, { $emit: 'install' }] },
  ],

  '$server:connection': [
    { '$socket.emit': ['data', 'Welcome to Impetus!'] },
  ],

  '$server:data': [
    { if: [{ var: 'event.length' }, { '$socket.broadcast': ['data', { var: 'event' }] }] },
  ],

  install: [
    { $install: [] },
    { '$db.set': ['impetus', { $object: ['installed', true] }] },
  ],
};
