const { Pool } = require('pg');
const { config } = require('dotenv');
const Crypto = require('crypto');

config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const getEstudiantes = async (req,res) => {
    const response = await pool.query('SELECT * FROM estudiante');
    res.status(200).json(response.rows);
}

const createEstudiante = async (req,res) => {
    const {codigo, nombre, password} = req.body;

    await pool.query('INSERT INTO usuario (codigo,nombre,password) VALUES ($1,$2,$3)',[codigo,nombre,password]).then( response => {
        console.log(response)
    }).catch( err => {
        if(err.code == '23505'){
            res.send("Error duplicado")
        }

        res.send("Error")
    });

    console.log(response)

    res.send('estudiante created');
}

const getEstudianteBySession = async (req,res) => {
    const { session } = req.body;

    const query = "SELECT u.nombre AS nombre, u.codigo AS codigo, e.carrera AS carrera, e.ciclo AS ciclo, e.estado AS estado FROM usuario as u \
    JOIN estudiante AS e on u.codigo = e.codigo \
    WHERE u.session = $1"
    await pool.query(query,[session]).then(response => {
        console.log(response.rows);
        res.status(200).json(response.rows[0]);
    }).catch(err => {
        console.log(err);
        res.status(501).json('Error');
    });
}

const getReviewsByCodigo = async (req, res)=>{
    const { codigo } = req.body;

    const query = "SELECT d.nombre as docente, m.nombre as materia, r.calificacion as calificacion, \
    r.comentario as comentario FROM review as r \
    JOIN docente as d ON d.id = r.docente_id \
    JOIN materia as m ON m.clave = r.materia_id \
    WHERE r.estudiante_codigo = $1";

    await pool.query(query,[codigo]).then(response => {
        res.status(200).json(response.rows);
    }).catch( err => {
        console.log(err);
        res.status(501).json('error');
    });
}

module.exports = {
    getEstudiantes,
    createEstudiante,
    getEstudianteBySession,
    getReviewsByCodigo
}