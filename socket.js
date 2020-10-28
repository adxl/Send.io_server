const io = require('socket.io')(http);

io.on('connect', (socket) => {
	const { id } = socket.handshake.query;
	console.log(`${id} connected`);
	socket.join(id);

	socket.on('send-message', (data) => {
		const { sender } = data;
		const { message } = data;

		io.emit('receive-message', `${sender} said : ${message}`);
		console.log(`${sender} said : ${message}`);
	});

	socket.on('disconnect', () => console.log(`${id} left`));
});
