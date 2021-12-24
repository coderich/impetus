import axios from 'axios';

export default {
  riddler: {
    name: 'The Riddler',
    room: 'Room.car',
    Player: {},
    greet: async ({ $this, player }) => {
      // Load quest progress
      const quest = await $this.get(player.$id, {
        data: `^gHello stranger, people around here call me ^y${$this.name}^g, what can I do for ya?`,
        items: ['*help*'],
      });

      return new Promise((resolve) => {
        player.socket.emit('menu', quest, ({ text }) => {
          switch (text) {
            case '*help*': return this.default.riddler.help({ $this, player }).then(resolve);
            case '*shed*': return this.default.riddler.shed({ $this, player }).then(resolve);
            case '*riddle*': return this.default.riddler.riddle({ $this, player }).then(resolve);
            default: return player.scan().then(resolve);
          }
        });
      });
    },
    help: ({ $this, player }) => {
      return $this.set(player.$id, {
        data: "^gI may have a spare tire in the ^yshed; ^gthough it's been many years since I've gone in there. Go have a look for yourself, you're welcome to anything you can find in that musky old place.",
        items: ['*shed*'],
      }).then((res) => {
        return this.default.riddler.greet({ $this, player });
      });
    },
    shed: ({ $this, player }) => {
      return $this.set(player.$id, {
        data: "^gThe ^yshed ^gis located out in the yard; perhaps you'll find something of use there.",
        items: [],
      }).then((res) => {
        return this.default.riddler.greet({ $this, player });
      });
    },
    riddle: ({ $this, player }) => {
      player.socket.emit('dialog', `${$this.name} pauses to think for a moment...`);
      return axios.get('http://localhost:3000/riddle').then(({ data }) => {
        if (data.error) return this.default.riddler.riddle({ $this, player });

        return new Promise((resolve) => {
          player.socket.emit('dialog', `^g${data.riddle} `, (answer) => {
            if (answer.toLowerCase() === data.answer.toLowerCase()) return resolve(player.socket.emit('dialog', 'You smart...'));
            return resolve(player.socket.emit('dialog', 'You dumb...'));
          });
        }).then(() => {
          return this.default.riddler.greet({ $this, player });
        });
      });
    },
  },
};
