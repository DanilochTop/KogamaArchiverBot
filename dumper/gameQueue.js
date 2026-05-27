class Queue {
	/**
	 * @type {[{
	 * 	id: number,
	 * 	name: string,
	 * 	owner: string,
	 * 	requestedBy: string
	 * }]} queue
	 */
	static queue = [];

	static add(gameData) {
		this.queue.push(gameData);
	}

	static get() {
		return this.queue.shift();
	}
}

module.exports = Queue;