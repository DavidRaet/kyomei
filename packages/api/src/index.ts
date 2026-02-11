import app from './server.js';

const port = parseInt(process.env.PORT || "3000");

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
