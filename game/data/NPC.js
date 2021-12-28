import axios from 'axios';
import { findTargetIndex } from '../service';

export default {
  riddler: {
    name: 'The Riddler',
    room: 'Room.car',
    Player: {},
    greet: async ({ $this, player }) => {
      // Load quest progress
      const quest = await $this.get(player.$id, {
        data: `{{ "Hello stranger, people around here call me" | dialog }} {{ "${$this.name}" | highlight }}{{ ", what can I do for ya?" | dialog }}`,
        keywords: ['help'],
      });
      return player.emit('data', quest.data);
    },
    ask: async ({ $this, player, target }) => {
      // Load quest progress
      const quest = await $this.get(player.$id, {
        data: `{{ "Hello stranger, people around here call me" | dialog }} {{ "${$this.name}" | highlight }} {{ ", what can I do for ya?" | dialog }}`,
        keywords: ['help'],
      });
      const cmd = quest.keywords[findTargetIndex(target, quest.keywords)];
      if (!cmd) throw new Error(`${$this.name} has nothing to tell you.`);
      return this.default.riddler[cmd]({ $this, player });
    },
    help: ({ $this, player }) => {
      return $this.set(player.$id, {
        data: '{{ "I may have a spare tire in the" | dialog }} {{ "shed" | highlight }} {{ "though it\'s been many years since I\'ve gone in there. Go have a look for yourself, you\'re welcome to anything you can find in that musky old place." | dialog }}',
        keywords: ['shed'],
      }).then((res) => {
        return this.default.riddler.greet({ $this, player });
      });
    },
    shed: ({ $this, player }) => {
      return $this.set(player.$id, {
        data: '{{ "The" | dialog }} {{ "shed" | highlight }} {{ "is located out in the yard; perhaps you\'ll find something of use there." | dialog }}',
        keywords: ['riddle'],
      }).then((res) => {
        return this.default.riddler.greet({ $this, player });
      });
    },
    riddle: ({ $this, player }) => {
      player.emit('dialog', `${$this.name} pauses to think for a moment...`);
      return axios.get('http://localhost:3000/riddle').then(({ data }) => {
        if (data.error) return this.default.riddler.riddle({ $this, player });

        return new Promise((resolve) => {
          player.emit('dialog', `{{ "${data.riddle}" | dialog }}`, (answer) => {
            if (answer.toLowerCase() === data.answer.toLowerCase()) return resolve(player.emit('dialog', 'You smart...'));
            return resolve(player.emit('dialog', 'You dumb...'));
          });
        }).then(() => {
          return this.default.riddler.greet({ $this, player });
        });
      });
    },
  },
};
