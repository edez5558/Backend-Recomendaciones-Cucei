const { Pool } = require('pg');
const { config } = require('dotenv');
const Crypto = require('crypto');
const { getReports } = require('./review.controller');

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

const isAdministrador = async (codigo) => {
    const query = 'SELECT * FROM administrador WHERE codigo = $1';

    return await pool.query(query,[codigo]).then( response => {
        return response.rowCount > 0;
    }).catch( err => {
        console.log(err);
        return false;
    });
}

const getEstudianteBySession = async (req,res) => {
    const { session } = req.body;

    const query = "SELECT u.nombre AS nombre, u.codigo AS codigo, e.carrera AS carrera, e.ciclo AS ciclo, e.estado AS estado FROM usuario as u \
    JOIN estudiante AS e on u.codigo = e.codigo \
    WHERE u.session = $1"
    const estudiante = await pool.query(query,[session]).then(response => {
        return response.rows[0];
    }).catch(err => {
        console.log(err);
        return null;
    });

    console.log(estudiante);
    if(estudiante == null){
        res.status(501).json('Error');
        return;
    }

    const reviews = await getReviewsByCodigo(estudiante.codigo);

    const response_info = {estudiante: estudiante, reviews : reviews};

    if(! await isAdministrador(estudiante.codigo)){
        res.status(200).json(response_info);
        return;
    }

    const reports = await getReports();

    const response_admin = {estudiante: estudiante, reviews: reviews, reports: reports};

    res.status(200).json(response_admin);
}

const getReviewsByCodigo = async (codigo)=>{
    const query = "SELECT r.id as id,d.nombre as docente, m.nombre as materia, r.calificacion as calificacion, \
    r.comentario as comentario FROM review as r \
    LEFT JOIN docente as d ON d.id = r.docente_id \
    LEFT JOIN materia as m ON m.clave = r.materia_id \
    WHERE r.estudiante_codigo = $1 AND r.escondido = false";

    return await pool.query(query,[codigo]).then(response => {
        return response.rows;
    }).catch( err => {
        console.log(err);
        return [];
    });
}

module.exports = {
    getEstudiantes,
    createEstudiante,
    getEstudianteBySession
}