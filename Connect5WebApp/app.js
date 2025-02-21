const express = require('express');

const path = require('path');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json());
app.use(express.urlencoded());

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/win', (req, res) => {
    const winner = req.query.winner || 'No one'; // Default to "No one" if the parameter is missing
    res.render('win', { winner });
});



app.listen(PORT, (req, res) => {
    console.log(`Express is now listening on http://localhost:${PORT}`);
})