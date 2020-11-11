# Send<span>.</span>io

[Send.io](#) is a social network made with Node.js and React.

This repository contains the source code for the server side. For the client side check it out [here](https://github.com/adxl/Send.io).

## API

- #### HTTP GET:
	+ **/users/me** > GET current user data
	+ **/users/:user** > GET public user data
	+ **/invites** > GET current user friend requests
	+ **/friends** > GET friends list
	+ **/conversations** > GET user conversations
	+ **/conversations/:friend/messages** > GET conversation messages
	 
- #### HTTP POST:
	+ **/invites/send** > Send a friend request
	+ **/invites/cancel** > Cancel a sent request
	+ **/invites/accept** > Accept a friend request
	+ **/invites/deny** > Deny a friend request
	+ **/friends/unfriend** > Remove friend
	+ **/conversations/new** > Create a new conversation
	+ **/register** > Sign up    
	+ **/login** > Sign in    

- #### HTTP DELETE:
	+ **/conversations/:friend** > Delete a conversation

-	#### WS:
	+ **/ ::** > Create or join a room
	+ **/ ::send-message** > Send a message


## License

[MIT](https://github.com/adxl/Send.io_server/blob/master/LICENSE.md) &copy; [Adel Senhadji](https://github.com/adxl)