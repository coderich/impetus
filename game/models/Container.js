import { get } from 'lodash';
import { spawn } from '../service';

export default {
  open: async ({ $this, $dao, player, data }) => {
    const container = await $this.get();
    const itemsPath = container.items.Player ? `items.${player.$id}` : 'items';

    if (!get(container, itemsPath)) {
      await $this.set(itemsPath, []);
      await spawn($this, $dao, $this.spawns, { player });
    }

    const items = await container.hydrate(itemsPath, []);
    const list = items.map(el => ` * ${el.name}`).join('\n');

    player.emit('data', `You open the ${container.name}, ${list.length ? `and find:\n${list}` : 'but it\'s empty.'}`);
    // player.emit('menu', { data, items: items.map(i => i.name) }, async ({ index }) => {
    //   if (!index) return player.scan();
    //   const item = items[index - 1];
    //   const id = await container.pull(itemsPath, item.$id);
    //   if (!id) return container.open({ player, data: 'That item is no longer there.' });
    //   await player.push('items', id);
    //   return container.open({ player, data: `You take the ${item.name}.` });
    // });
  },
};
