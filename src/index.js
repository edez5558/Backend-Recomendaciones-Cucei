const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');


app.set('port',process.env.PORT || 3000);

app.use(morgan('combined'));
app.use(cors({origin: '*'}));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use('/api/estudiante',require('./routes/estudiante.js'));
app.use('/api/review',require('./routes/review.js'))
app.use('/api/usuario',require('./routes/usuario.js'));

app.listen(app.get('port'), () => {
    console.log(`Server on port ${app.get('port')}`)
})
