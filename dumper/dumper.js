const GameQueue = require('./gameQueue');
const Bot = require('./bot');

class Dumper {
	threads;

	static async init() {
		this.threads = [];
	}

	static async start() {
		while (true) {
			let gameData = GameQueue.get();

			if (gameData) {
				let promise = this.dumpGame(gameData).catch(console.error);

				// TODO: Add multi threading support
			} else {
				await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before checking the queue again
			}
		}
	}

	static async dumpGame(gameData) {
		let bot = new Bot();

		await bot.dumpGame(gameData);
	}
}

module.exports = Dumper;