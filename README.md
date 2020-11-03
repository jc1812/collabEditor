# Collaborative Text Editor

This is a very simple implementation of a collaborative text editor that runs in the browser. It allows users to edit a document simultaneously and chat. It uses CRDTs to maintain consistency. It was built using [ace](https://ace.c9.io/) and [socket.io](https://socket.io/).

This project was something I whipped up as a little demo to cement my knowledge of CRDTs. It is, as such, a little buggy. The most obvious problem is that I handle character insertions by dividing the index of the surrounding characters. E.g if I insert a character between index 4 and 5, the new character will be at index 4.5. The result is that you run out of precision pretty quickly and can no longer add new characters between 4 and 5. A better option would be to use an array to represent each index. E.g Insert between index [4] & [5], the new index will be [4, 1]. Inserting again between index [4] & [4, 1] would result in an index of [4, 1, 1]. And so on and so forth. 

# Set Up

Clone the repo.

Install dependencies

```
npm install
```

### Launch the server.

By default the server starts on [http://localhost:3000](http://localhost:3000)

Open the example in multiple tabs to test the collab and chat features.

```
node server.js
```

# Authors

- Jordan Craig

## License

[MIT](https://choosealicense.com/licenses/mit/)
