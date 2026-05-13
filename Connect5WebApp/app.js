const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.data')) {
            // This is the specific header the browser needs to treat it as AI weights
            res.setHeader('Content-Type', 'application/octet-stream');
        }
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/win', (req, res) => {
    const winner = req.query.winner || 'No one';
    res.render('win', { winner });
});

app.listen(PORT, () => {
    console.log(`Express is now listening on http://localhost:${PORT}`);
});