const { Pool } = require('pg');
const { config } = require('dotenv');

const { getReviewsByDocenteName } = require('./review.controller.js');

config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const getDocenteInfo = async (req,res) => {
    const { nombre } = req.query;

    const query = "SELECT m.departamento FROM docente_materia as dm \
    JOIN docente AS d ON d.id = dm.docente_id \
    JOIN materia AS m ON m.clave = dm.materia_id \
    WHERE d.nombre = $1";

    const docente = await pool.query(query,[nombre]).then( response => {
        console.log(response.rows);
        return response.rows;
    }).catch( err => {
        console.log(err);
        return null;
    });

    if(docente == null){
        res.status(401).json('Error');
        return;
    }


    const reviews = await getReviewsByDocenteName(nombre);

    const docente_info = { nombre: nombre ,departamentos: docente, reviews: reviews};

    res.status(200).json(docente_info);
}

module.exports = {
    getDocenteInfo
}