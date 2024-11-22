const express = require('express');

const app = express();

const port = 1337;




// app.set("views", "../views");
app.set("view engine", "ejs");

app.use(express.static("../client/public"));



app.get('/', (req, res) => {
    res.render('main/test.ejs'); // Renders 'test.ejs'
});


// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Run the app
app.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
});
